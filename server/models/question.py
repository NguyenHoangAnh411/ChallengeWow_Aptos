from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
from typing import List
import uuid

from enums.question_difficulty import QUESTION_DIFFICULTY
from models.base import CamelModel

# ❓ Câu hỏi
class Question(CamelModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    difficulty: QUESTION_DIFFICULTY
    options: List[str]
    correct_option_index: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = None

    @property
    def correct_text(self) -> str:
        return self.options[self.correct_option_index].lower().strip()

    model_config = ConfigDict(ser_enum_as_value=True)
