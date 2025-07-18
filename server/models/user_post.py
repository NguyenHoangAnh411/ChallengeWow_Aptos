from models.base import CamelModel
from typing import Optional
from datetime import datetime

class UserPost(CamelModel):
    id: str
    wallet_id: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    username: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    hashtag: Optional[str] = None
    like_count: Optional[int] = 0
    comment_count: Optional[int] = 0
    is_liked: Optional[bool] = False
    is_commented: Optional[bool] = False
    is_deleted: Optional[bool] = False
    is_hidden: Optional[bool] = False