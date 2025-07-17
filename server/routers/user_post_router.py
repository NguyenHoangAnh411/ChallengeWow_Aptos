from fastapi import APIRouter, UploadFile, File, Body
from controllers.user_post_controller import UserPostController
from config.firebase import bucket

def create_user_post_router(controller: UserPostController):
    router = APIRouter()

    @router.post("/posts/create")
    async def create_post(
        wallet_id: str = Body(...),
        content: str = Body(None),
        file: UploadFile = File(None)
    ):
        image_url = None
        if file:
            contents = await file.read()
            blob = bucket.blob(f"users/{wallet_id}/posts/{file.filename}")
            blob.upload_from_string(contents, content_type=file.content_type)
            blob.make_public()
            image_url = blob.public_url

        return await controller.create_post(wallet_id, content, image_url)

    @router.get("/posts/user/{wallet_id}")
    async def get_posts_by_wallet(wallet_id: str):
        return await controller.get_posts_by_wallet(wallet_id)

    @router.get("/posts/{post_id}")
    async def get_post_by_id(post_id: str):
        return await controller.get_post_by_id(post_id)

    @router.get("/posts")
    async def get_all_posts(limit: int = 20, offset: int = 0):
        return await controller.get_all_posts(limit, offset)

    return router