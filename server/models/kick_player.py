from models.base import CamelModel

class KickPayload(CamelModel):
    room_id: str
    wallet_id: str
    