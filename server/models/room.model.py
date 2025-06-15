from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

# 🏠 Phòng chơi
class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[Player] = []
    status: str = "waiting"  # waiting, counting_down, in_progress, finished
    current_question: Optional[Question] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    winner_user_id: Optional[str] = None
    zk_proof: Optional["ZKProof"] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
