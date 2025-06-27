from abc import ABC, abstractmethod
from enums.question_difficulty import QUESTION_DIFFICULTY
from models.question import Question
class IQuestionRepository(ABC):
    @abstractmethod
    async def get_random(self) -> Question | None:
        pass

    @abstractmethod
    async def get_random_by_difficulty(self, difficulty: QUESTION_DIFFICULTY, limit: int = 10) -> list[Question]:
        pass