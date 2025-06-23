from datetime import datetime, timezone
import uuid
from typing import List

from repositories.interfaces.answer_repo import IAnswerRepository
from repositories.interfaces.room_repo import IRoomRepository
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player

class RoomService:
    def __init__(self, room_repo: IRoomRepository, player_repo: IPlayerRepository, answer_repo: IAnswerRepository):
        self.room_repo = room_repo
        self.player_repo = player_repo
        self.answer_repo = answer_repo

    def get_rooms(self) -> List[Room]:
        return self.room_repo.get_all()

    def create_room(self, player: Player) -> Room:
        room = Room.create(
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
            for p in room.players:
                answers = self.answer_repo.get_answers_by_wallet_id(room_id=room.id, wallet_id=p.wallet_id)
                p.answers = answers
        return room
    
    def get_room_by_code(self, room_code: str) -> Room | None:
        room: Room = self.room_repo.get_by_code(room_code)
        if not room:
            return None
        
        room.players = self.player_repo.get_by_room(room.id)
        return room

    def save_room(self, room: Room):
        self.room_repo.save(room)
        self.player_repo.save_all(room.id, room.players)
    
    def get_host_room_wallet(self, room_id: str) -> str | None:
        room = self.room_repo.get(room_id)
        if not room:
            return None
        players = self.player_repo.get_by_room(room_id)
        for player in players:
            if player.is_host:
                return player.wallet_id
        return None
        
        
