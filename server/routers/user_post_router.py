from fastapi import APIRouter, UploadFile, File, Body
from controllers.user_post_controller import UserPostController
from config.firebase import bucket

def create_user_post_router(controller: UserPostController):
    router = APIRouter()

    @router.post("/posts/create")
    async def create_post(
        wallet_id: str = Body(...),
        content: str = Body(None),
        hashtag: str = Body(None),
        file: UploadFile = File(None),
        video_url: str = Body(None),
        is_liked: bool = Body(False),
        is_commented: bool = Body(False),
        is_deleted: bool = Body(False),
        is_hidden: bool = Body(False)
    ):
        image_url = None
        if file:
            contents = await file.read()
            blob = bucket.blob(f"users/{wallet_id}/posts/{file.filename}")
            blob.upload_from_string(contents, content_type=file.content_type)
            blob.make_public()
            image_url = blob.public_url

        return await controller.create_post(
            wallet_id, content, image_url, video_url, hashtag, is_liked, is_commented, is_deleted, is_hidden
        )

    @router.get("/posts/user/{wallet_id}")
    async def get_posts_by_wallet(wallet_id: str):
        return await controller.get_posts_by_wallet(wallet_id)

    @router.get("/posts/{post_id}")
    async def get_post_by_id(post_id: str):
        return await controller.get_post_by_id(post_id)

    @router.get("/posts")
    async def get_all_posts(limit: int = 20, offset: int = 0, wallet_id: str = None):
        return await controller.get_all_posts(limit, offset, wallet_id)

    @router.post("/posts/{post_id}/like")
    async def like_post(post_id: str, wallet_id: str = Body(...), is_liked: bool = Body(...)):
        return await controller.like_post(post_id, wallet_id, is_liked)

    return router