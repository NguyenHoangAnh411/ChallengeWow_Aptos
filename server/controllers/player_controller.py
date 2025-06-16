from fastapi import HTTPException
from services.player_service import PlayerService


class PlayerController:
    def __init__(self, player_service: PlayerService):
        self.player_service = player_service

    def get_players(self, room_id: str):
        players = self.player_service.get_players_by_room(room_id)
        if not players:
            raise HTTPException(status_code=404, detail="No players found")
        return players
