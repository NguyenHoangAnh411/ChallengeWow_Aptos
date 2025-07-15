import asyncio
from fastapi import WebSocket
from collections import defaultdict
from typing import Dict, Set, Optional, Callable, List

from enums.game_status import GAME_STATUS
from helpers.json_helper import send_json_safe

class WebSocketManager:
    """
    Quản lý tập trung các kết nối WebSocket cho toàn bộ ứng dụng.
    - Hỗ trợ nhiều phòng và một sảnh chờ (lobby).
    - Hỗ trợ một người chơi có thể có nhiều kết nối (ví dụ: nhiều tab).
    - Có cơ chế timeout cho các phòng chờ.
    """
    def __init__(self):
        # {room_id: {websocket1, websocket2, ...}}
        # Lưu tất cả các kết nối đang hoạt động theo từng phòng.
        self.room_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # {wallet_id: {websocket1, websocket2, ...}}
        # Cho phép tìm tất cả kết nối của một người chơi. Cực kỳ hữu ích.
        self.player_connections: Dict[str, Set[WebSocket]] = defaultdict(set)

        # {websocket: wallet_id}
        # Cho phép tìm nhanh wallet_id từ một websocket object (quan trọng khi disconnect).
        self.socket_to_wallet: Dict[WebSocket, str] = {}
        
        # Quản lý các kết nối ở sảnh chờ chung
        self.lobby_connections: Set[WebSocket] = set()
        
        # Quản lý trạng thái và timeout của phòng (tùy chọn, có thể di chuyển ra service riêng)
        self.room_states: Dict[str, str] = {}
        self.room_timeouts: Dict[str, asyncio.Task] = {}

    # ==================================
    # Quản lý Kết nối Phòng Chơi
    # ==================================
    
    async def connect_room(self, websocket: WebSocket, room_id: str, wallet_id: str):
        """Chấp nhận và đăng ký một kết nối mới vào một phòng."""
        await websocket.accept()
        self.room_connections[room_id].add(websocket)
        self.player_connections[wallet_id].add(websocket)
        self.socket_to_wallet[websocket] = wallet_id
        print(f"CONNECT: Player {wallet_id} connected. Total for player: {len(self.player_connections[wallet_id])}. Total in room {room_id}: {len(self.room_connections[room_id])}.")

    def disconnect_room(self, websocket: WebSocket, room_id: str):
        """Xóa một kết nối cụ thể khỏi phòng và khỏi người chơi tương ứng."""
        wallet_id = self.socket_to_wallet.pop(websocket, None)

        # Xóa khỏi danh sách kết nối của phòng
        if room_id in self.room_connections:
            self.room_connections[room_id].discard(websocket)
            if not self.room_connections[room_id]:
                del self.room_connections[room_id] # Dọn dẹp nếu phòng trống

        # Xóa khỏi danh sách kết nối của người chơi
        if wallet_id and wallet_id in self.player_connections:
            self.player_connections[wallet_id].discard(websocket)
            if not self.player_connections[wallet_id]:
                del self.player_connections[wallet_id] # Dọn dẹp nếu người chơi không còn kết nối nào

        if wallet_id:
             print(f"DISCONNECT: Player {wallet_id} disconnected. Remaining for player: {len(self.player_connections.get(wallet_id, set()))}.")

    def disconnect_room_by_room_id(self, room_id: str):
        """Đóng tất cả kết nối và dọn dẹp một phòng."""
        sockets_in_room = self.room_connections.pop(room_id, set())
        if not sockets_in_room:
            return

        print(f"CLEANUP: Closing all {len(sockets_in_room)} connections for room {room_id}.")
        for ws in sockets_in_room:
            # Chủ động đóng kết nối
            asyncio.create_task(ws.close(1000, "Room is being closed"))
            # Dọn dẹp các map liên quan
            self.disconnect_room(ws, room_id)
        
        # Dọn dẹp trạng thái và timeout
        self.clear_room_timeout(room_id)
        self.room_states.pop(room_id, None)

    async def get_player_socket(self, wallet_id: str) -> Optional[WebSocket]:
        """Lấy MỘT kết nối đang hoạt động của người chơi (ví dụ: cái mới nhất)."""
        connections = self.player_connections.get(wallet_id)
        if connections:
            return next(iter(connections), None) # Trả về một phần tử bất kỳ từ set
        return None

    def get_connections_in_room(self, room_id: str) -> List[WebSocket]:
        """Lấy danh sách tất cả kết nối trong một phòng."""
        return list(self.room_connections.get(room_id, []))

    async def broadcast_to_room(self, room_id: str, message: dict):
        """Gửi một thông điệp tới tất cả các kết nối trong một phòng."""
        # Sao chép set thành list để tránh lỗi khi kích thước thay đổi trong lúc lặp
        connections_to_send = self.get_connections_in_room(room_id)
        
        if connections_to_send:
            print(f"[BROADCAST] Sending to {len(connections_to_send)} connection(s) in room {room_id}.")
            tasks = [send_json_safe(conn, message) for conn in connections_to_send]
            # Sử dụng gather để gửi song song và xử lý lỗi
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result, conn in zip(results, connections_to_send):
                if isinstance(result, Exception):
                    print(f"  - Failed to send message to a client, it might be disconnected: {result}")
                    # Nếu gửi thất bại, có thể đây là một kết nối chết cần được dọn dẹp
                    self.disconnect_room(conn, room_id)

    # ==================================
    # Quản lý Sảnh Chờ (Lobby)
    # ==================================
    
    async def connect_lobby(self, websocket: WebSocket):
        await websocket.accept()
        self.lobby_connections.add(websocket)

    def disconnect_lobby(self, websocket: WebSocket):
        self.lobby_connections.discard(websocket)

    async def broadcast_to_lobby(self, message: dict):
        connections_to_send = list(self.lobby_connections)
        if connections_to_send:
            tasks = [send_json_safe(ws, message) for ws in connections_to_send]
            await asyncio.gather(*tasks, return_exceptions=True)

    # ==================================
    # Quản lý Trạng Thái & Timeout (tùy chọn)
    # ==================================
    
    def start_room_timeout(self, room_id: str, timeout_seconds: int, on_timeout: Callable[[], asyncio.Future]):
        if room_id in self.room_timeouts:
            return

        async def timeout_task():
            await asyncio.sleep(timeout_seconds)
            # Chỉ chạy callback nếu phòng vẫn đang ở trạng thái chờ
            if self.get_room_state(room_id) == GAME_STATUS.WAITING.value:
                print(f"Room {room_id} timed out.")
                await on_timeout()

        task = asyncio.create_task(timeout_task())
        self.room_timeouts[room_id] = task

    def clear_room_timeout(self, room_id: str):
        if room_id in self.room_timeouts:
            self.room_timeouts.pop(room_id).cancel()

    def set_room_state(self, room_id: str, state: str):
        self.room_states[room_id] = state

    def get_room_state(self, room_id: str) -> str:
        return self.room_states.get(room_id, GAME_STATUS.WAITING.value)