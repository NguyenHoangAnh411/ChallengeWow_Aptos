from pydantic import BaseModel

# 📥 Request: Tham gia phòng
class JoinRoomRequest(BaseModel):
    room_id: str
    username: str
    wallet_id: str