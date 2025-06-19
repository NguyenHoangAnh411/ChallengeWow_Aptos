from models.user import User
from config.database import supabase

class UserRepository:
    table = "users"

    def get_by_wallet(self, wallet_address: str):
        res = supabase.table(self.table).select("*").eq("wallet_address", wallet_address).limit(1).execute()
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None

    def create(self, wallet_address: str, username: str = None):
        data = {"wallet_address": wallet_address}
        if username:
            data["username"] = username
        res = supabase.table(self.table).insert(data).execute()
        return User(**res.data[0])

    def update_username(self, wallet_address: str, username: str):
        res = supabase.table(self.table).update({"username": username}).eq("wallet_address", wallet_address).execute()
        if res.data and len(res.data) > 0:
            return User(**res.data[0])
        return None 