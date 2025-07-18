from fastapi import APIRouter, Query, WebSocket
from controllers.websocket_controller import WebSocketController

def create_ws_router(controller: WebSocketController):
    router = APIRouter()

    @router.websocket("/")
    async def websocket_root_handler(websocket: WebSocket):
        await websocket.close(code=1008) 
    
    @router.websocket("/lobby")
    async def websocket_lobby(websocket: WebSocket):
        await controller.handle_lobby_socket(websocket)

    @router.websocket("/feed")
    async def websocket_feed(websocket: WebSocket):
        await controller.handle_feed_socket(websocket)

    @router.websocket("/{room_id}")
    async def websocket_room(websocket: WebSocket, room_id: str, wallet_id: str = Query(None)):
        if not wallet_id:
            await websocket.close(code=1008)
            return
        await controller.handle_room_socket(websocket, room_id, wallet_id)

    # Thêm endpoint để force end game cho test
    @router.post("/force-end-game/{room_id}")
    async def force_end_game(room_id: str):
        """Force end game for testing NFT minting and transferring"""
        try:
            result = await controller.force_end_game_for_test(room_id)
            return {"success": True, "message": result["message"]}
        except Exception as e:
            return {"success": False, "error": str(e)}

    return router
