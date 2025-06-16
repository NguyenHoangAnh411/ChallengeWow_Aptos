from abc import ABC, abstractmethod

class IQuestionRepository(ABC):
    @abstractmethod
    def get_random(self) -> dict | None: pass
