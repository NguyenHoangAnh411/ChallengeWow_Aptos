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
