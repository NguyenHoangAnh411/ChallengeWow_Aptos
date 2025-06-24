from fastapi import HTTPException
from enums.player_status import PLAYER_STATUS
from services.player_service import PlayerService
from services.websocket_manager import WebSocketManager

class PlayerController:
    def __init__(self, player_service: PlayerService, websocket_manager: WebSocketManager):
        self.player_service = player_service
        self.websocket_manager = websocket_manager

    def get_players(self, room_id: str):
        players = self.player_service.get_players_by_room(room_id)
        if not players:
            raise HTTPException(status_code=404, detail="No players found")
        return players
    
    async def update_player_status(self, wallet_id: str, status: PLAYER_STATUS):
        try:
            status_enum = PLAYER_STATUS(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        self.player_service.update_player_status(wallet_id, status)
        
        player = self.player_service.get_player_by_wallet_id(wallet_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        room_id = player.room_id

        # Broadcast WebSocket
        await self.websocket_manager.broadcast_to_room(room_id, {
            "type": "player_ready",
            "player": {
                "wallet_id": wallet_id,
                "playerStatus": status,
                "isReady": player.is_ready
            }
        })

