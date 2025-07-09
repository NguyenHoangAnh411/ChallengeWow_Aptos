from pydantic import Field
import uuid
from datetime import datetime, timezone
from typing import Union, Optional

from models.base import CamelModel
from enums.answer_type import ANSWER_TYPE

class Answer(CamelModel):
    id: Union[str, uuid.UUID] = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: Union[str, uuid.UUID]  # Change to accept UUID
    wallet_id: str
    room_id: Union[str, uuid.UUID]      # Change to accept UUID
    answer: str = ""
    is_correct: bool
    score: int
    response_time: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Tie-break fields
    answer_type: ANSWER_TYPE = ANSWER_TYPE.REGULAR  # "regular", "tie_break", "sudden_death"
    tie_break_round: Optional[int] = None  # 1 or 2 for tie-break answers
    
    # Additional fields used in WebSocket controller (not stored in DB)
    question_index: Optional[int] = Field(default=None, exclude=True)
    player_answer: Optional[str] = Field(default=None, exclude=True)
    correct_answer: Optional[str] = Field(default=None, exclude=True)
    points_earned: Optional[int] = Field(default=None, exclude=True)
    submitted_at: Optional[datetime] = Field(default=None, exclude=True)