import os
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from repositories.implement.room_repo_impl import RoomRepository
from repositories.implement.player_repo_impl import PlayerRepository
from repositories.implement.question_repo_impl import QuestionRepository
from repositories.implement.answer_repo_impl import AnswerRepository
from repositories.implement.zkproof_repo_impl import ZkProofRepository

from services.game_service import GameService
from services.room_service import RoomService
from services.player_service import PlayerService
from services.question_service import QuestionService
from services.answer_service import AnswerService
from services.zkproof_service import ZkProofService

from controllers.room_controller import RoomController
from controllers.player_controller import PlayerController
from controllers.question_controller import QuestionController
from controllers.answer_controller import AnswerController
from controllers.zkproof_controller import ZkProofController

from routers.room_router import create_room_router
from routers.player_router import create_player_router
from routers.question_router import create_question_router
from routers.answer_router import create_answer_router
from routers.zkproof_router import create_zkproof_router

app = FastAPI(title="Challenge Wave API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Repositories
room_repo = RoomRepository()
player_repo = PlayerRepository()
question_repo = QuestionRepository()
answer_repo = AnswerRepository()
zkproof_repo = ZkProofRepository()

# Services
room_service = RoomService(room_repo, player_repo)
player_service = PlayerService(player_repo)
question_service = QuestionService(question_repo)
answer_service = AnswerService(answer_repo)
zkproof_service = ZkProofService(zkproof_repo)
game_service = GameService(room_service, question_service, zkproof_service)

# Controllers
room_controller = RoomController(room_service, game_service)
player_controller = PlayerController(player_service)
question_controller = QuestionController(question_service)
answer_controller = AnswerController(answer_service)
zkproof_controller = ZkProofController(zkproof_service)

# Router
api_router = APIRouter(prefix="/api")

# Add your routers to the api_router
api_router.include_router(create_room_router(room_controller))
api_router.include_router(create_player_router(player_controller))
api_router.include_router(create_question_router(question_controller))
api_router.include_router(create_answer_router(answer_controller))
api_router.include_router(create_zkproof_router(zkproof_controller))

app.include_router(api_router)

PORT = int(os.getenv("PORT")) or 9000
HOST = "0.0.0.0"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
