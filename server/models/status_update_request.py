from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    status: str
