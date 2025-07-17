from fastapi import HTTPException

class UserPostController:
    def __init__(self, user_post_service):
        self.user_post_service = user_post_service

    async def create_post(self, wallet_id, content=None, image_url=None, video_url=None):
        return await self.user_post_service.create_post(wallet_id, content, image_url, video_url)

    async def get_posts_by_wallet(self, wallet_id):
        return await self.user_post_service.get_posts_by_wallet(wallet_id)

    async def get_post_by_id(self, post_id):
        post = await self.user_post_service.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post

    async def get_all_posts(self, limit=20, offset=0):
        return await self.user_post_service.get_all_posts(limit, offset)