from enums.question_difficulty import QUESTION_DIFFICULTY

QUESTION_CONFIG = {
    QUESTION_DIFFICULTY.EASY: {
        "time": 15,
        "score": 50,
        "speed_bonus_enabled": False,
        "max_speed_bonus": 0,
    },
    QUESTION_DIFFICULTY.MEDIUM: {
        "time": 20,
        "score": 100,
        "speed_bonus_enabled": True,
        "max_speed_bonus": 30,
    },
    QUESTION_DIFFICULTY.HARD: {
        "time": 25,
        "score": 150,
        "speed_bonus_enabled": True,
        "max_speed_bonus": 50,
    }
}
