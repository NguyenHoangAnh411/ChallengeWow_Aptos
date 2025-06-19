from repositories.interfaces.answer_repo import IAnswerRepository
from datetime import datetime


class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository):
        self.answer_repo = answer_repo

    def save_player_answer(
        self,
        room_id: str,
        user_id: str,
        question_id: str,
        selected_index: int,
        is_correct: bool,
        time_taken: float,
        timestamp: datetime,
    ):
        self.answer_repo.save(
            room_id=room_id,
            user_id=user_id,
            selected_index=selected_index,
            time_taken=time_taken,
            question_id=question_id,
            is_correct=is_correct,
            timestamp=timestamp
        )
