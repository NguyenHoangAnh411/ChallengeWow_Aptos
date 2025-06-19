from fastapi import APIRouter, Body
from controllers.user_controller import UserController

def create_user_router(controller: UserController):
    router = APIRouter()

    @router.post("/users/login")
    def login_user(wallet_address: str = Body(...), username: str = Body(None)):
        return controller.login_or_create(wallet_address, username)

    @router.get("/users/by-wallet/{wallet_address}")
    def get_user_by_wallet(wallet_address: str):
        return controller.get_by_wallet(wallet_address)

    @router.post("/users/update")
    def update_user(wallet_address: str = Body(...), username: str = Body(...)):
        return controller.update_username(wallet_address, username)

    return router 