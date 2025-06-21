from abc import ABC, abstractmethod

from models.question import Question


class IQuestionRepository(ABC):
    @abstractmethod
    def get_random(self) -> Question | None:
        pass
