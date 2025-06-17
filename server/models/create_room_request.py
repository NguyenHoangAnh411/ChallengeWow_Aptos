from pydantic import BaseModel

# 📥 Request: Tạo phòng
class CreateRoomRequest(BaseModel):
    wallet_id: str
    username: str
