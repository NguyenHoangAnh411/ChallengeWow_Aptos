from pydantic import ConfigDict, Field, model_validator
from typing import Any, List, Optional
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
    winner_wallet_id: Optional[str] = None
    proof: Optional["ZKProof"] = None
    total_questions: int = 10
    easy_questions: int = 5
    medium_questions: int = 3
    hard_questions: int = 2
    countdown_duration: int = 10
    time_per_question: int = 0
    entry_fee: float = 0
    prize: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    current_questions: Optional[List[Question]] = None
    current_index: int = 0
    question_configs: dict[str, Any] = {}

    model_config = ConfigDict(ser_enum_as_value=True)

    @model_validator(mode="before")
    @classmethod
    def fill_none_defaults(cls, data: dict):
        data = data.copy()
        if data.get("current_questions") is None:
            data["current_questions"] = []
        if data.get("current_index") is None:
            data["current_index"] = 0
        return data

    @classmethod
    def create(cls, **kwargs) -> "Room":
        generated_id = str(uuid.uuid4())
        room_code = generated_id[-4:]
        return cls(id=generated_id, room_code=room_code, **kwargs)
    
    @property
    def current_question(self) -> Optional[Question]:
        if (
            self.current_questions
            and 0 <= self.current_index < len(self.current_questions)
        ):
            return self.current_questions[self.current_index]
        return None
