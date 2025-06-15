from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    score: int = 0
    answers: List[dict] = []

class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[Player] = []
    status: str = "waiting"  # waiting, counting_down, in_progress, finished
    current_question: Optional[dict] = None
    start_time: Optional[datetime] = None
    winner: Optional[str] = None
    proof: Optional[str] = None

class CreateRoomRequest(BaseModel):
    username: str

class JoinRoomRequest(BaseModel):
    room_id: str
    username: str

class AnswerSubmission(BaseModel):
    room_id: str
    player_id: str
    answer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GameResult(BaseModel):
    room_id: str
    winner: str
    proof: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    final_scores: List[dict] 