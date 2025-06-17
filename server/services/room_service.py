from datetime import datetime, timezone
import uuid

from repositories.interfaces.room_repo import IRoomRepository
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player


class RoomService:
    def __init__(self, room_repo: IRoomRepository, player_repo: IPlayerRepository):
        self.room_repo = room_repo
        self.player_repo = player_repo

    def create_room(self, player: Player) -> Room:
        room = Room(
            id=str(uuid.uuid4()),
            players=[player],
            created_at=datetime.now(timezone.utc),
        )
        self.room_repo.save(room)
        self.player_repo.save_all(room.id, room.players)
        return room

    def get_room(self, room_id: str) -> Room | None:
        room = self.room_repo.get(room_id)
        if room:
            room.players = self.player_repo.get_by_room(room_id)
        return room

    def save_room(self, room: Room):
        self.room_repo.save(room)
        self.player_repo.save_all(room.id, room.players)
