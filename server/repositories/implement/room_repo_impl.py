from supabase import AsyncClient
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from helpers.json_helper import json_safe
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from repositories.interfaces.room_repo import IRoomRepository
class RoomRepository(IRoomRepository):
    def __init__(self, player_repo: IPlayerRepository, supabase: AsyncClient):
        self.table = "challenge_rooms"
        self.supabase = supabase
        self.player_repo = player_repo

    async def get_all(self) -> List[Room]:
        try:
            response = await self.supabase.table(self.table).select("*").execute()
            data = response.data
            rooms = []
            for item in data:
                room = Room(**item)
                if self.player_repo:
                    room.players = await self.player_repo.get_by_room(room.id)
                    if not room.players:
                        continue
                rooms.append(room)
            return rooms
        except Exception as e:
            print(f"Error fetching rooms: {e}")
            return []

    def question_to_dict_safe(self, q):
        d = q.dict() if hasattr(q, 'dict') else dict(q)
        for k, v in d.items():
            if isinstance(v, datetime):
                d[k] = v.isoformat()
        return d

    async def save(self, room: Room) -> bool:
        try:
            data = json_safe(room, exclude={"players", "proof", "question_configs"})
            await self.supabase.table(self.table).upsert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving room {room.id} to self.Supabase: {str(e)}")
            return False

    async def get(self, room_id: str) -> Optional[Room]:
        try:
            res = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("id", room_id)
                .execute()
            )

            if res.data:
                return Room(**res.data[0])
            return None
        except Exception as e:
            print(f"Error fetching room {room_id} from self.Supabase: {str(e)}")
            return None

    async def get_by_code(self, room_code: str) -> Optional[Room]:
        try:
            res = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_code", room_code)
                .execute()
            )

            if res.data:
                return Room(**res.data[0])
            return None
        except Exception as e:
            print(f"Error fetching room {room_code} from self.Supabase: {str(e)}")
            return None

    async def delete_room(self, room_id: str) -> None:
        try:
            await self.supabase.table("room_players").delete().eq("room_id", room_id).execute()
            await self.supabase.table(self.table).delete().eq("id", room_id).execute()
        except Exception as e:
            print(f"Error deleting room {room_id}: {e}")

    async def delete_old_rooms(self, hours_old=24) -> bool:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_old)
            await self.supabase.table(self.table).delete().lt(
                "created_at", cutoff.isoformat()
            ).execute()
            return True
        except Exception as e:
            print(f"Error deleting old rooms from self.Supabase: {str(e)}")
            return False
