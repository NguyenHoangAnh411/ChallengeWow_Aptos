from abc import ABC, abstractmethod
from typing import List
from models.player import Player

class IPlayerRepository(ABC):
    @abstractmethod
    def save_all(self, room_id: str, players: List[Player]) -> None: pass

    @abstractmethod
    def get_by_room(self, room_id: str) -> List[Player]: pass
