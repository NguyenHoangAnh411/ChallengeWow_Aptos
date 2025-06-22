from fastapi import WebSocket, WebSocketDisconnect
from helpers.json_helper import send_json_safe
from models.chat_payload import ChatPayload
from models.kick_player import KickPayload
from services.player_service import PlayerService
from services.room_service import RoomService
from services.websocket_manager import WebSocketManager
from pydantic import ValidationError


class WebSocketController:
    def __init__(self, manager: WebSocketManager, player_service: PlayerService, room_service: RoomService):
        self.manager = manager
        self.player_service = player_service
        self.room_service = room_service

    # ---------- LOBBY HANDLERS ----------

    async def _handle_ping(self, websocket: WebSocket, data: dict):
        await send_json_safe(websocket, {"type": "pong"})
        print("🏓 [LOBBY] Pong sent.")

    async def _handle_broadcast(self, websocket: WebSocket, data: dict):
        await self.manager.broadcast_to_lobby(data)
        print("📢 [LOBBY] Broadcasted message.")

    # ---------- ROOM HANDLERS ----------

    async def _handle_kick_player(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = KickPayload(**data.get("payload", {}))
        except ValidationError as e:
            print(f"⚠️ [ROOM {room_id}] Invalid kick_player payload: {e}")
            return
        
        host_wallet_id = self.room_service.get_host_room_wallet(room_id)
        if not host_wallet_id or host_wallet_id != wallet_id:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Only the host can kick players."
            })
            return

        kicked_ws = await self.manager.get_player_socket_by_wallet(payload.wallet_id)
        if wallet_id == payload.wallet_id and kicked_ws:
            await send_json_safe(websocket, {
                "type": "error",
                "payload": {"message": "You cannot kick yourself"}
            })
            return
        
        print(f"👢 [ROOM {room_id}] Kicking {payload.wallet_id} by {wallet_id}")

        try:
            result = self.player_service.leave_room(payload.wallet_id, payload.room_id)
            # Notify the kicked user
            if kicked_ws:
                await send_json_safe(kicked_ws, {
                    "type": "kicked",
                    "payload": {
                        "reason": "You were kicked from the room",
                        "roomId": payload.room_id
                    }
                })

            # Notify the rest of the room
            username = getattr(result["data"], "username", "user") or "Unknown"
            await self.manager.broadcast_to_room(payload.room_id, {
                "type": "player_left",
                "action": "kick",
                "payload": {
                    "walletId": payload.wallet_id,
                    "username": username
                }
            })
        except Exception as e:
            print(f"❌ [ROOM {room_id}] Error kicking player: {e}")
            await send_json_safe(websocket, {
                "type": "error", 
                "payload": {"message": "Failed to kick player"}
            })
            return

    async def _handle_chat(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = ChatPayload(**data.get("payload", {}))
        except ValidationError as e:
            print(f"⚠️ [ROOM {room_id}] Invalid chat payload: {e}")
            return

        await self.manager.broadcast_to_room(room_id, {
            "type": "chat",
            "payload": {
                "sender": payload.sender,
                "message": payload.message
            }
        })

    # ---------- LOBBY SOCKET ----------

    async def handle_lobby_socket(self, websocket: WebSocket):
        print("🔌 [LOBBY] Accepting WebSocket connection...")
        await self.manager.connect_lobby(websocket)
        print("✅ [LOBBY] Connection established.")

        lobby_handlers = {
            "ping": self._handle_ping,
            "broadcast": self._handle_broadcast,
        }

        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except Exception as e:
                    print(f"⚠️ [LOBBY] Failed to parse JSON: {e}")
                    break

                if not isinstance(data, dict):
                    print(f"⚠️ [LOBBY] Invalid message format (not dict): {data}")
                    continue

                msg_type = data.get("type")
                print(f"📩 [LOBBY] Received: {msg_type} - {data}")

                handler = lobby_handlers.get(msg_type)
                if handler:
                    await handler(websocket, data)
                else:
                    print(f"⚠️ [LOBBY] Unknown message type: {msg_type}")

        except WebSocketDisconnect:
            print("❌ [LOBBY] WebSocket disconnected.")
        except Exception as e:
            print(f"🔥 [LOBBY] Unexpected error: {e}")
        finally:
            self.manager.disconnect_lobby(websocket)

    # ---------- ROOM SOCKET ----------

    async def handle_room_socket(self, websocket: WebSocket, room_id: str, wallet_id: str):
        print(f"🔌 [ROOM] Connecting to room {room_id}...")
        await self.manager.connect_room(websocket, room_id, wallet_id)
        print(f"✅ [ROOM] Connected to room {room_id}")

        room_handlers = {
            "chat": self._handle_chat,
            "kick_player": self._handle_kick_player,
        }

        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except Exception as e:
                    print(f"⚠️ [ROOM {room_id}] Failed to parse JSON: {e}")
                    break

                if not isinstance(data, dict):
                    print(f"⚠️ [ROOM {room_id}] Invalid message format: {data}")
                    continue

                msg_type = data.get("type")
                print(f"📩 [ROOM {room_id}] Received: {msg_type} - {data}")

                handler = room_handlers.get(msg_type)
                if handler:
                    await handler(websocket, room_id, wallet_id, data)
                else:
                    print(f"⚠️ [ROOM {room_id}] Unknown message type: {msg_type}")

        except WebSocketDisconnect:
            print(f"❌ [ROOM {room_id}] WebSocket disconnected.")
        except Exception as e:
            print(f"🔥 [ROOM {room_id}] Unexpected error: {e}")
        finally:
            self.manager.disconnect_room(websocket, room_id, wallet_id)
