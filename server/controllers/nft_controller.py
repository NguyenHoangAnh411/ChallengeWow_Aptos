from fastapi import HTTPException
from services.nft_service import BlockchainService

class NFTController:
    def __init__(self):
        self.nft_service = BlockchainService()

    async def award_nft(self, action: str, room_id: str, metadata_uri: str = None, winner_address: str = None):
        try:
            if action == "mint":
                # Nếu không truyền metadata_uri thì tự sinh ra
                if not metadata_uri:
                    metadata_uri = f"https://challengewave.com/nft/{room_id}"
                return self.nft_service.mint_nft(room_id, metadata_uri)
            elif action == "transfer":
                if not winner_address:
                    raise HTTPException(status_code=400, detail="winner_address is required for transfer action")
                
                # Generate default metadata_uri if not provided
                if not metadata_uri:
                    metadata_uri = f"https://challengewave.com/nft/{room_id}"
                
                # Mint NFT trước (nếu chưa có), sau đó transfer cho winner
                try:
                    # Thử mint NFT (có thể đã tồn tại)
                    mint_result = self.nft_service.mint_nft(room_id, metadata_uri)
                except Exception as mint_error:
                    # Nếu NFT đã tồn tại, bỏ qua lỗi và tiếp tục
                    if "NFT already exists" in str(mint_error):
                        print(f"NFT already exists for room {room_id}, continuing with transfer...")
                    else:
                        raise mint_error
                
                # Transfer NFT cho winner bằng cách submit game result
                score = 100
                zk_proof = "0x" + "00"*32
                transfer_result = self.nft_service.submit_game_result(room_id, winner_address, score, zk_proof)
                
                return {
                    "message": "NFT minted and transferred successfully",
                    "mint_result": mint_result if 'mint_result' in locals() else "NFT already existed",
                    "transfer_result": transfer_result
                }
            else:
                raise HTTPException(status_code=400, detail="Invalid action")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"NFT action failed: {str(e)}")

    async def get_nft_info(self, room_id: str):
        """Get NFT information by room ID"""
        try:
            return self.nft_service.get_nft_by_room(room_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get NFT info: {str(e)}") 