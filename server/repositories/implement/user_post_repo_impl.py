from models.user_post import UserPost
from supabase import AsyncClient

class UserPostRepository:
    table = "user_posts"

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def create(self, wallet_id: str, content: str = None, image_url: str = None, video_url: str = None):
        data = {"wallet_id": wallet_id, "content": content, "image_url": image_url, "video_url": video_url}
        res = await self.supabase.table(self.table).insert(data).execute()
        return UserPost(**res.data[0])

    async def get_all(self, limit: int = 20, offset: int = 0):
        res = await self.supabase.table("user_posts_with_user") \
            .select("*") \
            .order("created_at", desc=True) \
            .range(offset, offset+limit-1) \
            .execute()
        return [UserPost(**item) for item in res.data]

    async def get_by_wallet(self, wallet_id: str):
        res = await self.supabase.table("user_posts_with_user") \
            .select("*") \
            .eq("wallet_id", wallet_id) \
            .order("created_at", desc=True) \
            .execute()
        return [UserPost(**item) for item in res.data]

    async def get_by_id(self, post_id: str):
        res = await self.supabase.table("user_posts_with_user") \
            .select("*") \
            .eq("id", post_id) \
            .limit(1) \
            .execute()
        posts = res.data or []
        if not posts:
            return None
        return UserPost(**posts[0])