from config.database import supabase
import json
from datetime import datetime, timezone, timedelta

from models.room import Room
from repositories.interfaces.room_repo import IRoomRepository

class RoomRepository(IRoomRepository):
    table = "challenge_rooms"

    def save(self, room: Room) -> bool:
        try:
            data = {
                "id": room.id,
                "status": room.status,
                "created_at": room.created_at.isoformat(),
                "start_time": room.start_time.isoformat() if room.start_time else None,
                "current_question": json.dumps(room.current_question) if room.current_question else None,
                "winner": room.winner,
                "proof": room.proof,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            supabase.table(RoomRepository.table).upsert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving room {room.id} to Supabase: {str(e)}")
            return False

    def get(self, room_id: str) -> Room | None:
        try:
            res = supabase.table(RoomRepository.table).select("*").eq("id", room_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"Error fetching room {room_id} from Supabase: {str(e)}")
            return None

    def delete_old_rooms(self, hours_old=24) -> None:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_old)
            supabase.table(RoomRepository.table).delete().lt("created_at", cutoff.isoformat()).execute()
            return True
        except Exception as e:
            print(f"Error deleting old rooms from Supabase: {str(e)}")
            return False