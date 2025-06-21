from models.base import CamelModel

# 📥 Request: Tạo phòng
class LeaveRoomRequest(CamelModel):
    wallet_id: str
    room_id: str
