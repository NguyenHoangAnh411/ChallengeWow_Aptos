from datetime import datetime, timezone
from typing import List, Optional

from fastapi import Response

from enums.game_status import GAME_STATUS
from enums.player_status import PLAYER_STATUS
from models.room import Room
from models.player import Player
from repositories.interfaces.player_repo import IPlayerRepository
from repositories.interfaces.room_repo import IRoomRepository
class PlayerService:
    def __init__(self, player_repo: IPlayerRepository, room_repo: IRoomRepository):
        self.room_repo = room_repo
        self.player_repo = player_repo

    async def save_players(self, room_id: str, players: List[Player]) -> None:
        await self.player_repo.save_all(room_id, players)

    async def get_players_by_room(self, room_id: str) -> List[Player]:
        return await self.player_repo.get_by_room(room_id)

    async def get_players_by_wallet_and_room_id(self, room_id: str, wallet_id: str) -> Optional[Player]:
        return await self.player_repo.get_player_by_wallet_and_room_id(room_id, wallet_id)

    async def get_player_by_wallet_id(self, wallet_id: str) -> List[Player]:
        return await self.player_repo.get_by_wallet_id(wallet_id)

    async def update_player_status(self, room_id: str, wallet_id: str, status: PLAYER_STATUS):
        player = await self.player_repo.get_player_by_wallet_and_room_id(room_id, wallet_id)

        if not player:
            return Response(content="Not found player", status_code=404)

        await self.player_repo.update_player(
            wallet_id,
            {"player_status": status, "is_ready": status == PLAYER_STATUS.READY},
            room_id=room_id
        )

        return {
            "success": True,
            "walletId": player.wallet_id,
        }

    async def leave_room(self, wallet_id: str, room_id: str) -> dict:
        room: Optional[Room] = await self.room_repo.get(room_id)
        if not room:
            return {"success": True, "message": "Room not found."}

        players = await self.player_repo.get_by_room(room_id)
        current_player = next((p for p in players if p.wallet_id == wallet_id), None)

        if not current_player:
            return {"success": True, "message": "Player is not in the room."}
        
        if room.status == GAME_STATUS.WAITING:
            await self.player_repo.delete_player_by_room(wallet_id, room_id)
        else:
            await self.player_repo.update_player(
                wallet_id,
                {
                    "player_status": PLAYER_STATUS.QUIT,
                    "quit_at": datetime.now(timezone.utc),
                },
                room_id=room_id,
            )

        updated_players = [p for p in players if p.wallet_id != wallet_id]

        if not updated_players:
            await self.room_repo.delete_room(room_id)
            return {
                "success": True,
                "message": "Room deleted because no players left.",
                "closed": True,
            }

        host_transfer_info = None
        if current_player.is_host:
            new_host = updated_players[0] 
            await self.player_repo.update_player(
                new_host.wallet_id,
                {"is_host": True, "is_ready": True}, 
                room_id=room_id,
            )
            host_transfer_info = {
                "new_host_wallet_id": new_host.wallet_id,
                "new_host_username": new_host.username,
            }

        return {
            "success": True,
            "message": "Left room successfully.",
            "data": {
                "wallet_id": current_player.wallet_id,
                "username": current_player.username,
            },
            "host_transfer": host_transfer_info,
        }


    async def update_is_winner(self, room_id: str, wallet_id: str, is_winner: bool) -> None:
        await self.player_repo.update_player(
            wallet_id,
            {"is_winner": is_winner},
            room_id=room_id
        )
        
    async def update_player(self, wallet_id, room_id, data: dict) -> None:
        if not wallet_id or not room_id:
            return
        
        player = await self.player_repo.get_player_by_wallet_and_room_id(room_id, wallet_id)
        if not player:
            return Response(content="Not found player", status_code=404)

        await self.player_repo.update_player(wallet_id, data, room_id)
