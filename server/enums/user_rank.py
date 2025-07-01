from enum import Enum

DIAMOND_POINT = 2000
GOLD_POINT = 1500
SILVER_POINT = 1000

class USER_RANK(str, Enum):
    DIAMOND = "diamond"
    GOLD = "gold"
    SILVER = "silver"
    BRONZE = "bronze"
