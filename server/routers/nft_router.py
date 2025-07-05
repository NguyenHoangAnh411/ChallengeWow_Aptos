from fastapi import APIRouter, Body
from controllers.nft_controller import NFTController

def create_nft_router(controller: NFTController):
    router = APIRouter()

    @router.post("/nft/award")
    async def award_nft(
        action: str = Body(...),
        room_id: str = Body(...),
        metadata_uri: str = Body(None),
        winner_address: str = Body(None)
    ):
        return await controller.award_nft(action, room_id, metadata_uri, winner_address)

    @router.get("/nft/info/{room_id}")
    async def get_nft_info(room_id: str):
        return await controller.get_nft_info(room_id)

    return router 