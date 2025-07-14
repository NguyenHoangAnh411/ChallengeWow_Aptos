from fastapi import APIRouter, Query, Body
from controllers.aptos_controller import AptosController

def create_aptos_router(controller: AptosController):
    router = APIRouter()

    # --- THÊM LẠI ASYNC VÀO CÁC ĐỊNH NGHĨA ROUTE ---
    @router.get("/aptos/balance/{address}")
    async def get_account_balance(address: str):
        return await controller.get_account_balance(address)

    @router.get("/aptos/player-data/{address}")
    async def get_player_data(address: str):
        return await controller.get_player_data(address)

    @router.post("/aptos/init-player")
    async def init_player(body: dict = Body(...)):
        player_key = body.get("private_key")
        if not player_key:
            return {"success": False, "error": "private_key is required"}
        return await controller.init_player(player_key)
    
    @router.post("/aptos/mint-nft")
    async def mint_nft(body: dict = Body(...)):
        return await controller.mint_nft(body)

    return router