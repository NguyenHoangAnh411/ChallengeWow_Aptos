from models.base import CamelModel


# 📥 Request: Tham gia phòng
class JoinRoomRequest(CamelModel):
    room_id: str
    username: str
    wallet_id: str
