from repositories.interfaces.answer_repo import IAnswerRepository
from datetime import datetime


class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository):
        self.answer_repo = answer_repo

    def save_player_answer(
        self,
        room_id: str,
        player_id: str,
        question_id: str,
        answer: str,
        score: float,
        timestamp: datetime,
    ):
        self.answer_repo.save(room_id, player_id, question_id, answer, score, timestamp)
