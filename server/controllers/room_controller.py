from fastapi import HTTPException, Response
from enums.game_status import GAME_STATUS
from enums.player_status import PLAYER_STATUS
from models.room import Room
from models.player import Player
from models.answer import Answer
from models.update_settings import GameSettings
from models.create_room_request import CreateRoomRequest
from models.join_request import JoinRoomRequest
from services.room_service import RoomService
from services.player_service import PlayerService
from services.websocket_manager import WebSocketManager
from services.game_service import GameService

class RoomController:
    def __init__(
        self,
        room_service: RoomService,
        game_service: GameService,
        player_service: PlayerService,
        websocket_manager: WebSocketManager
    ):
        self.room_service = room_service
        self.game_service = game_service
        self.player_service = player_service
        self.websocket_manager = websocket_manager

    async def get_rooms(self, status: str = None):
        return await self.room_service.get_rooms(status)

    async def get_room_by_id(self, room_id: str) -> Room | None:
        room = await self.room_service.get_room(room_id)
        
        if room:
            print(f"[DEBUG] Room fields: total_questions={getattr(room, 'total_questions', 'NOT_FOUND')}, totalQuestions={getattr(room, 'totalQuestions', 'NOT_FOUND')}")
        return room

    async def get_room_by_code(self, room_code: str) -> Room | None:
        room = await self.room_service.get_room_by_code(room_code)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room

    async def create_room(self, request: CreateRoomRequest):
        try:
            existing_players = await self.player_service.get_player_by_wallet_id(request.wallet_id)
            for p in existing_players:
                room_id = p.room_id
                current_room = await self.room_service.get_room(room_id)
                if not current_room or current_room.status == GAME_STATUS.FINISHED:
                    break
                
                if p.player_status not in [PLAYER_STATUS.QUIT, PLAYER_STATUS.FINISHED]:
                    raise HTTPException(status_code=400, detail=f"Player is already in an active room {p.room_id}")

            player = Player(
                wallet_id=request.wallet_id,
                username=request.username,
                room_id="",
                player_status=PLAYER_STATUS.ACTIVE,
                is_host=True,
                is_ready=True
            )

            room = Room.create(
                players=[player],
                total_questions=request.total_questions,
                countdown_duration=request.countdown_duration
            )
            player.room_id = room.id

            await self.room_service.save_room(room)
            self.websocket_manager.set_room_state(room.id, room.status)
            await self.websocket_manager.broadcast_to_lobby({ "type": "room_update" })

            return room
        except Exception as e:
            print("Error in create_room:", e)
            raise HTTPException(status_code=500, detail="Internal server error")

    async def join_room(self, request: JoinRoomRequest):
        room = None
        if request.room_code:
            room = await self.room_service.get_room_by_code(request.room_code)
        elif request.room_id:
            room = await self.room_service.get_room(request.room_id)

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if len(room.players) >= 4:
            raise HTTPException(status_code=400, detail="Room is full")
        if room.status != GAME_STATUS.WAITING:
            raise HTTPException(status_code=400, detail="Game is not available")

        existing_player = next((p for p in room.players if p.wallet_id == request.wallet_id), None)

        if existing_player:
            player = existing_player
        else:
            player = Player(
                wallet_id=request.wallet_id,
                username=request.username,
                room_id=room.id,
            )
            room.players.append(player)
            await self.room_service.save_room(room)

            await self.websocket_manager.broadcast_to_room(room.id, {
                "type": "player_joined",
                "payload": {
                    "player": player
                }
            })

        if len(room.players) < 2:
            self.websocket_manager.start_room_timeout(room.id, 30, self.make_timeout_callback(room.id))
        else:
            self.websocket_manager.clear_room_timeout(room.id)

        return { "roomId": room.id, "walletId": player.wallet_id }

    async def leave_room(self, wallet_id: str, room_id: str):
        result = await self.player_service.leave_room(wallet_id, room_id)

        is_closed = result.get("closed", False)
        player_data = result.get("data")

        if is_closed:
            self.websocket_manager.disconnect_room_by_room_id(room_id)

        if not player_data:
            return result

        ws = await self.websocket_manager.get_player_socket_by_wallet(wallet_id)
        if ws:
            self.websocket_manager.disconnect_room(ws, room_id, wallet_id)

        await self.websocket_manager.broadcast_to_lobby({
            "type": "room_update",
            "action": "leave",
            "roomId": room_id
        })

        await self.websocket_manager.broadcast_to_room(room_id, {
            "type": "player_left",
            "action": "leave",
            "payload": {
                "walletId": player_data.wallet_id,
                "username": player_data.username
            }
        })

        return result

    async def get_current_room(self, wallet_id: str):
        players = await self.player_service.get_player_by_wallet_id(wallet_id)
        if not players or all(p.player_status in [PLAYER_STATUS.QUIT, PLAYER_STATUS.FINISHED] for p in players):
            return Response(status_code=404, content="Not found")

        active_player = next((p for p in players if p.player_status not in [PLAYER_STATUS.QUIT, PLAYER_STATUS.FINISHED]), None)
        if not active_player:
            return Response(status_code=404, content="No active room found")

        room = await self.room_service.get_room(active_player.room_id)
        if not room or room.status == GAME_STATUS.FINISHED:
            return Response(status_code=404, content="No active room found")

        return {
            "roomId": active_player.room_id,
            "walletId": active_player.wallet_id,
        }

    async def get_room_status(self, room_id: str):
        room = await self.room_service.get_room(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        return {
            "status": room.status,
            "players": [
                {"walletId": p.wallet_id, "username": p.username, "score": p.score}
                for p in room.players
            ],
            "currentQuestion": (
                room.current_question if room.status == GAME_STATUS.IN_PROGRESS else None
            ),
        }

    async def get_room_result(self, room_id: str):
        room = await self.room_service.get_room(room_id)
        if not room:
            raise HTTPException(status_code=400, detail="Room is not available")
        
        # Tính toán kết quả từ players hiện tại
        results = []
        winner_wallet = None
        max_score = 0
        
        for p in room.players:
            player_score = p.score  # Sử dụng score từ player object
            results.append({
                "wallet": p.wallet_id,
                "oath": p.username,
                "score": player_score
            })
            
            # Tìm winner (player có điểm cao nhất)
            if player_score > max_score:
                max_score = player_score
                winner_wallet = p.wallet_id
        
        # Nếu có winner_wallet_id từ room, sử dụng nó
        if room.winner_wallet_id:
            winner_wallet = room.winner_wallet_id

        return {
            "results": results,
            "winner_wallet": winner_wallet
        }

    async def get_room_settings(self, room_id: str) -> GameSettings | None:
        return await self.room_service.get_room_settings(room_id)

    async def update_room_settings(self, room_id: str, settings: GameSettings) -> dict:
        is_updated = await self.room_service.update_game_settings(room_id, settings)
        await self.websocket_manager.broadcast_to_room(room_id, {
            "type": "room_config_update",
            "payload": settings
        })
        return { "success": is_updated }

    def make_timeout_callback(self, room_id: str):
        async def on_timeout():
            if self.websocket_manager.get_room_state(room_id) == GAME_STATUS.WAITING:
                await self.websocket_manager.broadcast_to_room(room_id, {
                    "type": "room_closed",
                    "reason": "timeout"
                })
                self.websocket_manager.disconnect_room_by_room_id(room_id)
                print(f"[ROOM_TIMEOUT] Room {room_id} closed due to inactivity.")
        return on_timeout
