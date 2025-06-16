from fastapi import HTTPException
from services.question_service import QuestionService

class QuestionController:
    def __init__(self, question_service: QuestionService):
        self.question_service = question_service

    def get_random_question(self):
        question = self.question_service.get_random_question()
        if not question:
            raise HTTPException(status_code=404, detail="No questions available")
        return question