from typing import Optional
from pydantic import model_validator
from models.base import CamelModel


# 📥 Request: Tham gia phòng
class JoinRoomRequest(CamelModel):
    room_id: Optional[str] = None
    room_code: Optional[str] = None
    username: str
    wallet_id: str

    @model_validator(mode="after")
    def check_room_identifier(self) -> "JoinRoomRequest":
        if not self.room_id and not self.room_code:
            raise ValueError("Either 'room_id' or 'room_code' must be provided.")
        return self