from pydantic import BaseModel

# 📥 Request: Tạo phòng
class CreateRoomRequest(BaseModel):
    username: str
    