
from datetime import datetime
from models.base import CamelModel

class Sender(CamelModel):
    walletId: str
    username: str
    createdAt: datetime | None = None

    # Automatically set createdAt if not provided
    def model_post_init(self, __context__):
        if self.createdAt is None:
            self.createdAt = datetime.utcnow()

class ChatPayload(CamelModel):
    sender: Sender
    message: str