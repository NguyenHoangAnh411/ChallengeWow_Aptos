from fastapi import APIRouter

from controllers.answer_controller import AnswerController
from models.answer_submission import AnswerSubmission


def create_answer_router(controller: AnswerController):
    router = APIRouter()

    @router.post("/submit-answer")
    async def submit_answer(submission: AnswerSubmission):
        return await controller.submit_answer(
            submission.room_id,
            submission.wallet_id,
            submission.question_id,
            submission.answer,
            submission.timestamp,
        )

    @router.post("/timeout/{room_id}/{question_id}")
    async def handle_timeout(room_id: str, question_id: str):
        return await controller.handle_no_answer_timeout(room_id, question_id)

    return router
