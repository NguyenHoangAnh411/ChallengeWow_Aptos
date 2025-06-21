import json
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

class WebSocketManager:
    def __init__(self):
        self.room_connections: Dict[str, List[WebSocket]] = {}
        self.lobby_connections: List[WebSocket] = []

    async def connect_room(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        print(f"[WS] Client connected to room {room_id}")
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        self.room_connections[room_id].append(websocket)

    def disconnect_room(self, websocket: WebSocket, room_id: str):
        if room_id in self.room_connections:
            if websocket in self.room_connections[room_id]:
                self.room_connections[room_id].remove(websocket)

    async def broadcast_to_room(self, room_id: str, message: dict):
        """Gửi message dưới dạng JSON string cho các clients trong room"""
        if room_id in self.room_connections:
            print(f"[WS] Broadcasting to room {room_id}: {message}") 
            for i, ws in enumerate(self.room_connections[room_id]):
                try:
                    await ws.send_text(json.dumps(message))
                    print(f"[WS] Sent to client #{i + 1} in room {room_id}")
                except Exception as e:
                    print(f"[WS] Failed to send to client #{i + 1}: {e}")
        else:
            print(f"[WS] No active connections found for room {room_id}")
            
    async def connect_lobby(self, websocket: WebSocket):
        await websocket.accept()
        self.lobby_connections.append(websocket)

    def disconnect_lobby(self, websocket: WebSocket):
        if websocket in self.lobby_connections:
            self.lobby_connections.remove(websocket)

    async def broadcast_to_lobby(self, message: dict):
        for ws in self.lobby_connections:
            await ws.send_json(message)
