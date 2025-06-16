from repositories.interfaces.zkproof_repo import IZkProofRepository
from typing import List

class ZkProofService:
    def __init__(self, zk_repo: IZkProofRepository):
        self.zk_repo = zk_repo

    def store_proof(self, room_id: str, winner_id: str, proof: str, scores: List[dict]):
        self.zk_repo.save_proof(room_id, winner_id, proof, scores)
