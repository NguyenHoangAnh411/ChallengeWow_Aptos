from fastapi import APIRouter

from controllers.answer_controller import AnswerController
from models.answer_submission import AnswerSubmission

def create_answer_router(controller: AnswerController):
    router = APIRouter()

    @router.post("/submit-answer")
    def submit_answer(submission: AnswerSubmission):
        return controller.submit_answer(
            submission.room_id,
            submission.player_id,
            submission.question_id,
            submission.answer,
            submission.score,
            submission.timestamp
        )

    return router