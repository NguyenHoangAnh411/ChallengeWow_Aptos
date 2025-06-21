from typing import Optional
from pydantic import Field
from datetime import datetime, timezone
import uuid

from enums.player_status import PLAYER_STATUS
from models.base import CamelModel


# 👤 Người chơi trong phòng
class Player(CamelModel):
    wallet_id: str
    room_id: str
    username: str
    score: float = 0.0
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quit_at: Optional[datetime] = None 
    is_winner: bool = False
    is_host: bool = False
    player_status: PLAYER_STATUS = PLAYER_STATUS.ACTIVE
