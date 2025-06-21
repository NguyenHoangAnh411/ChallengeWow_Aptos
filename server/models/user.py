from models.base import CamelModel


class User(CamelModel):
    wallet_id: str
    username: str | None = None
    total_score: int = 0
    games_won: int = 0
    rank: int = 0
    created_at: str | None = None
