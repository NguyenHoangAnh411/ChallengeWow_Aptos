from enums.question_difficulty import QUESTION_DIFFICULTY

QUESTION_CONFIG = {
    QUESTION_DIFFICULTY.EASY: {
        "quantity": 5,
        "time_per_question": 15,
        "score": 50,
        "speed_bonus_enabled": False,
        "max_speed_bonus": 0,
    },
    QUESTION_DIFFICULTY.MEDIUM: {
        "quantity": 3,
        "time_per_question": 20,
        "score": 100,
        "speed_bonus_enabled": True,
        "max_speed_bonus": 30,
    },
    QUESTION_DIFFICULTY.HARD: {
        "quantity": 2,
        "time_per_question": 25,
        "score": 150,
        "speed_bonus_enabled": True,
        "max_speed_bonus": 50,
    },
}
