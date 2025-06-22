from typing import Dict, List
from fastapi import WebSocket
from helpers.json_helper import send_json_safe

class WebSocketManager:
    def __init__(self):
        self.room_connections: Dict[str, List[WebSocket]] = {}
        self.lobby_connections: List[WebSocket] = []
        self.player_connections: dict[str, WebSocket] = {}

    async def connect_room(self, websocket: WebSocket, room_id: str, wallet_id: str):
        await websocket.accept()
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        self.room_connections[room_id].append(websocket)
        self.player_connections[wallet_id] = websocket
        print(f"✅ {wallet_id} connected to room {room_id}")

    def disconnect_room(self, websocket: WebSocket, room_id: str, wallet_id: str):
        if room_id in self.room_connections:
            if websocket in self.room_connections[room_id]:
                self.room_connections[room_id].remove(websocket)

        # Gỡ kết nối theo wallet_id luôn
        if self.player_connections.get(wallet_id) == websocket:
            del self.player_connections[wallet_id]

    async def get_player_socket_by_wallet(self, wallet_id: str) -> WebSocket | None:
        return self.player_connections.get(wallet_id)

    async def broadcast_to_room(self, room_id: str, message: dict):
        connections = self.room_connections.get(room_id, [])
        for conn in connections:
            try:
                await send_json_safe(conn, message)
            except Exception as e:
                print(f"❌ Failed to send WS message: {e}")
            
    async def connect_lobby(self, websocket: WebSocket):
        await websocket.accept()
        self.lobby_connections.append(websocket)

    def disconnect_lobby(self, websocket: WebSocket):
        if websocket in self.lobby_connections:
            self.lobby_connections.remove(websocket)

    async def broadcast_to_lobby(self, message: dict):
        for ws in self.lobby_connections:
            await send_json_safe(ws, message)
