from datetime import datetime, timezone
from typing import List, Optional

from models.update_settings import GameSettings, QuestionDistribution
from repositories.interfaces.answer_repo import IAnswerRepository
from repositories.interfaces.room_repo import IRoomRepository
from repositories.interfaces.player_repo import IPlayerRepository
from models.room import Room
from models.player import Player

class RoomService:
    def __init__(
        self,
        room_repo: IRoomRepository,
        player_repo: IPlayerRepository,
        answer_repo: IAnswerRepository,
    ):
        self.room_repo = room_repo
        self.player_repo = player_repo
        self.answer_repo = answer_repo

    async def get_rooms(self, status: str = None) -> List[Room]:
        return await self.room_repo.get_all(status)

    async def create_room(self, player: Player) -> Room:
        room = Room.create(
            players=[player],
            created_at=datetime.now(timezone.utc),
        )
        await self.room_repo.save(room)
        await self.player_repo.save_all(room.id, room.players)
        return room

    async def get_room(self, room_id: str) -> Optional[Room]:
        room = await self.room_repo.get(room_id)
        if not room:
            return None

        room.players = await self.player_repo.get_by_room(room_id)

        for p in room.players:
            answers = await self.answer_repo.get_answers_by_wallet_id(room_id, p.wallet_id)
            p.answers = answers

        return room

    async def get_room_by_code(self, room_code: str) -> Optional[Room]:
        room = await self.room_repo.get_by_code(room_code)
        if not room:
            return None

        room.players = await self.player_repo.get_by_room(room.id)
        return room

    async def save_room(self, room: Room):
        await self.room_repo.save(room)
        await self.player_repo.save_all(room.id, room.players)

    async def get_host_room_wallet(self, room_id: str) -> Optional[str]:
        room = await self.room_repo.get(room_id)
        if not room:
            return None

        players = await self.player_repo.get_by_room(room_id)
        for player in players:
            if player.is_host:
                return player.wallet_id
        return None

    async def get_room_settings(self, room_id: str) -> Optional[GameSettings]:
        room = await self.room_repo.get(room_id)
        if not room:
            return None

        return GameSettings(
            time_per_question=room.time_per_question,
            questions=QuestionDistribution(
                easy=room.easy_questions,
                medium=room.medium_questions,
                hard=room.hard_questions,
            ),
        )

    async def update_game_settings(self, room_id: str, game_settings: GameSettings) -> bool:
        room = await self.room_repo.get(room_id)
        if not room:
            return False

        q = game_settings.questions
        room.easy_questions = q.easy
        room.medium_questions = q.medium
        print(q.hard)
        room.hard_questions = q.hard
        room.total_questions = q.easy + q.medium + q.hard
        room.time_per_question = game_settings.time_per_question

        await self.room_repo.save(room)
        return True
