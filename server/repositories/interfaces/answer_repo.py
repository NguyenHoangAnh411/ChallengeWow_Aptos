from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict

from models.answer import Answer


class IAnswerRepository(ABC):
    @abstractmethod
    async def save(self, answer: Answer) -> None:
        """Lưu 1 câu trả lời của người chơi"""
        pass

    @abstractmethod
    async def get_answers_by_room(self, room_id: str) -> List[Answer]:
        """Truy xuất tất cả câu trả lời trong 1 phòng"""
        pass

    @abstractmethod
    async def get_answers_by_wallet_id(self, room_id: str, wallet_id: str) -> List[Answer]:
        """Truy xuất câu trả lời của 1 người chơi trong phòng"""
        pass

    @abstractmethod
    async def get_score_by_user(self, room_id: str, wallet_id: str) -> float:
        """Tính tổng điểm của người chơi trong phòng"""
        pass
