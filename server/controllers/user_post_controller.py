from fastapi import HTTPException

class UserPostController:
    def __init__(self, user_post_service):
        self.user_post_service = user_post_service

    async def create_post(self, wallet_id, content=None, image_url=None, video_url=None, hashtag=None, like_count=0, comment_count=0, is_liked=False, is_commented=False, is_deleted=False, is_hidden=False):
        post = await self.user_post_service.create_post(wallet_id, content, image_url, video_url, hashtag, like_count, comment_count, is_liked, is_commented, is_deleted, is_hidden)
        # Broadcast bài post mới qua websocket feed
        from main import app
        websocket_manager = getattr(app.state, 'websocket_controller', None)
        if websocket_manager:
            try:
                await websocket_manager.manager.broadcast_to_feed({
                    "type": "new_post",
                    "payload": post.model_dump() if hasattr(post, 'model_dump') else post.__dict__
                })
            except Exception as e:
                print(f"[WebSocket Feed] Broadcast error: {e}")
        return post

    async def get_posts_by_wallet(self, wallet_id):
        return await self.user_post_service.get_posts_by_wallet(wallet_id)

    async def get_post_by_id(self, post_id):
        post = await self.user_post_service.get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post

    async def get_all_posts(self, limit=20, offset=0):
        return await self.user_post_service.get_all_posts(limit, offset)

    async def like_post(self, post_id, wallet_id, is_liked):
        post = await self.user_post_service.like_post(post_id, wallet_id, is_liked)
        # Broadcast realtime qua websocket feed
        from main import app
        websocket_manager = getattr(app.state, 'websocket_controller', None)
        if websocket_manager:
            try:
                await websocket_manager.manager.broadcast_to_feed({
                    "type": "like_post",
                    "payload": {
                        "post_id": post_id,
                        "wallet_id": wallet_id,
                        "is_liked": is_liked,
                        "like_count": post.like_count
                    }
                })
            except Exception as e:
                print(f"[WebSocket Feed] Broadcast like error: {e}")
        return post