import os
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.websocket_controller import WebSocketController
from repositories.implement.room_repo_impl import RoomRepository
from repositories.implement.player_repo_impl import PlayerRepository
from repositories.implement.question_repo_impl import QuestionRepository
from repositories.implement.answer_repo_impl import AnswerRepository
from repositories.implement.zkproof_repo_impl import ZkProofRepository

from routers.websocket_router import create_ws_router
from services.game_service import GameService
from services.room_service import RoomService
from services.player_service import PlayerService
from services.question_service import QuestionService
from services.answer_service import AnswerService
from services.websocket_manager import WebSocketManager
from services.zkproof_service import ZkProofService

from controllers.room_controller import RoomController
from controllers.player_controller import PlayerController
from controllers.question_controller import QuestionController
from controllers.answer_controller import AnswerController
from controllers.zkproof_controller import ZkProofController
from controllers.user_controller import UserController

from routers.room_router import create_room_router
from routers.player_router import create_player_router
from routers.question_router import create_question_router
from routers.answer_router import create_answer_router
from routers.zkproof_router import create_zkproof_router
from routers.user_router import create_user_router

app = FastAPI(title="Challenge Wave API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Repositories
player_repo = PlayerRepository()
room_repo = RoomRepository(player_repo=player_repo)
question_repo = QuestionRepository()
answer_repo = AnswerRepository()
zkproof_repo = ZkProofRepository()

# Services
room_service = RoomService(room_repo, player_repo)
player_service = PlayerService(player_repo, room_repo)
question_service = QuestionService(question_repo)
answer_service = AnswerService(answer_repo)
zkproof_service = ZkProofService(zkproof_repo)
game_service = GameService(room_service, question_service, zkproof_service)
websocket_manager = WebSocketManager()

# Controllers
room_controller = RoomController(room_service, game_service, player_service, websocket_manager)
player_controller = PlayerController(player_service)
question_controller = QuestionController(question_service)
answer_controller = AnswerController(answer_service, room_service)
zkproof_controller = ZkProofController(zkproof_service)
user_controller = UserController()
websocket_controller = WebSocketController(websocket_manager, player_service, room_service)

# Router
api_router = APIRouter(prefix="/api")

# Add your routers to the api_router
api_router.include_router(create_room_router(room_controller))
api_router.include_router(create_player_router(player_controller))
api_router.include_router(create_question_router(question_controller))
api_router.include_router(create_answer_router(answer_controller))
api_router.include_router(create_zkproof_router(zkproof_controller))
api_router.include_router(create_user_router(user_controller))
ws_router = create_ws_router(websocket_controller)

app.include_router(api_router)
app.include_router(ws_router, prefix="/ws")

PORT = int(os.getenv("PORT")) or 9000
HOST = "0.0.0.0"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
