from typing import List
from models.answer import Answer
from repositories.interfaces.answer_repo import IAnswerRepository

class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository):
        self.answer_repo = answer_repo

    async def save_player_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

    async def save_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

    async def get_answers_by_wallet_id(self, room_id: str, wallet_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_wallet_id(room_id, wallet_id)

    async def get_answers_by_room_and_question(self, room_id: str, question_index: int) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question(room_id, question_index)

    async def get_answers_by_room_and_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question_id(room_id, question_id)

    async def get_answer_count_by_room_and_question(self, room_id: str, question_index: int) -> int:
        """Get the count of answers for a specific question in a room"""
        answers = await self.answer_repo.get_answers_by_room_and_question(room_id, question_index)
        return len(answers)

    async def get_correct_answers_by_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        """Get all correct answers for a specific question in a room, ordered by submission time"""
        answers = await self.answer_repo.get_answers_by_room_and_question_id(room_id, question_id)
        # Filter correct answers and sort by submission time
        correct_answers = [answer for answer in answers if answer.is_correct]
        correct_answers.sort(key=lambda x: x.submitted_at if x.submitted_at else 0)
        return correct_answers

    # Tie-break specific methods
    async def get_tie_break_answers_by_room(self, room_id: str) -> List[Answer]:
        """Get all tie-break and sudden death answers for a room"""
        return await self.answer_repo.get_tie_break_answers_by_room(room_id)

    async def get_tie_break_answers_by_round(self, room_id: str, tie_break_round: int) -> List[Answer]:
        """Get tie-break answers for a specific round"""
        return await self.answer_repo.get_tie_break_answers_by_round(room_id, tie_break_round)

    async def get_tie_break_winner_streak(self, room_id: str) -> dict:
        """Get current win streak for each player in tie-break"""
        tie_break_answers = await self.get_tie_break_answers_by_room(room_id)
        
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
