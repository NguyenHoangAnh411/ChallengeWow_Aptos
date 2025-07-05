import asyncio
from fastapi import WebSocket
from gotrue import Callable
from enums.game_status import GAME_STATUS
from helpers.json_helper import send_json_safe
import asyncio

class WebSocketManager:
    def __init__(self):
        self.room_connections: dict[str, set[WebSocket]] = {}
        self.lobby_connections: set[WebSocket] = set()
        self.player_connections: dict[str, WebSocket] = {}
        self.room_states: dict[str, GAME_STATUS] = {}
        self.room_timeouts: dict[str, asyncio.Task] = {}

    async def connect_room(self, websocket: WebSocket, room_id: str, wallet_id: str):
        await websocket.accept()
        self.room_connections.setdefault(room_id, set()).add(websocket)
        self.player_connections[wallet_id] = websocket
    
    def disconnect_room(self, websocket: WebSocket, room_id: str, wallet_id: str):
        if room_id in self.room_connections:
            if websocket in self.room_connections[room_id]:
                self.room_connections[room_id].discard(websocket)

        # Gỡ kết nối theo wallet_id luôn
        if self.player_connections.get(wallet_id) == websocket:
            del self.player_connections[wallet_id]

    def disconnect_room_by_room_id(self, room_id: str):
        if room_id in self.room_connections:
            for ws in self.room_connections[room_id]:
                try:
                    asyncio.create_task(ws.close())
                except:
                    pass  # đảm bảo không crash nếu socket đã disconnect

            del self.room_connections[room_id]

        # Xoá player_connections liên quan
        to_delete = [wallet_id for wallet_id, ws in self.player_connections.items()
                    if ws in self.room_connections.get(room_id, [])]
        for wallet_id in to_delete:
            del self.player_connections[wallet_id]
        
        self.clear_room_timeout(room_id)
        self.room_states.pop(room_id, None)


    async def get_player_socket_by_wallet(self, wallet_id: str) -> WebSocket | None:
        return self.player_connections.get(wallet_id)
    
    def get_players_in_room(self, room_id: str) -> list[WebSocket]:
        return list(self.room_connections.get(room_id, set()))

    async def broadcast_to_room(self, room_id: str, message: dict):
        connections = self.room_connections.get(room_id, [])
        for conn in connections:
            try:
                await send_json_safe(conn, message)
            except Exception as e:
                print(f"❌ Failed to send WS message: {e}")
            
    async def connect_lobby(self, websocket: WebSocket):
        await websocket.accept()
        self.lobby_connections.add(websocket)

    def disconnect_lobby(self, websocket: WebSocket):
        if websocket in self.lobby_connections:
            self.lobby_connections.discard(websocket)

    async def broadcast_to_lobby(self, message: dict):
        for ws in self.lobby_connections:
            await send_json_safe(ws, message)

    # Timeout
    def start_room_timeout(self, room_id: str, timeout_seconds: int, on_timeout: Callable):
        if room_id in self.room_timeouts:
            return  # timeout đã tồn tại

        async def timeout_task():
            await asyncio.sleep(timeout_seconds)
            if self.room_states.get(room_id) == GAME_STATUS.WAITING:
                await on_timeout()

        task = asyncio.create_task(timeout_task())
        self.room_timeouts[room_id] = task

    def clear_room_timeout(self, room_id: str):
        task = self.room_timeouts.get(room_id)
        if task:
            task.cancel()
            del self.room_timeouts[room_id]

    def set_room_state(self, room_id: str, state: GAME_STATUS):
        self.room_states[room_id] = state

    def get_room_state(self, room_id: str) -> str:
        return self.room_states.get(room_id, GAME_STATUS.WAITING)
