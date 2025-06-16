from fastapi import APIRouter
from controllers.player_controller import PlayerController


def create_player_router(controller: PlayerController):
    router = APIRouter()

    @router.get("/room/{room_id}/players")
    def get_players(room_id: str):
        return controller.get_players(room_id)

    return router
