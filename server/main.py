import os
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.database import init_async_supabase
from routers.websocket_router import create_ws_router
from routers.room_router import create_room_router
from routers.player_router import create_player_router
from routers.question_router import create_question_router
from routers.answer_router import create_answer_router
from routers.zkproof_router import create_zkproof_router
from routers.user_router import create_user_router
from routers.nft_router import create_nft_router
from routers.aptos_router import create_aptos_router
from routers.user_post_router import create_user_post_router

from controllers.websocket_controller import WebSocketController
from controllers.room_controller import RoomController
from controllers.player_controller import PlayerController
from controllers.question_controller import QuestionController
from controllers.answer_controller import AnswerController
from controllers.zkproof_controller import ZkProofController
from controllers.user_controller import UserController
from controllers.nft_controller import NFTController
from controllers.aptos_controller import AptosController
from controllers.user_post_controller import UserPostController

from services.websocket_manager import WebSocketManager
from repositories.implement.zkproof_repo_impl import ZkProofRepository
from services.zkproof_service import ZkProofService
from services.game_service import GameService
from services.tie_break_service import TieBreakService

from repositories.implement.room_repo_impl import RoomRepository
from repositories.implement.player_repo_impl import PlayerRepository
from repositories.implement.question_repo_impl import QuestionRepository
from repositories.implement.answer_repo_impl import AnswerRepository
from repositories.implement.user_repo_impl import UserRepository, UserStatsRepository
from repositories.implement.user_post_repo_impl import UserPostRepository

from services.room_service import RoomService
from services.player_service import PlayerService
from services.question_service import QuestionService
from services.answer_service import AnswerService
from services.user_post_service import UserPostService

# -------------------- App Init --------------------
app = FastAPI(title="Challenge Wave API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:6789",
        "http://127.0.0.1:6789",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Lifespan --------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    supabase = await init_async_supabase()
    app.state.async_supabase = supabase

    # Repositories
    player_repo = PlayerRepository(supabase=supabase)
    room_repo = RoomRepository(player_repo=player_repo, supabase=supabase)
    question_repo = QuestionRepository(supabase=supabase)
    user_repo = UserRepository(supabase=supabase)
    answer_repo = AnswerRepository(supabase=supabase)
    user_stats_repo = UserStatsRepository(supabase=supabase)
    user_post_repo = UserPostRepository(supabase=supabase)

    # Services
    room_service = RoomService(room_repo, player_repo, answer_repo)
    player_service = PlayerService(player_repo, room_repo)
    question_service = QuestionService(question_repo)
    answer_service = AnswerService(answer_repo, user_repo)
    zkproof_service = ZkProofService(ZkProofRepository())
    game_service = GameService(room_service, question_service, zkproof_service, answer_service)
    websocket_manager = WebSocketManager()
    user_post_service = UserPostService(user_post_repo)

    # Controllers
    app.state.room_controller = RoomController(room_service, game_service, player_service, websocket_manager)
    app.state.player_controller = PlayerController(player_service, websocket_manager)
    app.state.question_controller = QuestionController(question_service)
    app.state.answer_controller = AnswerController(answer_service, room_service, game_service)
    app.state.user_controller = UserController(user_repo, user_stats_repo)
    app.state.zkproof_controller = ZkProofController(zkproof_service)
    app.state.websocket_controller = WebSocketController(websocket_manager, player_service, room_service, question_service, answer_service, user_repo, user_stats_repo)
    app.state.nft_controller = NFTController()
    app.state.aptos_controller = AptosController()
    app.state.user_post_controller = UserPostController(user_post_service)

    # Router Setup
    api_router = APIRouter(prefix="/api")
    api_router.include_router(create_room_router(app.state.room_controller))
    api_router.include_router(create_player_router(app.state.player_controller))
    api_router.include_router(create_question_router(app.state.question_controller))
    api_router.include_router(create_answer_router(app.state.answer_controller))
    api_router.include_router(create_zkproof_router(app.state.zkproof_controller))
    api_router.include_router(create_user_router(app.state.user_controller))
    api_router.include_router(create_nft_router(app.state.nft_controller))
    api_router.include_router(create_aptos_router(app.state.aptos_controller))
    api_router.include_router(create_user_post_router(app.state.user_post_controller))

    ws_router = create_ws_router(app.state.websocket_controller)
    app.include_router(ws_router, prefix="/ws")
    app.include_router(api_router)

    yield

app.router.lifespan_context = lifespan

# -------------------- Uvicorn Runner --------------------
PORT = int(os.getenv("PORT") or 3366)
HOST = "127.0.0.1"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
    