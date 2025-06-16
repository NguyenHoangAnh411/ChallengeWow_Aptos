from fastapi import HTTPException
from services.zkproof_service import ZkProofService
from typing import List

class ZkProofController:
    def __init__(self, zkproof_service: ZkProofService):
        self.zkproof_service = zkproof_service

    def submit_proof(self, room_id: str, winner_id: str, proof: str, scores: List[dict]):
        try:
            self.zkproof_service.store_proof(room_id, winner_id, proof, scores)
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
