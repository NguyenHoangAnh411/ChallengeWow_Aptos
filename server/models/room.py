from pydantic import Field, model_validator
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.base import CamelModel
from models.player import Player
from models.question import Question
from models.zkproof import ZKProof
from enums.game_status import GAME_STATUS

# 🏠 Phòng chơi
class Room(CamelModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[Player] = []
    status: str = GAME_STATUS.WAITING
    current_question: Optional[Question] = None
    winner_wallet_id: Optional[str] = None
    proof: Optional["ZKProof"] = None
    time_per_question: int = 20 # in second
    total_questions: int = 10
    countdown_duration: int = 10
    entry_fee: float = 0
    prize: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    start_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    @property
    def duration(self) -> int:
        return self.total_questions * self.time_per_question

    @model_validator(mode="after")
    def check_at_least_one_player(self) -> "Room":
        if not self.players:
            raise ValueError("Room must have at least one player.")
        return self