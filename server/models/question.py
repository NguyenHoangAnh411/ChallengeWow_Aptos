from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List
import uuid

# ❓ Câu hỏi
class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    options: List[str]
    correct_option_index: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @property
    def correct_text(self) -> str:
        return self.options[self.correct_option_index]
