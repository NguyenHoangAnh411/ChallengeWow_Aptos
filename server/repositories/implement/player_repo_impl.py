from datetime import datetime
from typing import List, Optional
from config.database import supabase
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player

class PlayerRepository(IPlayerRepository):
    table = "room_players"

    def save_all(self, room_id: str, players: List[Player]) -> None:
        supabase.table(PlayerRepository.table).delete().eq("room_id", room_id).execute()

        data = []
        for p in players:
            data.append(
                {
                    "room_id": room_id,
                    "wallet_id": p.wallet_id,
                    "username": p.username,
                    "score": p.score,
                    "joined_at": p.joined_at.isoformat(),
                    "is_host": p.is_host
                }
            )
        if data:
            supabase.table(PlayerRepository.table).insert(data).execute()

    def get_by_room(self, room_id: str) -> List[Player]:
        res = (
            supabase.table(PlayerRepository.table)
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
                joined_at=datetime.fromisoformat(p["joined_at"].replace("Z", "+00:00")),
            )
            players.append(player)
        return players

    def get_by_wallet_id(self, wallet_id) -> Optional[Player]:
        try:
            res = (
                supabase.table(PlayerRepository.table)
                .select("*")
                .eq("wallet_id", wallet_id)
                .single()
                .execute()
            )
            
            return Player(**res.data)
        except Exception as e:
            print("Fetch player failed: ", e)
            return None

    def delete_by_player_and_room(self, wallet_id, room_id):
        supabase.table(PlayerRepository.table).delete().eq("wallet_id", wallet_id).eq(
            "room_id", room_id
        ).execute()

    def update_player(self, wallet_id, updates):
        supabase.table(PlayerRepository.table).update(updates).eq(
            "wallet_id", wallet_id
        ).execute()
