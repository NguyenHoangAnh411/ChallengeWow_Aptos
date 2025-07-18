from repositories.implement.user_post_repo_impl import UserPostRepository

class UserPostService:
    def __init__(self, user_post_repo: UserPostRepository):
        self.user_post_repo = user_post_repo

    async def create_post(self, wallet_id, content=None, image_url=None, video_url=None, hashtag=None, is_liked=False, is_commented=False, is_deleted=False, is_hidden=False):
        return await self.user_post_repo.create(wallet_id, content, image_url, video_url, hashtag, is_liked, is_commented, is_deleted, is_hidden)

    async def get_posts_by_wallet(self, wallet_id):
        return await self.user_post_repo.get_by_wallet(wallet_id)

    async def get_post_by_id(self, post_id):
        return await self.user_post_repo.get_by_id(post_id)

    async def get_all_posts(self, limit=20, offset=0, wallet_id=None):
        return await self.user_post_repo.get_all(limit, offset, wallet_id)

    async def like_post(self, post_id, wallet_id, is_liked):
        return await self.user_post_repo.like_post(post_id, wallet_id, is_liked)