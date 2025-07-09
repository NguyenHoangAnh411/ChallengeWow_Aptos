from enum import Enum

class ANSWER_TYPE(str, Enum):
    REGULAR = "regular"
    TIE_BREAK = "tie_break"
    SUDDEN_DEATH = "sudden_death"
