from models.base import CamelModel


class User(CamelModel):
    wallet_id: str
    username: str | None = None
    created_at: str | None = None
