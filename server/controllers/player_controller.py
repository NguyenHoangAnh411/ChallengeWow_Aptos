from fastapi import HTTPException
from enums.player_status import PLAYER_STATUS
from services.player_service import PlayerService
from services.websocket_manager import WebSocketManager

class PlayerController:
    def __init__(self, player_service: PlayerService, websocket_manager: WebSocketManager):
        self.player_service = player_service
        self.websocket_manager = websocket_manager

    async def get_players(self, room_id: str):
        players = await self.player_service.get_players_by_room(room_id)
        if not players:
            raise HTTPException(status_code=404, detail="No players found")
        return players
    
    async def update_player_status(self, room_id: str, wallet_id: str, status: PLAYER_STATUS):
        try:
            status_enum = PLAYER_STATUS(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

        result = await self.player_service.update_player_status(room_id, wallet_id, status_enum)
        if not result or not result.get("success"):
            raise HTTPException(status_code=404, detail="Player not found")

        player = await self.player_service.get_players_by_wallet_and_room_id(room_id, wallet_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        # Broadcast WebSocket
        await self.websocket_manager.broadcast_to_room(room_id, {
            "type": "player_ready",
            "payload": {
                "wallet_id": wallet_id,
                "playerStatus": status_enum,
                "isReady": player.is_ready
            }
        })
