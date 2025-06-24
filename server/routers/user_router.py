from fastapi import APIRouter, Body
from controllers.user_controller import UserController
from models.leaderboard_entry import LeaderboardEntry


def create_user_router(controller: UserController):
    router = APIRouter()

    @router.post("/users/login")
    def login_user(wallet_id: str = Body(...), username: str = Body(None)):
        return controller.login_or_create(wallet_id, username)

    @router.get("/users/by-wallet/{wallet_id}")
    def get_user_by_wallet(wallet_id: str):
        return controller.get_by_wallet(wallet_id)

    @router.post("/users/update")
    def update_user(wallet_id: str = Body(...), username: str = Body(...)):
        return controller.update_username(wallet_id, username)

    @router.get("/leaderboard", response_model=list[LeaderboardEntry])
    def leaderboard(limit: int = 10):
        return controller.get_leaderboard(limit)

    return router
