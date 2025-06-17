from typing import List
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player


class PlayerService:
    def __init__(self, player_repo: IPlayerRepository):
        self.player_repo = player_repo

    def save_players(self, room_id: str, players: List[Player]) -> None:
        """Save or update all players in a room."""
        self.player_repo.save_all(room_id, players)

    def get_players_by_room(self, room_id: str) -> List[Player]:
        """Retrieve all players belonging to a room."""
        return self.player_repo.get_by_room(room_id)
