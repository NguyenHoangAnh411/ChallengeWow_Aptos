from fastapi import HTTPException, WebSocket, WebSocketDisconnect
from models.player import Player
from models.room import Room
from enums.game_status import GAME_STATUS
from services.room_service import RoomService
from services.game_service import GameService
import asyncio

class RoomController:
    def __init__(self, room_service: RoomService, game_service: GameService):
        self.room_service = room_service
        self.game_service = game_service
        self.manager: dict[str, list[WebSocket]] = {}

    def create_room(self, request):
        player = Player(wallet_id=request.wallet_id, username=request.username)
        room = Room(players=[player])
        self.room_service.save_room(room)
        return {"room_id": room.id, "player_id": player.id, "wallet_id": player.wallet_id}

    def join_room(self, request):
        room = self.room_service.get_room(request.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if len(room.players) >= 4:
            raise HTTPException(status_code=400, detail="Room is full")
        if room.status != GAME_STATUS.WAITING:
            raise HTTPException(status_code=400, detail="Game already in progress")
        
        player = Player(wallet_id=request.wallet_id, username=request.username)
        room.players.append(player)
        self.room_service.save_room(room)

        if len(room.players) >= 2:
            asyncio.create_task(self.game_service.start_countdown(room))

        return {"room_id": room.id, "player_wallet_id": player.wallet_id}

    def submit_answer(self, submission):
        room = self.room_service.get_room(submission.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.status != GAME_STATUS.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Game is not in progress")
        
        player = next((p for p in room.players if p.id == submission.player_id), None)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        score = self.game_service.calculate_score(submission.timestamp, room.start_time)
        player.answers.append({
            "question_id": room.current_question["id"],
            "answer": submission.answer,
            "score": score
        })
        player.score += score
        self.room_service.save_room(room)
        return {"score": score}

    def get_room_status(self, room_id: str):
        room = self.room_service.get_room(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return {
            "status": room.status,
            "players": [{"id": p.id, "username": p.username, "score": p.score} for p in room.players],
            "current_question": room.current_question if room.status == GAME_STATUS.IN_PROGRESS else None
        }
        
    async def handle_websocket(self, websocket: WebSocket, room_id: str):
        if room_id not in self.manager:
            self.manager[room_id] = []
        await websocket.accept()
        self.manager[room_id].append(websocket)

        try:
            while True:
                data = await websocket.receive_text()
                for conn in self.manager[room_id]:
                    await conn.send_text(data)
        except WebSocketDisconnect:
            self.manager[room_id].remove(websocket)
