from pydantic import Field
import uuid
from datetime import datetime, timezone
from typing import Union, Optional

from models.base import CamelModel

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
    
    # Additional fields used in WebSocket controller (not stored in DB)
    question_index: Optional[int] = Field(default=None, exclude=True)
    player_answer: Optional[str] = Field(default=None, exclude=True)
    correct_answer: Optional[str] = Field(default=None, exclude=True)
    points_earned: Optional[int] = Field(default=None, exclude=True)
    submitted_at: Optional[datetime] = Field(default=None, exclude=True)