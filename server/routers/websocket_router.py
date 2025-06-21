from fastapi import APIRouter, WebSocket
from controllers.websocket_controller import WebSocketController

def create_ws_router(controller: WebSocketController):
    router = APIRouter()

    @router.websocket("/")
    async def websocket_root_handler(websocket: WebSocket):
        await websocket.close(code=1008) 
    
    @router.websocket("/lobby")
    async def websocket_lobby(websocket: WebSocket):
        await controller.handle_lobby_socket(websocket)

    @router.websocket("/{room_id}")
    async def websocket_room(websocket: WebSocket, room_id: str):
        await controller.handle_room_socket(websocket, room_id)

    return router
