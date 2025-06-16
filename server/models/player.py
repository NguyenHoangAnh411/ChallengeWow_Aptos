from pydantic import BaseModel, Field
from typing import List
from datetime import datetime, timezone
import uuid

from models.answer import Answer


# 👤 Người chơi trong phòng
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_id: str
    username: str
    score: float = 0.0
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_winner: bool = False
    answers: List["Answer"] = []
