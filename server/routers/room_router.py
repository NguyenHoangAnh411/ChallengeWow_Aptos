from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from models.create_room_request import CreateRoomRequest
from models.join_request import JoinRoomRequest
from models.answer_submission import AnswerSubmission
from controllers.room_controller import RoomController

def create_room_router(room_controller: RoomController):
    router = APIRouter()

    @router.post("/create-room")
    async def create_room(request: CreateRoomRequest):
        return room_controller.create_room(request)

    @router.post("/join-room")
    async def join_room(request: JoinRoomRequest):
        return room_controller.join_room(request)

    @router.post("/submit-answer")
    async def submit_answer(submission: AnswerSubmission):
        return room_controller.submit_answer(submission)

    @router.get("/room/{room_id}")
    async def get_room_status(room_id: str):
        return room_controller.get_room_status(room_id)

    @router.websocket("/ws/{room_id}")
    async def websocket_endpoint(websocket: WebSocket, room_id: str):
        await room_controller.handle_websocket(websocket, room_id)
    
    return router