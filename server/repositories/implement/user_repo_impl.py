from models.user import User
from config.database import supabase


class UserRepository:
    table = "users"

    def get_by_wallet(self, wallet_id: str):
        res = (
            supabase.table(self.table)
            .select("*")
            .eq("wallet_id", wallet_id)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None

    def create(self, wallet_id: str, username: str = None):
        data = {"wallet_id": wallet_id}
        if username:
            data["username"] = username
        res = supabase.table(self.table).insert(data).execute()
        return User(**res.data[0])

    def update_username(self, wallet_id: str, username: str):
        res = (
            supabase.table(self.table)
            .update({"username": username})
            .eq("wallet_id", wallet_id)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None

    def update_user_stats(self, wallet_id: str, score: int, is_winner: bool):
        res = supabase.table(self.table).select("*").eq("wallet_id", wallet_id).execute()
        users = res.data if hasattr(res, 'data') else res["data"] if res and "data" in res else []
        if users and len(users) == 1:
            user = users[0]
            new_score = user["total_score"] + score
            new_wins = user["games_won"] + 1 if is_winner else user["games_won"]
            supabase.table(self.table).update({
                "total_score": new_score,
                "games_won": new_wins
            }).eq("wallet_id", wallet_id).execute()
        elif not users:
            # Nếu muốn tự động tạo user mới khi chưa có
            supabase.table(self.table).insert({
                "wallet_id": wallet_id,
                "total_score": score,
                "games_won": 1 if is_winner else 0
            }).execute()
        else:
            print(f"[ERROR] Multiple users found with wallet_id={wallet_id}, cannot update stats.")

class UserStatsRepository:
    table = "user_stats"

    def update_user_stats(self, wallet_id: str, score: int, is_winner: bool):
        res = supabase.table(self.table).select("*").eq("wallet_id", wallet_id).execute()
        stats = res.data if hasattr(res, 'data') else res["data"] if res and "data" in res else []
        if stats and len(stats) == 1:
            stat = stats[0]
            new_score = stat["total_score"] + score
            new_wins = stat["games_won"] + 1 if is_winner else stat["games_won"]
            supabase.table(self.table).update({
                "total_score": new_score,
                "games_won": new_wins
            }).eq("wallet_id", wallet_id).execute()
        elif not stats:
            supabase.table(self.table).insert({
                "wallet_id": wallet_id,
                "total_score": score,
                "games_won": 1 if is_winner else 0,
                "rank": "Unrank"
            }).execute()
        else:
            print(f"[ERROR] Multiple user_stats found with wallet_id={wallet_id}, cannot update stats.")

    def get_leaderboard(self, limit=10):
        res = supabase.table(self.table).select("wallet_id, total_score, games_won, rank, users(username)").order("total_score", desc=True).limit(limit).execute()
        data = res.data if hasattr(res, 'data') else res["data"] if res and "data" in res else []
        for row in data:
            row["username"] = row.get("users", {}).get("username", "") if row.get("users") else ""
        return data
