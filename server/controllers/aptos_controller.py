from fastapi import HTTPException, Body
from services.aptos_service import AptosService
from typing import Dict, Any
from fastapi import HTTPException, Body 
class AptosController:
    def __init__(self):
        self.aptos_service = AptosService()

    # --- THÊM LẠI ASYNC/AWAIT ---
    async def get_account_balance(self, address: str) -> Dict[str, Any]:
        try:
            result = await self.aptos_service.get_account_balance(address)
            print("[DEBUG] get_account_balance result:", result)
            if result["success"]:
                return {"success": True, "data": result}
            else:
                print("[DEBUG] get_account_balance error:", result.get("error"))
                raise HTTPException(status_code=400, detail=result["error"])
        except Exception as e:
            print("[DEBUG] get_account_balance exception:", e)
            raise HTTPException(status_code=500, detail=str(e))

    async def get_player_data(self, address: str) -> Dict[str, Any]:
        try:
            result = await self.aptos_service.get_player_data(address)
            if result["success"]:
                return {"success": True, "data": result}
            else:
                raise HTTPException(status_code=400, detail=result["error"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def init_player(self, player_key: str) -> Dict[str, Any]:
        try:
            result = await self.aptos_service.call_init_player(player_key)
            if result["success"]:
                return {"success": True, "data": result}
            else:
                raise HTTPException(status_code=400, detail=result.get("error", "Transaction failed"))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    async def mint_nft(self, body: dict = Body(...)) -> Dict[str, Any]:
        try:
            # Lấy các tham số cần thiết từ body của request
            recipient_address = body.get("recipient_address")
            collection_name = body.get("collection_name")
            token_name = body.get("token_name")
            token_description = body.get("token_description")
            token_uri = body.get("token_uri")

            if not all([recipient_address, collection_name, token_name, token_description, token_uri]):
                raise HTTPException(status_code=400, detail="Missing required fields for NFT minting.")

            result = await self.aptos_service.mint_nft_to_player(
                recipient_address,
                collection_name,
                token_name,
                token_description,
                token_uri
            )
            if result["success"]:
                return {"success": True, "data": result}
            else:
                raise HTTPException(status_code=400, detail=result.get("error", "NFT minting failed"))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))