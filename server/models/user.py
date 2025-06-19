from models.base import CamelModel

class User(CamelModel):
    id: str
    username: str | None = None
    wallet_address: str
    total_score: int = 0
    games_won: int = 0
    rank: int = 0
    created_at: str | None = None 