from typing import List, Optional
from pydantic import Field, field_validator
from datetime import datetime, timezone
import uuid

from enums.player_status import PLAYER_STATUS
from models.answer import Answer
from models.base import CamelModel


# 👤 Người chơi trong phòng
class Player(CamelModel):
    wallet_id: str
    room_id: str
    username: str
    score: float = 0.0
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quit_at: Optional[datetime] = None 
    is_winner: bool = False
    is_ready: bool = False
    is_host: bool = False
    player_status: PLAYER_STATUS = PLAYER_STATUS.ACTIVE
    answers: List["Answer"] = Field(default_factory=list)

    @field_validator('answers', mode='before')
    def validate_answers(cls, v):
        if not v:
            return []
        validated = []
        for item in v:
            if isinstance(item, Answer):
                validated.append(item)
            elif isinstance(item, dict):
                try:
                    validated.append(Answer(**item))
                except Exception as e:
                    print(f"[WARNING] Failed to convert dict to Answer: {e}")
            else:
                print(f"[WARNING] Invalid answer type: {type(item)}")
        return validated
    
    class Config:
        use_enum_values = True
        arbitrary_types_allowed = True
    
    def add_answer(self, answer_data) -> bool:
        """Safe method to add answer"""
        try:
            if isinstance(answer_data, Answer):
                self.answers.append(answer_data)
                return True
            elif isinstance(answer_data, dict):
                answer_obj = Answer(**answer_data)
                self.answers.append(answer_obj)
                return True
            else:
                print(f"[ERROR] Cannot add answer of type {type(answer_data)}")
                return False
        except Exception as e:
            print(f"[ERROR] Failed to add answer: {e}")
            return False
    
    def get_total_score(self) -> int:
        """Calculate total score safely"""
        return sum(answer.score for answer in self.answers)
    
    def has_answered_question(self, question_id: str) -> bool:
        """Check if player answered specific question"""
        return any(answer.question_id == question_id for answer in self.answers)