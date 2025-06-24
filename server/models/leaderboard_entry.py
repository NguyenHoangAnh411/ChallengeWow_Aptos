from datetime import datetime
from typing import Optional
from enums.leaderboard_period import LEADERBOARD_PERIOD
from enums.user_rank import DIAMOND_POINT, GOLD_POINT, SILVER_POINT, USER_RANK
from models.base import CamelModel

class LeaderboardEntry(CamelModel):
    wallet_id: str
    username: str = ""
    avatar_url: Optional[str] = None  # URL ảnh đại diện (nếu cần)

    total_score: int = 0             # Tổng điểm
    games_played: int = 0            # Số game đã chơi
    games_won: int = 0               # Số game thắng

    rank: Optional[int] = None       # Thứ hạng xếp theo điểm
    tier: Optional[str] = None       # Gold, Silver, Bronze, v.v.

    updated_at: Optional[datetime] = None  # Cập nhật gần nhất
    leaderboard_period: Optional[str] = LEADERBOARD_PERIOD.ALL_TIME  # "daily", "weekly", "all_time"

    def calculate_win_rate(self):
        if self.games_played > 0:
            self.win_rate = round(self.games_won / self.games_played, 4)
        else:
            self.win_rate = 0.0

    def calculate_tier(self):
        if self.total_score >= DIAMOND_POINT:
            self.tier = USER_RANK.DIAMOND
        elif self.total_score >= GOLD_POINT:
            self.tier = USER_RANK.GOLD
        elif self.total_score >= SILVER_POINT:
            self.tier = USER_RANK.SILVER
        else:
            self.tier = USER_RANK.BRONZE
