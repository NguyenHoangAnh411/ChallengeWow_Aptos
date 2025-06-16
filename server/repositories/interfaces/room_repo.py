from abc import ABC, abstractmethod
from models.room import Room

class IRoomRepository(ABC):
    @abstractmethod
    def get(self, room_id: str) -> Room | None:
        pass

    @abstractmethod
    def save(self, room: Room) -> None:
        pass

    @abstractmethod
    def delete_old_rooms(self, hours_old: int = 24) -> None:
        pass
