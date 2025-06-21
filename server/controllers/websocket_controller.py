import json
from fastapi import WebSocket, WebSocketDisconnect
from services.websocket_manager import WebSocketManager

class WebSocketController:
    def __init__(self, manager: WebSocketManager):
        self.manager = manager

    async def handle_lobby_socket(self, websocket: WebSocket):
        try:
            print("🔌 [LOBBY] Accepting WebSocket connection...")
            await self.manager.connect_lobby(websocket)
            print("✅ [LOBBY] Connection accepted.")

            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                print(f"📩 [LOBBY] Received: {data}")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    print("🏓 [LOBBY] Pong sent.")
                elif msg_type == "broadcast":
                    await self.manager.broadcast_to_lobby(data)
                    print("📢 [LOBBY] Broadcasted message.")

        except WebSocketDisconnect:
            print("❌ [LOBBY] WebSocket disconnected.")
            self.manager.disconnect_lobby(websocket)
        except Exception as e:
            print(f"⚠️ [LOBBY] Unexpected error: {e}")
            self.manager.disconnect_lobby(websocket)
            
    async def handle_room_socket(self, websocket: WebSocket, room_id: str):
        await self.manager.connect_room(websocket, room_id)
        try:
            while True:
                data = await websocket.receive_json()
                if not data:
                    return
                
                if not data.strip():
                    print("Empty message received")
                    return

                try:
                    json_data = json.loads(data)
                    msg_type = data.get("type")

                    if msg_type == "chat":
                        await self.manager.broadcast_to_room(room_id, f"{json_data.get('sender')}: {json_data.get('message')}")
                except json.JSONDecodeError:
                    print("Invalid JSON received:", data)
                    return
        except WebSocketDisconnect:
            self.manager.disconnect_room(websocket, room_id)
