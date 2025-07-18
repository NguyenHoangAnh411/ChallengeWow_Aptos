from models.user_post import UserPost
from supabase import AsyncClient

class UserPostRepository:
    table = "user_posts"

    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase

    async def create(self, wallet_id: str, content: str = None, image_url: str = None, video_url: str = None, hashtag: str = None, is_liked: bool = False, is_commented: bool = False, is_deleted: bool = False, is_hidden: bool = False):
        data = {
            "wallet_id": wallet_id,
            "content": content,
            "image_url": image_url,
            "video_url": video_url,
            "hashtag": hashtag,
            "is_liked": is_liked,
            "is_commented": is_commented,
            "is_deleted": is_deleted,
            "is_hidden": is_hidden
        }
        res = await self.supabase.table(self.table).insert(data).execute()
        return UserPost(**res.data[0])

    async def get_all(self, limit: int = 20, offset: int = 0, wallet_id: str = None):
        query = self.supabase.table("user_posts_with_user").select("*").order("created_at", desc=True).range(offset, offset+limit-1)
        res = await query.execute()
        posts = res.data
        if wallet_id:
            liked_res = await self.supabase.table("post_likes").select("post_id").eq("wallet_id", wallet_id).eq("is_liked", True).execute()
            liked_ids = set(l["post_id"] for l in liked_res.data)
            for post in posts:
                post["is_liked"] = post["id"] in liked_ids
        return [UserPost(**item) for item in posts]

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

    async def like_post(self, post_id: str, wallet_id: str, is_liked: bool):
        if is_liked:
            await self.supabase.table("post_likes").upsert(
                {
                    "post_id": post_id,
                    "wallet_id": wallet_id,
                    "is_liked": True
                },
                on_conflict="post_id,wallet_id"  # ✅ Đây là dòng quan trọng: DÙNG CHUỖI, không phải list
            ).execute()
        else:
            await self.supabase.table("post_likes").delete().eq("post_id", post_id).eq("wallet_id", wallet_id).execute()

        # Đếm lại số lượt like
        res = await self.supabase.table("post_likes").select("*").eq("post_id", post_id).eq("is_liked", True).execute()
        like_count = len(res.data)

        # Cập nhật like_count nếu cần cache
        await self.supabase.table("user_posts").update({"like_count": like_count}).eq("id", post_id).execute()

        # Trả về bài post mới nhất
        post_res = await self.supabase.table("user_posts_with_user").select("*").eq("id", post_id).single().execute()
        return UserPost(**post_res.data)
