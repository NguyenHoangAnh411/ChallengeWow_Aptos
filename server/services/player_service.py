from datetime import datetime, timezone
from typing import List, Optional

from fastapi import Response
from enums.game_status import GAME_STATUS
from enums.player_status import PLAYER_STATUS
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player
from repositories.interfaces.room_repo import IRoomRepository


class PlayerService:
    def __init__(self, player_repo: IPlayerRepository, room_repo: IRoomRepository):
        self.room_repo = room_repo
        self.player_repo = player_repo

    def save_players(self, room_id: str, players: List[Player]) -> None:
        """Save or update all players in a room."""
        self.player_repo.save_all(room_id, players)

    def get_players_by_room(self, room_id: str) -> List[Player]:
        """Retrieve all players belonging to a room."""
        return self.player_repo.get_by_room(room_id)

    def get_player_by_wallet_id(self, wallet_id) -> Optional[Player]:
        """Return player by wallet id"""
        return self.player_repo.get_by_wallet_id(wallet_id)

    def update_player_status(self, wallet_id: str, status: PLAYER_STATUS) -> None:
        player = self.player_repo.get_by_wallet_id(wallet_id)
        if not player:
            return Response(content="Not found player", status_code=404)

        self.player_repo.update_player(wallet_id, {"player_status": status, "is_ready": status == PLAYER_STATUS.READY})
        return {
            "success": True,
            "walletId": player.wallet_id,
        }

    def leave_room(self, wallet_id, room_id) -> dict:
        players = self.player_repo.get_by_room(room_id)
        current_player = next((p for p in players if p.wallet_id == wallet_id), None)

        if not current_player:
            self.room_repo.delete_room(room_id)
            return {"success": True, "message": "Room deleted because no players left"}

        room: Room = self.room_repo.get(room_id)

        if room.status in [GAME_STATUS.WAITING, GAME_STATUS.COUNTING_DOWN]:
            self.player_repo.delete_by_player_and_room(wallet_id, room_id)
        else:
            self.player_repo.update_player(
                wallet_id,
                {
                    "player_status": PLAYER_STATUS.QUIT,
                    "quit_at": datetime.now(timezone.utc),
                },
            )

        updated_players = self.player_repo.get_by_room(room_id)

        if not updated_players:
            self.room_repo.delete_room(room_id)
            return {"success": True, "message": "Room deleted because no players left", "closed" : True}

        if current_player.is_host:
            new_host = next((p for p in updated_players if p.wallet_id != wallet_id), None)
            if new_host:
                self.player_repo.update_player(new_host.wallet_id, {"is_host": True})

        return {
            "success": True,
            "message": "Leave successfully",
            "data": current_player
        }

    def update_is_winner(self, room_id: str, wallet_id: str, is_winner: bool) -> None:
        self.player_repo.update_player(wallet_id, {"is_winner": is_winner}, room_id=room_id)