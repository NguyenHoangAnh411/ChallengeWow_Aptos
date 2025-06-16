from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.player import Player
from models.question import Question
from models.zkproof import ZKProof
from enums.game_status import GAME_STATUS


# 🏠 Phòng chơi
class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[Player] = []
    status: str = GAME_STATUS.WAITING
    current_question: Optional[Question] = None
    started_at: Optional[datetime] = None
    winner_wallet_id: Optional[str] = None
    zk_proof: Optional["ZKProof"] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = None
    start_time: Optional[datetime] = None
