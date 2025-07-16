from collections import defaultdict
from supabase import AsyncClient
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from helpers.json_helper import json_safe
from models.room import Room
from repositories.interfaces.player_repo import IPlayerRepository
from repositories.interfaces.room_repo import IRoomRepository
from enums.game_status import GAME_STATUS
from models.player import Player
class RoomRepository(IRoomRepository):
    def __init__(self, player_repo: IPlayerRepository, supabase: AsyncClient):
        self.table = "challenge_rooms"
        self.supabase = supabase
        self.player_repo = player_repo

    async def get_all(self, status: str = GAME_STATUS.WAITING) -> List[Room]:
        try:
            query = self.supabase.table(self.table).select("*")
            if status:
                query = query.eq("status", status)
            response = await query.execute()
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
            data = json_safe(room, exclude={"players", "proof", "question_configs", "tie_break_winners"})
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
        
    async def get_user_game_histories(
        self,
        wallet_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Room]:
        room_players_res = await (
            self.supabase
            .from_("room_players")
            .select("room_id")
            .eq("wallet_id", wallet_id)
            .execute()
        )

        all_user_room_ids = list(set([r["room_id"] for r in (room_players_res.data or [])]))
        if not all_user_room_ids:
            return []

        query = (
            self.supabase
            .from_(self.table)
            .select("*")
            .in_("id", all_user_room_ids)
            .order("ended_at", desc=True)
            .limit(limit)
            .offset(offset)
        )

        if status:
            query = query.eq("status", status)

        paginated_rooms_res = await query.execute()
        paginated_rooms_data = paginated_rooms_res.data or []

        if not paginated_rooms_data:
            return []

        paginated_room_ids = [room["id"] for room in paginated_rooms_data]

        all_players_res = await (
            self.supabase
            .from_("room_players")
            .select("*")
            .in_("room_id", paginated_room_ids)
            .execute()
        )
        players_data = all_players_res.data or []

        players_by_room_id = defaultdict(list)
        for p_data in players_data:
            try:
                # Chuyển đổi thành đối tượng Player ngay tại đây
                players_by_room_id[p_data["room_id"]].append(Player(**p_data))
            except Exception as e:
                print(f"Error parsing player data: {p_data}. Error: {e}")
                continue

        # --- BƯỚC 5: Xây dựng danh sách Room cuối cùng (không có truy vấn DB nào nữa) ---
        final_rooms = []
        for room_data in paginated_rooms_data:
            try:
                room_id = room_data["id"]
                # Gán danh sách người chơi đã được nhóm từ điển
                room_data["players"] = players_by_room_id.get(room_id, [])
                final_rooms.append(Room(**room_data))
            except Exception as e:
                print(f"Error parsing room data: {room_data}. Error: {e}")
                continue

        return final_rooms
