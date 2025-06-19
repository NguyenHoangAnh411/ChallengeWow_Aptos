from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict

class IAnswerRepository(ABC):
    @abstractmethod
    def save(
        self,
        room_id: str,
        user_id: str,
        question_id: str,
        selected_index: int,
        is_correct: bool,
        time_taken: float,
        timestamp: datetime,
    ) -> None:
        """Lưu 1 câu trả lời của người chơi"""
        pass

    @abstractmethod
    def get_answers_by_room(self, room_id: str) -> List[Dict]:
        """Truy xuất tất cả câu trả lời trong 1 phòng"""
        pass

    @abstractmethod
    def get_answers_by_user(self, room_id: str, user_id: str) -> List[Dict]:
        """Truy xuất câu trả lời của 1 người chơi trong phòng"""
        pass

    @abstractmethod
    def get_score_by_user(self, room_id: str, user_id: str) -> float:
        """Tính tổng điểm của người chơi trong phòng"""
        pass
