from pydantic import ConfigDict, Field
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
    id: str
    room_code: str
    players: List[Player] = []
    status: str = GAME_STATUS.WAITING
    current_question: Optional[Question] = None
    winner_wallet_id: Optional[str] = None
    proof: Optional["ZKProof"] = None
    total_questions: int = 10
    countdown_duration: int = 10
    entry_fee: float = 0
    prize: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    start_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    current_questions: Optional[List[Question]] = None
    current_index: int = 0

    model_config = ConfigDict(ser_enum_as_value=True)

    @classmethod
    def create(cls, **kwargs) -> "Room":
        generated_id = str(uuid.uuid4())
        room_code = generated_id[-4:]
        return cls(id=generated_id, room_code=room_code, **kwargs)
