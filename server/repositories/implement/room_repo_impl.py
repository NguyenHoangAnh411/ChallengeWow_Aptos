from datetime import datetime, timezone, timedelta
from typing import List
import json

from config.database import supabase
from models.room import Room
from models.question import Question
from repositories.implement.player_repo_impl import PlayerRepository
from repositories.interfaces.room_repo import IRoomRepository


class RoomRepository(IRoomRepository):
    table = "challenge_rooms"

    def __init__(self, player_repo: PlayerRepository = None):
        self.player_repo = player_repo

    def get_all(self) -> List[Room]:
        try:
            response = supabase.table(RoomRepository.table).select("*").execute()
            data = response.data
            rooms = []
            for item in data:
                room = Room(**item)
                room.players = self.player_repo.get_by_room(room.id)
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

    def save(self, room: Room) -> bool:
        try:
            data = {
                "id": room.id,
                "room_code": room.room_code,
                "status": (
                    room.status.value
                    if hasattr(room.status, "value")
                    else str(room.status)
                ),
                "time_per_question": getattr(room, "time_per_question", 20),
                "total_questions": getattr(room, "total_questions", 10),
                "countdown_duration": getattr(room, "countdown_duration", 10),
                "entry_fee": getattr(room, "entry_fee", 0),
                "prize": getattr(room, "prize", 0),
                "created_at": (
                    room.created_at.isoformat() if hasattr(room, "created_at") else None
                ),
                "start_time": (
                    room.start_time.isoformat()
                    if getattr(room, "start_time", None)
                    else None
                ),
                "started_at": (
                    room.started_at.isoformat()
                    if getattr(room, "started_at", None)
                    else None
                ),
                "ended_at": (
                    room.ended_at.isoformat()
                    if getattr(room, "ended_at", None)
                    else None
                ),
                "winner_wallet_id": getattr(room, "winner_wallet_id", None),
                "current_questions": [self.question_to_dict_safe(q) for q in getattr(room, "current_questions", [])] if getattr(room, "current_questions", None) else None,
                "current_index": getattr(room, "current_index", 0),
            }

            supabase.table(RoomRepository.table).upsert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving room {room.id} to Supabase: {str(e)}")
            return False

    def get(self, room_id: str) -> Room | None:
        try:
            res = (
                supabase.table(RoomRepository.table)
                .select("*")
                .eq("id", room_id)
                .execute()
            )

            if res.data:
                data = res.data[0]
                if data.get("current_questions"):
                    try:
                        if isinstance(data["current_questions"], str):
                            import json
                            data["current_questions"] = [Question(**q) for q in json.loads(data["current_questions"])]
                        else:
                            data["current_questions"] = [Question(**q) for q in data["current_questions"]]
                    except Exception as e:
                        print(f"Error parsing current_questions: {e}")
                        data["current_questions"] = []
                return Room(**data)
            return None
        except Exception as e:
            print(f"Error fetching room {room_id} from Supabase: {str(e)}")
            return None
        
    def get_by_code(self, room_code: str) -> Room | None:
        try:
            res = (
                supabase.table(RoomRepository.table)
                .select("*")
                .eq("room_code", room_code)
                .execute()
            )

            if res.data:
                data = res.data[0]
                if data.get("current_questions"):
                    try:
                        if isinstance(data["current_questions"], str):
                            import json
                            data["current_questions"] = [Question(**q) for q in json.loads(data["current_questions"])]
                        else:
                            data["current_questions"] = [Question(**q) for q in data["current_questions"]]
                    except Exception as e:
                        print(f"Error parsing current_questions: {e}")
                        data["current_questions"] = []
                return Room(**data)
            return None
        except Exception as e:
            print(f"Error fetching room {room_code} from Supabase: {str(e)}")
            return None
        
    def delete_room(self, room_id: str) -> None:
        supabase.table("room_players").delete().eq("room_id", room_id).execute()
        supabase.table(RoomRepository.table).delete().eq("id", room_id).execute()

    def delete_old_rooms(self, hours_old=24) -> None:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_old)
            supabase.table(RoomRepository.table).delete().lt(
                "created_at", cutoff.isoformat()
            ).execute()
            return True
        except Exception as e:
            print(f"Error deleting old rooms from Supabase: {str(e)}")
            return False
