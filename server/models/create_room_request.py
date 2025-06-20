from models.base import CamelModel

# 📥 Request: Tạo phòng
class CreateRoomRequest(CamelModel):
    username: str
    wallet_id: str
    total_questions: int = 10
    countdown_duration: int = 10
    
