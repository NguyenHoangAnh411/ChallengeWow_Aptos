from enum import Enum

class PLAYER_STATUS(str, Enum):
    ACTIVE = "active"  # Đang chơi
    WAITING = "waiting"  # Trong phòng chờ
    READY = "ready"
    QUIT = "quit"  # Chủ động thoát
    DISCONNECTED = "disconnected"  # Mất kết nối
    ELIMINATED = "eliminated"  # Trả lời sai, bị loại
    WINNER = "winner"  # Là người thắng
