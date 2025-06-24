from models.base import CamelModel

class LeaderboardEntry(CamelModel):
    wallet_id: str
    username: str = ""
    total_score: int
    games_won: int
    rank: str 