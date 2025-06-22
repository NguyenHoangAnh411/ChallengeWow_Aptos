
from models.base import CamelModel

class ChatPayload(CamelModel):
    sender: str
    message: str