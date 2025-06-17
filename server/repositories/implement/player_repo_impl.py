from datetime import datetime
import json
from config.database import supabase
from repositories.interfaces.player_repo import IPlayerRepository
from models.player import Player


class PlayerRepository(IPlayerRepository):
    table = "room_players"

    def save_all(self, room_id: str, players: list[Player]) -> None:
        supabase.table(PlayerRepository.table).delete().eq("room_id", room_id).execute()

        data = []
        for p in players:
            data.append(
                {
                    "id": p.id,
                    "room_id": room_id,
                    "wallet_id": p.wallet_id,
                    "username": p.username,
                    "score": p.score,
                    "answers": json.dumps(p.answers),
                    "joined_at": p.joined_at.isoformat(),
                }
            )
        if data:
            supabase.table("room_players").insert(data).execute()

    def get_by_room(self, room_id: str) -> list[Player]:
        res = (
            supabase.table("room_players").select("*").eq("room_id", room_id).execute()
        )
        players = []
        for p in res.data:
            player = Player(
                id=p["id"],
                wallet_id=p["wallet_id"],
                username=p["username"],
                score=p["score"],
                answers=json.loads(p["answers"]),
                joined_at=datetime.fromisoformat(p["joined_at"].replace("Z", "+00:00")),
            )
            players.append(player)
        return players
