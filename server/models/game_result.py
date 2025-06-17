from pydantic import BaseModel, Field
from typing import List
from datetime import datetime, timezone

# 📤 Kết quả game
class GameResult(BaseModel):
    room_id: str
    winner_wallet_id: str
    proof: str  # IPFS URL hoặc TX Hash
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    final_scores: List[dict]  # hoặc List[PlayerSummary]
