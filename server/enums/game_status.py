from enum import Enum

class GAME_STATUS(str, Enum):
    WAITING = "waiting"
    COUNTING_DOWN = "counting_down"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    TIE_BREAK = "tie_break"
    SUDDEN_DEATH = "sudden_death"
