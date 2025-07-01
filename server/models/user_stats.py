from datetime import datetime
from pydantic import Field
from models.base import CamelModel

class UserStats(CamelModel):
    wallet_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    total_score: int = 0
    games_won: int = 0
    rank: int = 0
