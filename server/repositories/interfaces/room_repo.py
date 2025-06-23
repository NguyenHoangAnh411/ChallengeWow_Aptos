from abc import ABC, abstractmethod
from typing import List

from models.room import Room


class IRoomRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[Room]:
        pass

    @abstractmethod
    def get(self, room_id: str) -> Room | None:
        pass
    
    @abstractmethod
    def get_by_code(self, room_code) -> Room | None:
        pass

    @abstractmethod
    def save(self, room: Room) -> None:
        pass

    @abstractmethod
    def delete_room(self, room_id: str) -> None:
        pass

    @abstractmethod
    def delete_old_rooms(self, hours_old: int = 24) -> None:
        pass
