from pydantic import Field

from models.base import CamelModel

class QuestionDistribution(CamelModel):
    easy: int = Field(ge=0)
    medium: int = Field(ge=0)
    hard: int = Field(ge=0)

class GameSettings(CamelModel):
    time_per_question: int = Field(gt=0)
    questions: QuestionDistribution