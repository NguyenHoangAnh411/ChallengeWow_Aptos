from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

# ✅ Trả lời của người chơi
class Answer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: str
    wallet_id: str
    room_id: str
    selected_index: int
    is_correct: bool
    time_taken: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
