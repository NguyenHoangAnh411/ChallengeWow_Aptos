from fastapi import HTTPException
from services.answer_service import AnswerService
from datetime import datetime

class AnswerController:
    def __init__(self, answer_service: AnswerService):
        self.answer_service = answer_service

    def submit_answer(self, room_id: str, player_id: str, question_id: str, answer: str, score: float, timestamp: datetime):
        try:
            self.answer_service.save_player_answer(room_id, player_id, question_id, answer, score, timestamp)
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))