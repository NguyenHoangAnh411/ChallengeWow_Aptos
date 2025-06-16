from fastapi import APIRouter
from controllers.question_controller import QuestionController


def create_question_router(controller: QuestionController):
    router = APIRouter()

    @router.get("/question/random")
    def get_question():
        return controller.get_random_question()

    return router
