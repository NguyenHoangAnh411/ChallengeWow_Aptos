from datetime import datetime, timezone
import uuid
from typing import List

from repositories.interfaces.room_repo import IRoomRepository
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player


class RoomService:
    def __init__(self, room_repo: IRoomRepository, player_repo: IPlayerRepository):
        self.room_repo = room_repo
        self.player_repo = player_repo
    
    def get_rooms(self) -> List[Room]:
        return self.room_repo.get_all()

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

    def calculate_score(is_correct: bool, time_taken: float, room: Room) -> int:
        if not is_correct:
            return 0
        score = room.base_score_per_question

        if room.speed_bonus_enabled:
            speed_factor = max(0, (room.time_per_question - time_taken) / room.time_per_question)
            bonus = int(speed_factor * room.max_speed_bonus)
            score += bonus

        return score