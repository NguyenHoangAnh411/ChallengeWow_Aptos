from pydantic import Field
import uuid
from datetime import datetime, timezone

from models.base import CamelModel

# ✅ Trả lời của người chơi
class Answer(CamelModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: str
    wallet_id: str
    room_id: str
    answer: str = ""
    is_correct: bool
    score: int
    response_time: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
