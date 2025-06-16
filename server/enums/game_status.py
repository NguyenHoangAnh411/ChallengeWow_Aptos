from enum import Enum


class GAME_STATUS(Enum):
    WAITING = "waiting"
    COUNTING_DOWN = "counting_down"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
