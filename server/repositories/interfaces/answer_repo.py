from abc import ABC, abstractmethod
from datetime import datetime

class IAnswerRepository(ABC):
    @abstractmethod
    def save(self, room_id: str, player_id: str, question_id: str, answer: str, score: float, timestamp: datetime) -> None: pass
