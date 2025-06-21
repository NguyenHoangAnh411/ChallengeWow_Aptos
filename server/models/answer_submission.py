from pydantic import BaseModel, Field
from datetime import datetime, timezone

# 📥 Request: Nộp câu trả lời
class AnswerSubmission(BaseModel):
    room_id: str
    wallet_id: str
    question_id: str
    answer: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
