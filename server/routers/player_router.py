from typing import List
from fastapi import APIRouter
from controllers.player_controller import PlayerController
from models.player import Player


def create_player_router(controller: PlayerController):
    router = APIRouter()

    @router.get("/room/{room_id}/players", response_class=List[Player])
    def get_players(room_id: str):
        return controller.get_players(room_id)

    return router
