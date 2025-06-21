from typing import List
from fastapi import APIRouter, Body, WebSocket

from models.create_room_request import CreateRoomRequest
from models.join_request import JoinRoomRequest
from controllers.room_controller import RoomController
from models.leave_room_request import LeaveRoomRequest
from models.room import Room

def create_room_router(room_controller: RoomController):
    router = APIRouter()

    @router.get("/rooms", response_model=List[Room])
    def get_rooms():
        return room_controller.get_rooms()

    @router.post("/rooms", response_model=Room)
    async def create_room(request: CreateRoomRequest):
        return room_controller.create_room(request)
    
    @router.get("/rooms/{room_id}", response_model=Room)
    def get_room(room_id: str):
        return room_controller.get_room_by_id(room_id)
        
    @router.post("/join-room")
    async def join_room(request: JoinRoomRequest):
        return await room_controller.join_room(request)

    @router.get("/current-room")
    def get_current_room(wallet_id: str):
        return room_controller.get_current_room(wallet_id)

    @router.delete("/leave-room")
    async def leave_room(request: LeaveRoomRequest):
        return await room_controller.leave_room(request.wallet_id, request.room_id)

    @router.get("/rooms/{room_id}/status")
    def get_room_status(room_id: str):
        return room_controller.get_room_status(room_id)

    return router
