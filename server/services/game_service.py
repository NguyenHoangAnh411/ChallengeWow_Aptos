import asyncio
from datetime import datetime, timezone
from models.room import Room
from services.question_service import QuestionService
from services.zkproof_service import ZkProofService
from services.room_service import RoomService
from enums.game_status import GAME_STATUS
import hashlib
import json

class GameService:
    def __init__(self, room_service: RoomService, question_service: QuestionService, zkproof_service: ZkProofService):
        self.room_service = room_service
        self.question_service = question_service
        self.zkproof_service = zkproof_service

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
        room.start_time = datetime.now(timezone.utc)
        self.room_service.save_room(room)

        for _ in range(5):
            question = self.question_service.get_random_question()
            room.current_question = question
            self.room_service.save_room(room)

            await asyncio.sleep(15)

            for player in room.players:
                if not any(a.get("question_id") == question["id"] for a in player.answers):
                    player.answers.append({
                        "question_id": question["id"],
                        "answer": None,
                        "score": 0
                    })

        await self.end_game(room)

    async def end_game(self, room: Room):
        room.status = GAME_STATUS.FINISHED
        winner = max(room.players, key=lambda p: p.score)
        room.winner = winner.id

        proof = self.generate_fake_proof(room)
        room.proof = proof

        self.room_service.save_room(room)

        scores = [{"player_id": p.id, "username": p.username, "score": p.score} for p in room.players]

        self.zkproof_service.store_proof(room.id, winner.id, proof, scores)

    def generate_fake_proof(self, room: Room) -> str:
        data = {
            "room_id": room.id,
            "winner": room.winner,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "scores": [{"player_id": p.id, "score": p.score} for p in room.players]
        }
        return hashlib.sha256(json.dumps(data).encode()).hexdigest()

    def calculate_score(self, answer_time: datetime, question_time: datetime) -> int:
        time_diff = (answer_time - question_time).total_seconds()
        if time_diff <= 15:
            return max(0, 15 - int(time_diff))
        return 0
