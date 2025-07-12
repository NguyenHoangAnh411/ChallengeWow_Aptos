import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from config.question_config import QUESTION_CONFIG
from models.question import Question
from models.room import Room
from services.answer_service import AnswerService
from services.question_service import QuestionService
from services.zkproof_service import ZkProofService
from services.room_service import RoomService
from services.tie_break_service import TieBreakService
from enums.game_status import GAME_STATUS
import hashlib
import json


class GameService:
    def __init__(
        self,
        room_service: RoomService,
        question_service: QuestionService,
        zkproof_service: ZkProofService,
        answer_service: AnswerService,
    ):
        self.room_service = room_service
        self.question_service = question_service
        self.zkproof_service = zkproof_service
        self.answer_service = answer_service
    
    async def get_final_results(self, room_id: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]], datetime, Optional[str]]:
        room: Room = await self.room_service.get_room(room_id)
        if not room:
            raise ValueError("Room not found")

        # 📝 Giả định bạn lưu kết quả answers ở đâu đó (ví dụ trong room hoặc DB riêng)
        results = await self.answer_service.get_game_results(room_id)

        if not results:
            return {}, [], datetime.now(timezone.utc), None

        # Sort kết quả theo điểm
        sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)

        # Người chiến thắng là người có điểm cao nhất
        winner_wallet = sorted_results[0]["wallet"] if sorted_results else None

        # Tính game_stats tổng quan
        total_players = len(sorted_results)
        total_questions = room.total_questions if hasattr(room, 'total_questions') else 0
        total_correct_answers = sum(
            len([a for a in player["answers"] if a.get("score", 0) > 0]) for player in sorted_results
        )
        total_answers = sum(len(player["answers"]) for player in sorted_results)

        game_stats = {
            "totalPlayers": total_players,
            "totalQuestions": total_questions,
            "totalCorrectAnswers": total_correct_answers,
            "totalAnswers": total_answers,
            "accuracy": round((total_correct_answers / total_answers * 100), 2) if total_answers > 0 else 0.0
        }

        # Thời gian kết thúc: lấy từ room hoặc fallback là now
        game_end_time = getattr(room, 'ended_at', datetime.utcnow())

        return game_stats, sorted_results, game_end_time, winner_wallet

    async def start_countdown(self, room: Room):
        room.status = GAME_STATUS.COUNTING_DOWN
        self.room_service.save_room(room)

        await asyncio.sleep(180)

        if len(room.players) >= 2:
            await self.start_game(room)
        else:
            room.status = GAME_STATUS.WAITING
            self.room_service.save_room(room)

    async def start_game(self, room: Room):
        room.status = GAME_STATUS.IN_PROGRESS
        room.started_at = datetime.now(timezone.utc)
        self.room_service.save_room(room)

        for _ in range(5):
            question = self.question_service.get_random_question()
            if room.current_questions is None:
                room.current_questions = []
            room.current_questions.append(question)
            self.room_service.save_room(room)

            await asyncio.sleep(15)

            for player in room.players:
                if not any(
                    a.get("question_id") == question["id"] for a in player.answers
                ):
                    player.answers.append(
                        {"question_id": question["id"], "answer": None, "score": 0}
                    )

        await self.end_game(room)

    async def end_game(self, room: Room):
        """End the main game and check for tie-break"""
        room.status = GAME_STATUS.FINISHED
        
        # Check if tie-break is needed
        if self.tie_break_service.check_for_tie_break(room):
            # Activate tie-break
            room = await self.tie_break_service.activate_tie_break(room)
            return
        
        # No tie-break needed, determine winner
        winner = max(room.players, key=lambda p: p.score)
        room.winner_wallet_id = winner.wallet_id
        room.status = GAME_STATUS.COMPLETED
        room.ended_at = datetime.now(timezone.utc)

        proof = self.generate_fake_proof(room)
        room.proof = proof

        self.room_service.save_room(room)

        scores = [
            {"player_id": p.id, "username": p.username, "score": p.score}
            for p in room.players
        ]

        self.zkproof_service.store_proof(room.room_id, winner.wallet_id, proof, scores)

    def generate_fake_proof(self, room: Room) -> str:
        data = {
            "room_id": room.room_id,
            "winner_wallet_id": room.winner_wallet_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "scores": [{"player_id": p.id, "score": p.score} for p in room.players],
        }
        return hashlib.sha256(json.dumps(data).encode()).hexdigest()

    @staticmethod
    def calculate_score(
        is_correct: bool, response_time: float, question: Question
    ) -> float:
        if not is_correct:
            return 0

        config = QUESTION_CONFIG.get(question.difficulty)
        if not config:
            raise ValueError(f"Unknown difficulty level: {question.difficulty}")

        base_score = config["score"]
        time_limit = config["time"]

        bonus = 0
        if config.get("speed_bonus_enabled", False):
            bonus = max(config["max_speed_bonus"] * (1 - response_time / time_limit), 0)

        return base_score + int(bonus)
