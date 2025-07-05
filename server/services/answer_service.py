from typing import List
from models.answer import Answer
from repositories.interfaces.answer_repo import IAnswerRepository

class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository):
        self.answer_repo = answer_repo

    async def save_player_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

    async def get_answers_by_wallet_id(self, room_id: str, wallet_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_wallet_id(room_id, wallet_id)

    async def get_answers_by_room_and_question(self, room_id: str, question_index: int) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question(room_id, question_index)

    async def get_answers_by_room_and_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question_id(room_id, question_id)

    async def save_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

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
