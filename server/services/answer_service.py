from models.answer import Answer
from repositories.interfaces.answer_repo import IAnswerRepository
from datetime import datetime


class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository):
        self.answer_repo = answer_repo

    def save_player_answer(
        self,
        answer: Answer
    ):
        self.answer_repo.save(
            answer
        )
        
    def get_answers_by_wallet_id(self, wallet_id: str, room_id: str):
        return self.answer_repo.get_answers_by_wallet_id(room_id, wallet_id)
