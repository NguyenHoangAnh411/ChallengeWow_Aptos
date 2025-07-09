from datetime import datetime, timezone
from typing import List, Optional, Tuple
from models.room import Room
from models.player import Player
from models.question import Question
from models.answer import Answer
from services.question_service import QuestionService
from services.room_service import RoomService
from services.answer_service import AnswerService
from enums.game_status import GAME_STATUS
from enums.question_difficulty import QUESTION_DIFFICULTY
from enums.answer_type import ANSWER_TYPE
import asyncio


class TieBreakService:
    def __init__(
        self,
        room_service: RoomService,
        question_service: QuestionService,
        answer_service: AnswerService,
    ):
        self.room_service = room_service
        self.question_service = question_service
        self.answer_service = answer_service

    def check_for_tie_break(self, room: Room) -> bool:
        """Check if tie-break should be activated"""
        if len(room.players) < 2:
            return False
        scores = [p.score for p in room.players]
        return all(s == scores[0] for s in scores)

    async def activate_tie_break(self, room: Room) -> Room:
        """Activate tie-break mode"""
        room.status = GAME_STATUS.TIE_BREAK
        room.tie_break_round = 1
        room.tie_break_started_at = datetime.now(timezone.utc)
        room.tie_break_current_index = 0
        
        # Generate tie-break questions based on difficulty progression
        await self._generate_tie_break_questions(room)
        
        await self.room_service.save_room(room)
        return room

    async def _generate_tie_break_questions(self, room: Room):
        """Generate questions for tie-break with increasing difficulty"""
        questions = []
        
        # Round 1: Medium questions
        for _ in range(3):
            question = await self.question_service.get_random_question_by_difficulty(QUESTION_DIFFICULTY.MEDIUM)
            if question:
                questions.append(question)
        
        # Round 2: Hard questions (if needed)
        if room.tie_break_round >= 2:
            for _ in range(3):
                question = await self.question_service.get_random_question_by_difficulty(QUESTION_DIFFICULTY.HARD)
                if question:
                    questions.append(question)
        
        room.tie_break_questions = questions

    async def submit_tie_break_answer(
        self, 
        room: Room, 
        wallet_id: str, 
        answer_text: str,
        question_id: str
    ) -> Tuple[Room, dict]:
        """Submit answer during tie-break"""
        
        # Find the question
        question = None
        if room.tie_break_questions:
            for q in room.tie_break_questions:
                # Handle both dict and object access
                q_id = q.get("id") if isinstance(q, dict) else getattr(q, 'id', None)
                if q_id == question_id:
                    question = q
                    break
        
        if not question:
            raise ValueError("Question not found in tie-break")
        
        # Check if answer is correct
        correct_answer = question.get("correct_answer", "") if isinstance(question, dict) else getattr(question, 'correct_answer', "")
        is_correct = answer_text.lower().strip() == correct_answer.lower().strip()
        
        # Create answer record and save to database
        answer = Answer(
            question_id=question_id,
            wallet_id=wallet_id,
            room_id=room.id,
            answer=answer_text,
            is_correct=is_correct,
            score=1 if is_correct else 0,
            response_time=0.0,  # Tie-break doesn't use response time
            answer_type=ANSWER_TYPE.TIE_BREAK,
            tie_break_round=room.tie_break_round,
            submitted_at=datetime.now(timezone.utc)
        )
        
        await self.answer_service.save_answer(answer)
        
        # Check for win conditions
        win_result = await self._check_tie_break_win_conditions(room)
        
        await self.room_service.save_room(room)
        return room, win_result

    async def _check_tie_break_win_conditions(self, room: Room) -> dict:
        """Check if any player has won the tie-break"""
        # Lưu lại lịch sử người thắng từng round
        if not hasattr(room, 'tie_break_winners') or room.tie_break_winners is None:
            room.tie_break_winners = []

        # Lấy điểm từng người chơi trong round này
        round_answers = await self.answer_service.get_answers_by_room_and_question_id(room.id, "")
        round_answers = [a for a in round_answers if a.answer_type == ANSWER_TYPE.TIE_BREAK and a.tie_break_round == room.tie_break_round]
        
        # Tính điểm từng người chơi trong round này
        player_scores = {}
        for p in room.players:
            player_scores[p.wallet_id] = sum(a.score for a in round_answers if a.wallet_id == p.wallet_id)
        
        # Tìm người có điểm cao nhất round này (có thể nhiều người hòa)
        if player_scores:
            max_score = max(player_scores.values())
            winners = [wid for wid, s in player_scores.items() if s == max_score]
            if len(winners) == 1:
                room.tie_break_winners.append(winners[0])
            else:
                room.tie_break_winners.append(None)  
        else:
            room.tie_break_winners.append(None)

        # Kiểm tra nếu ai thắng 2 round liên tiếp
        if len(room.tie_break_winners) >= 2:
            last = room.tie_break_winners[-1]
            prev = room.tie_break_winners[-2]
            if last is not None and last == prev:
                return await self._end_tie_break_with_winner(room, last)

        # Chuyển sudden death nếu quá 10 round
        if room.tie_break_round >= 10:
            return await self._activate_sudden_death(room)

        # Nếu hết câu hỏi trong round này thì sang round tiếp theo
        if room.tie_break_questions and room.tie_break_current_index >= len(room.tie_break_questions) - 1:
            return await self._handle_tie_break_round_completion(room)

        return {"status": "continue", "message": "Tie-break continues"}

    async def _get_tie_break_winner_streak(self, room_id: str) -> dict:
        """Get current win streak for each player in tie-break from database"""
        # Get all tie-break answers for this room
        tie_break_answers = await self.answer_service.get_answers_by_room_and_question_id(room_id, "")
        tie_break_answers = [a for a in tie_break_answers if a.answer_type in [ANSWER_TYPE.TIE_BREAK, ANSWER_TYPE.SUDDEN_DEATH]]
        
        # Sort by submission time
        tie_break_answers.sort(key=lambda x: x.submitted_at or x.created_at)
        
        streaks = {}
        for answer in tie_break_answers:
            wallet_id = answer.wallet_id
            if wallet_id not in streaks:
                streaks[wallet_id] = 0
            
            if answer.is_correct:
                streaks[wallet_id] += 1
            else:
                streaks[wallet_id] = 0
        
        return streaks

    async def _end_tie_break_with_winner(self, room: Room, winner_wallet_id: str) -> dict:
        """End tie-break with a winner"""
        room.status = GAME_STATUS.FINISHED
        room.winner_wallet_id = winner_wallet_id
        room.ended_at = datetime.now(timezone.utc)
        
        # Mark winner
        for player in room.players:
            if player.wallet_id == winner_wallet_id:
                player.is_winner = True
                break
        
        await self.room_service.save_room(room)
        
        winner = next(p for p in room.players if p.wallet_id == winner_wallet_id)
        return {
            "status": "winner",
            "winner_wallet_id": winner_wallet_id,
            "winner_username": winner.username,
            "message": f"{winner.username} đã thắng Tie-Break và giành chiến thắng cuối cùng!"
        }

    async def _handle_tie_break_round_completion(self, room: Room) -> dict:
        """Handle completion of a tie-break round"""
        # Check if any answers were submitted in this round
        round_answers = await self.answer_service.get_answers_by_room_and_question_id(room.id, "")
        round_answers = [
            a for a in round_answers 
            if a.answer_type == ANSWER_TYPE.TIE_BREAK and a.tie_break_round == room.tie_break_round
        ]
        
        if not round_answers:
            # No answers submitted, cancel game
            room.status = GAME_STATUS.CANCELLED
            room.ended_at = datetime.now(timezone.utc)
            await self.room_service.save_room(room)
            return {
                "status": "cancelled",
                "message": "No answers found! Game Cancelled!"
            }
        
        # Check if we should activate sudden death
        if room.tie_break_round >= 2:
            return await self._activate_sudden_death(room)
        
        # Start next tie-break round
        room.tie_break_round += 1
        room.tie_break_current_index = 0
        await self._generate_tie_break_questions(room)
        await self.room_service.save_room(room)
        
        return {
            "status": "next_round",
            "round": room.tie_break_round,
            "message": f"Tie-Break Round {room.tie_break_round}. Ai thắng 2 lượt liên tiếp sẽ chiến thắng!"
        }

    async def _activate_sudden_death(self, room: Room) -> dict:
        """Activate sudden death mode"""
        room.status = GAME_STATUS.SUDDEN_DEATH
        room.sudden_death_activated = True
        await self.room_service.save_room(room)
        
        return {
            "status": "sudden_death",
            "message": "Sudden Death kích hoạt! Ai trả lời đúng trước sẽ thắng ngay lập tức!"
        }

    async def submit_sudden_death_answer(
        self, 
        room: Room, 
        wallet_id: str, 
        answer_text: str,
        question_id: str
    ) -> Tuple[Room, dict]:
        """Submit answer during sudden death"""
        
        # Find the question
        question = None
        if room.tie_break_questions:
            for q in room.tie_break_questions:
                # Handle both dict and object access
                q_id = q.get("id") if isinstance(q, dict) else getattr(q, 'id', None)
                if q_id == question_id:
                    question = q
                    break
        
        if not question:
            raise ValueError("Question not found in sudden death")
        
        # Check if answer is correct
        correct_answer = question.get("correct_answer", "") if isinstance(question, dict) else getattr(question, 'correct_answer', "")
        is_correct = answer_text.lower().strip() == correct_answer.lower().strip()
        
        # Create answer record and save to database
        answer = Answer(
            question_id=question_id,
            wallet_id=wallet_id,
            room_id=room.id,
            answer=answer_text,
            is_correct=is_correct,
            score=1 if is_correct else 0,
            response_time=0.0,
            answer_type=ANSWER_TYPE.SUDDEN_DEATH,
            tie_break_round=room.tie_break_round,
            submitted_at=datetime.now(timezone.utc)
        )
        
        await self.answer_service.save_answer(answer)
        
        if is_correct:
            # Winner found!
            result = await self._end_tie_break_with_winner(room, wallet_id)
            return room, result
        else:
            # Wrong answer, continue sudden death
            await self.room_service.save_room(room)
            return room, {
                "status": "continue",
                "message": "Câu trả lời sai. Sudden Death tiếp tục!"
            }

    async def handle_no_answer_timeout(self, room: Room, question_id: str) -> dict:
        """Handle timeout when no one answers a tie-break question"""
        # Mark both players as not answering (wrong answer)
        for player in room.players:
            answer = Answer(
                question_id=question_id,
                wallet_id=player.wallet_id,
                room_id=room.id,
                answer="",
                is_correct=False,
                score=0,
                response_time=0.0,
                answer_type=ANSWER_TYPE.TIE_BREAK if room.status == GAME_STATUS.TIE_BREAK else ANSWER_TYPE.SUDDEN_DEATH,
                tie_break_round=room.tie_break_round,
                submitted_at=datetime.now(timezone.utc)
            )
            await self.answer_service.save_answer(answer)
        
        await self.room_service.save_room(room)
        
        # Check if we should move to next question or end round
        if room.tie_break_questions and room.tie_break_current_index >= len(room.tie_break_questions) - 1:
            return await self._handle_tie_break_round_completion(room)
        
        return {
            "status": "continue",
            "message": "Không có câu trả lời nào được gửi. Sang câu tiếp theo."
        }

    def get_tie_break_status_message(self, room: Room) -> str:
        """Get appropriate status message for tie-break"""
        if room.status == GAME_STATUS.TIE_BREAK:
            return f"Tie-Break Round {room.tie_break_round}. Ai thắng 2 lượt liên tiếp sẽ chiến thắng!"
        elif room.status == GAME_STATUS.SUDDEN_DEATH:
            return "Sudden Death kích hoạt! Ai trả lời đúng trước sẽ thắng ngay lập tức!"
        else:
            return "Trận đấu hòa! Bắt đầu Tie-Break để phân thắng bại." 