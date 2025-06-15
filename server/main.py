from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.create_room_request import CreateRoomRequest
from models.join_request import JoinRoomRequest
from models.answer_submission import AnswerSubmission
from models.player import Player
from models.room import Room

from config.database import get_room, save_room, get_random_question
from services.game_logic import start_countdown, calculate_score
import asyncio
from typing import Dict, List
import json
import os

app = FastAPI(title="Challenge Wave API")

PORT = int(os.getenv("PORT", 9000))

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.post("/create-room")
async def create_room(request: CreateRoomRequest):
    """Create a new game room"""
    player = Player(username=request.username)
    room = Room(players=[player])
    save_room(room)
    return {"room_id": room.id, "player_id": player.id}

@app.post("/join-room")
async def join_room(request: JoinRoomRequest):
    """Join an existing game room"""
    room = get_room(request.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if len(room.players) >= 4:
        raise HTTPException(status_code=400, detail="Room is full")
    
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Game already in progress")
    
    player = Player(username=request.username)
    room.players.append(player)
    save_room(room)
    
    # Start countdown if we have enough players
    if len(room.players) >= 2:
        asyncio.create_task(start_countdown(room))
    
    return {"room_id": room.id, "player_id": player.id}

@app.post("/submit-answer")
async def submit_answer(submission: AnswerSubmission):
    """Submit an answer for the current question"""
    room = get_room(submission.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.status != "in_progress":
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    player = next((p for p in room.players if p.id == submission.player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Calculate score
    score = calculate_score(submission.timestamp, room.start_time)
    
    # Update player's answer
    player.answers.append({
        "question_id": room.current_question["id"],
        "answer": submission.answer,
        "score": score
    })
    player.score += score
    
    save_room(room)
    return {"score": score}

@app.get("/room/{room_id}")
async def get_room_status(room_id: str):
    """Get current room status"""
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {
        "status": room.status,
        "players": [{"id": p.id, "username": p.username, "score": p.score} for p in room.players],
        "current_question": room.current_question if room.status == "in_progress" else None
    }

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for real-time game updates"""
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            await manager.broadcast(data, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
