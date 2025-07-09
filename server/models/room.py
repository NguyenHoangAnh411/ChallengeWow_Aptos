from pydantic import ConfigDict, Field, model_validator
from typing import Any, List, Optional
from datetime import datetime, timezone
import uuid

from config.question_config import QUESTION_CONFIG
from models.base import CamelModel
from models.player import Player
from models.question import Question
from models.zkproof import ZKProof
from enums.game_status import GAME_STATUS
from enums.question_difficulty import QUESTION_DIFFICULTY

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
    time_per_question: int = 10
    entry_fee: float = 0
    prize: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    current_questions: Optional[List[Question]] = None
    current_index: int = 0
    question_configs: dict[QUESTION_DIFFICULTY, Any] = QUESTION_CONFIG
    
    # Tie-break fields
    tie_break_round: int = 0
    tie_break_questions: Optional[List[Question]] = None
    tie_break_current_index: int = 0
    sudden_death_activated: bool = False
    tie_break_started_at: Optional[datetime] = None
    tie_break_winners: Optional[List[Optional[str]]] = None

    @model_validator(mode="before")
    @classmethod
    def fill_none_defaults(cls, data: dict):
        data = data.copy()
        if data.get("current_questions") is None:
            data["current_questions"] = []
        if data.get("current_index") is None:
            data["current_index"] = 0
        if data.get("tie_break_questions") is None:
            data["tie_break_questions"] = []
        if data.get("tie_break_current_index") is None:
            data["tie_break_current_index"] = 0
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
    
    @property
    def current_tie_break_question(self) -> Optional[Question]:
        if (
            self.tie_break_questions
            and 0 <= self.tie_break_current_index < len(self.tie_break_questions)
        ):
            return self.tie_break_questions[self.tie_break_current_index]
        return None
    
    def is_tie_break_active(self) -> bool:
        return self.status in [GAME_STATUS.TIE_BREAK, GAME_STATUS.SUDDEN_DEATH]
