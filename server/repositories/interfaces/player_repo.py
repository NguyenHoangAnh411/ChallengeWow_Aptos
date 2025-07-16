from abc import ABC, abstractmethod
from typing import List, Optional
from models.player import Player

class IPlayerRepository(ABC):
    @abstractmethod
    async def save_all(self, room_id: str, players: List[Player]) -> None:
        pass

    @abstractmethod
    async def get_by_room(self, room_id: str) -> List[Player]:
        pass

    @abstractmethod
    async def get_by_wallet_id(self, wallet_id: str) -> List[Player]:
        pass
    
    @abstractmethod
    async def get_player_by_wallet_and_room_id(self, room_id: str, wallet_id: str) -> Optional[Player]:
        pass

    @abstractmethod
    async def delete_player_by_room(self, player_id, room_id) -> None:
        pass

    @abstractmethod
    async def update_player(self, player_id: str, updates: dict, room_id: str) -> None:
        pass
