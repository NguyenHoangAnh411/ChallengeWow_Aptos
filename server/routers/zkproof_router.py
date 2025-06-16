from fastapi import APIRouter
from controllers.zkproof_controller import ZkProofController
from models.zkproof import ZKProof

def create_zkproof_router(controller: ZkProofController):
    router = APIRouter()

    @router.post("/zk-proof")
    def submit_proof(request: ZKProof):
        return controller.submit_proof(
            request.room_id,
            request.winner_hashed_id,
            request.proof_ipfs_url,
            request.onchain_tx_hash
        )

    return router