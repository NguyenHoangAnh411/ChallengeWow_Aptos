from pydantic import BaseModel
from typing import List, Dict, Any

class PlayerResult(BaseModel):
    wallet: str
    oath: str
    score: int
    answers: List[Dict[str, Any]]
