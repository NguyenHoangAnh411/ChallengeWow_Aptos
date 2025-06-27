from datetime import datetime, timezone, timedelta
from enums.leaderboard_period import LEADERBOARD_PERIOD
from models.user import User
from supabase import AsyncClient

class UserRepository:
    table = "users"

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def get_by_wallet(self, wallet_id: str):
        res = (
            await self.supabase.table(self.table)
            .select("*")
            .eq("wallet_id", wallet_id)
            .limit(1)
            .execute()
        )
        
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None

    async def create(self, wallet_id: str, username: str = None):
        data = {"wallet_id": wallet_id}
        if username:
            data["username"] = username
        res = await self.supabase.table(self.table).insert(data).execute()
        return User(**res.data[0])

    async def update_username(self, wallet_id: str, username: str):
        res = (
            await self.supabase.table(self.table)
            .update({"username": username})
            .eq("wallet_id", wallet_id)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None

    async def update_user_stats(self, wallet_id: str, score: int, is_winner: bool):
        res = await self.supabase.table(self.table).select("*").eq("wallet_id", wallet_id).execute()
        users = res.data or []
        if users and len(users) == 1:
            user = users[0]
            new_score = user["total_score"] + score
            new_wins = user["games_won"] + 1 if is_winner else user["games_won"]
            await self.supabase.table(self.table).update({
                "total_score": new_score,
                "games_won": new_wins
            }).eq("wallet_id", wallet_id).execute()
        elif not users:
            await self.supabase.table(self.table).insert({
                "wallet_id": wallet_id,
                "total_score": score,
                "games_won": 1 if is_winner else 0
            }).execute()
        else:
            print(f"[ERROR] Multiple users found with wallet_id={wallet_id}, cannot update stats.")

class UserStatsRepository:
    table = "user_stats"

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def update_user_stats(self, wallet_id: str, score: int, is_winner: bool):
        res = await self.supabase.table(self.table).select("*").eq("wallet_id", wallet_id).execute()
        stats = res.data or []
        if stats and len(stats) == 1:
            stat = stats[0]
            new_score = stat["total_score"] + score
            new_wins = stat["games_won"] + 1 if is_winner else stat["games_won"]
            await self.supabase.table(self.table).update({
                "total_score": new_score,
                "games_won": new_wins
            }).eq("wallet_id", wallet_id).execute()
        elif not stats:
            await self.supabase.table(self.table).insert({
                "wallet_id": wallet_id,
                "total_score": score,
                "games_won": 1 if is_winner else 0,
                "rank": "Unrank"
            }).execute()
        else:
            print(f"[ERROR] Multiple user_stats found with wallet_id={wallet_id}, cannot update stats.")

    async def get_leaderboard(self, limit=10, period=LEADERBOARD_PERIOD.ALL_TIME):
        now = datetime.now(timezone.utc)

        if period == LEADERBOARD_PERIOD.THIS_WEEK:
            since = now - timedelta(days=7)
        elif period == LEADERBOARD_PERIOD.THIS_MONTH:
            since = now - timedelta(days=30)
        else:
            since = None  # ALL_TIME

        query = self.supabase.table(self.table).select(
            "wallet_id, total_score, games_won, rank, games_played, tier, users(username)"
        ).order("total_score", desc=True).limit(limit)

        if since:
            query = query.gte("updated_at", since.isoformat())

        res = await query.execute()
        data = res.data or []
        for row in data:
            row["username"] = row.get("users", {}).get("username", "") if row.get("users") else ""
        return data
