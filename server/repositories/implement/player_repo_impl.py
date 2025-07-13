from datetime import datetime
import json
from typing import List, Optional

from supabase import AsyncClient

from helpers.json_helper import json_safe
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player
class PlayerRepository(IPlayerRepository):
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase
        self.table = "room_players"

    async def save_all(self, room_id: str, players: List[Player]) -> None:
        try:
            # Instead of delete + insert, use upsert to handle duplicates
            data = []
            for p in players:
                data.append({
                    "room_id": room_id,
                    "wallet_id": p.wallet_id,
                    "username": p.username,
                    "score": p.score,
                    "joined_at": p.joined_at.isoformat() if p.joined_at else None,
                    "is_host": p.is_host,
                    "is_winner": p.is_winner,
                    "player_status": p.player_status,
                    "is_ready": p.is_ready,
                })

            if data:
                # Remove duplicates based on room_id and wallet_id
                unique_data = list({
                    (d["room_id"], d["wallet_id"]): d for d in data
                }.values())

                # Use upsert to handle existing records
                for player_data in unique_data:
                    try:
                        await self.supabase.table(self.table).upsert(
                            player_data,
                            on_conflict="room_id,wallet_id"
                        ).execute()
                    except Exception as e:
                        print(f"Error upserting player {player_data['wallet_id']} in room {room_id}: {e}")

        except Exception as e:
            print(f"Error in save_all for room {room_id}: {e}")

    async def get_by_room(self, room_id: str) -> List[Player]:
        try:
            res = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .execute()
            )

            players = []
            for p in res.data:
                player = Player(
                    room_id=p["room_id"],
                    wallet_id=p["wallet_id"],
                    username=p["username"],
                    score=p["score"],
                    is_host=p["is_host"],
                    player_status=p['player_status'],
                    is_ready=p["is_ready"],
                    is_winner=p.get("is_winner", False),
                )
                players.append(player)
            return players

        except Exception as e:
            print(f"Error fetching players for room {room_id}: {e}")
            return []

    async def get_player_by_wallet_and_room_id(self, room_id: str, wallet_id: str) -> Optional[Player]:
        try:
            res = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("wallet_id", wallet_id)
                .eq("room_id", room_id)
                .single()
                .execute()
            )
            return Player(**res.data)
        except Exception as e:
            print(f"{room_id} - Fetch player {wallet_id} failed: {e}")
            return None

    async def get_by_wallet_id(self, wallet_id: str) -> List[Player]:
        try:
            res = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("wallet_id", wallet_id)
                .execute()
            )
            return [Player(**item) for item in res.data]
        except Exception as e:
            print(f"Fetch player by wallet {wallet_id} failed: {e}")
            return []

    async def delete_by_player_and_room(self, wallet_id: str, room_id: str) -> None:
        try:
            await (
                self.supabase.table(self.table)
                .delete()
                .eq("wallet_id", wallet_id)
                .eq("room_id", room_id)
                .execute()
            )
        except Exception as e:
            print(f"Delete player {wallet_id} in room {room_id} failed: {e}")

    async def update_player(self, wallet_id: str, updates: dict, room_id: Optional[str] = None) -> None:
        try:
            safe_updates = json.loads(json.dumps(updates, default=json_safe))
            query = self.supabase.table(self.table).update(safe_updates).eq("wallet_id", wallet_id)
            if room_id:
                query = query.eq("room_id", room_id)
            await query.execute()
        except Exception as e:
            print(f"Failed to update player {wallet_id}: {e}")
