from fastapi import APIRouter
from controllers.question_controller import QuestionController
from models.question import Question


def create_question_router(controller: QuestionController):
    router = APIRouter()

    @router.get("/question/random", response_class=Question)
    async def get_question():
        return await controller.get_random_question()

    return router
