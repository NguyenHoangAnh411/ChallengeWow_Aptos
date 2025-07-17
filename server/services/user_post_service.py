from repositories.implement.user_post_repo_impl import UserPostRepository

class UserPostService:
    def __init__(self, user_post_repo: UserPostRepository):
        self.user_post_repo = user_post_repo

    async def create_post(self, wallet_id, content=None, image_url=None, video_url=None):
        return await self.user_post_repo.create(wallet_id, content, image_url, video_url)

    async def get_posts_by_wallet(self, wallet_id):
        return await self.user_post_repo.get_by_wallet(wallet_id)

    async def get_post_by_id(self, post_id):
        return await self.user_post_repo.get_by_id(post_id)

    async def get_all_posts(self, limit=20, offset=0):
        return await self.user_post_repo.get_all(limit, offset)