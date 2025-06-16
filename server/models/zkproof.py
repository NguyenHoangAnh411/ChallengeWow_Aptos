from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid


# 🔐 Zero-knowledge proof lưu trên IPFS/on-chain
class ZKProof(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    score: float
    winner_hashed_id: str
    proof_ipfs_url: str
    onchain_tx_hash: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
