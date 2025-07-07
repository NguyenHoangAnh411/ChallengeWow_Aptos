from typing import List
from fastapi import APIRouter, Body, HTTPException
from models.create_room_request import CreateRoomRequest
from models.join_request import JoinRoomRequest
from controllers.room_controller import RoomController
from models.leave_room_request import LeaveRoomRequest
from models.room import Room
from models.update_settings import GameSettings

def create_room_router(room_controller: RoomController):
    router = APIRouter()

    @router.get("/rooms", response_model=List[Room])
    async def get_rooms(status: str = None):
        return await room_controller.get_rooms(status)

    @router.post("/rooms", response_model=Room)
    async def create_room(request: CreateRoomRequest):
        return await room_controller.create_room(request)
    
    @router.get("/rooms/{room_id}", response_model=Room)
    async def get_room(room_id: str):
        room = await room_controller.get_room_by_id(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail="Room not found")
        return room
    
    @router.get("/rooms/by-code/{room_code}", response_model=Room)
    async def get_room_by_code(room_code: str):
        return await room_controller.get_room_by_code(room_code)
    
    @router.get("/rooms/{room_id}/results")
    async def get_room_result(room_id: str) -> dict:
        return await room_controller.get_room_result(room_id)

    @router.post("/join-room")
    async def join_room(request: JoinRoomRequest):
        return await room_controller.join_room(request)

    @router.get("/current-room")
    async def get_current_room(wallet_id: str):
        return await room_controller.get_current_room(wallet_id)

    @router.delete("/leave-room")
    async def leave_room(request: LeaveRoomRequest):
        return await room_controller.leave_room(request.wallet_id, request.room_id)

    @router.get("/rooms/{room_id}/status")
    async def get_room_status(room_id: str):
        return await room_controller.get_room_status(room_id)

    @router.get("/rooms/{room_id}/settings")
    async def get_room_settings(room_id: str):
        return await room_controller.get_room_settings(room_id)

    @router.put("/rooms/{room_id}/settings")
    async def update_room_settings(room_id: str, request: GameSettings):
        return await room_controller.update_room_settings(room_id, request)
    
    return router
