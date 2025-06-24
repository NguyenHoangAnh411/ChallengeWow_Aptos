from typing import List
from fastapi import APIRouter
from controllers.player_controller import PlayerController
from models.player import Player
from models.status_update_request import StatusUpdateRequest


def create_player_router(controller: PlayerController):
    router = APIRouter()

    @router.get("/room/{room_id}/players", response_class=List[Player])
    def get_players(room_id: str):
        return controller.get_players(room_id)
    
    @router.post("/player/{wallet_id}/status")
    async def update_player_status(wallet_id: str, req: StatusUpdateRequest):
        status = req.status
        await controller.update_player_status(wallet_id, status)
        return {"success": True}
    return router
