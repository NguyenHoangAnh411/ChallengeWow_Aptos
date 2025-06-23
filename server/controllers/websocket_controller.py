import time

from fastapi import WebSocket, WebSocketDisconnect
from helpers.json_helper import send_json_safe
from models.answer import Answer
from models.chat_payload import ChatPayload
from models.kick_player import KickPayload
from services.answer_service import AnswerService
from services.player_service import PlayerService
from services.room_service import RoomService
from services.websocket_manager import WebSocketManager
from pydantic import ValidationError
import random
from enums.game_status import GAME_STATUS
import asyncio
import pprint


class WebSocketController:
    def __init__(self, manager: WebSocketManager, player_service: PlayerService, room_service: RoomService, question_service, answer_service: AnswerService):
        self.manager = manager
        self.player_service = player_service
        self.room_service = room_service
        self.question_service = question_service
        self.answer_service = answer_service

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
            return
        
        host_wallet_id = self.room_service.get_host_room_wallet(room_id)
        
        if not host_wallet_id or host_wallet_id != wallet_id:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Only the host can kick players."
            })
            return

        kicked_ws = await self.manager.get_player_socket_by_wallet(payload.wallet_id)
        if wallet_id == payload.wallet_id:
            await send_json_safe(websocket, {
                "type": "error",
                "payload": {"message": "You cannot kick yourself"}
            })
            return


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
            await send_json_safe(websocket, {
                "type": "error", 
                "payload": {"message": "Failed to kick player"}
            })
            return

    async def _handle_chat(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = ChatPayload(**data.get("payload", {}))
        except ValidationError as e:
            return

        await self.manager.broadcast_to_room(room_id, {
            "type": "chat",
            "payload": {
                "sender": payload.sender,
                "message": payload.message
            }
        })

    async def _handle_start_game(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        # Kiểm tra host
        host_wallet_id = self.room_service.get_host_room_wallet(room_id)
        if wallet_id != host_wallet_id:
            await send_json_safe(websocket, {"type": "error", "message": "Only host can start the game."})
            return

        # Lấy câu hỏi (TODO: Chỉnh số lượng nếu cần)
        easy = self.question_service.get_random_questions_by_difficulty('easy', 1)
        medium = self.question_service.get_random_questions_by_difficulty('medium', 1)
        hard = self.question_service.get_random_questions_by_difficulty('hard', 1)
        questions = [*easy, *medium, *hard]
        random.shuffle(questions)

        print(f"[DEBUG] Questions selected for room {room_id}:")
        for q in questions:
            pprint.pprint(q.dict() if hasattr(q, 'dict') else dict(q))

        # Cập nhật trạng thái room
        room = self.room_service.get_room(room_id)
        room.current_questions = questions
        room.status = GAME_STATUS.IN_PROGRESS
        room.current_index = 0
        self.room_service.save_room(room)

        # Clear timeout nếu có
        self.manager.clear_room_timeout(room_id)

        # Gửi sự kiện bắt đầu game
        start_at = int(time.time() * 1000) + 2000  # delay 2s
        await self.manager.broadcast_to_room(room_id, {
            "type": "game_started",
            "questions": [q.dict(exclude={'correct_answer'}) for q in questions],
            "startAt": start_at
        })

        # Gửi câu hỏi đầu tiên
        async def send_first_question():
            await asyncio.sleep(2)
            question_duration = 5  # Giây
            question_end_at = int(time.time() * 1000) + question_duration * 1000

            print(f"[NEXT_QUESTION] Sent question {questions[0].id} to room {room_id} with end at {question_end_at}")
            await self.manager.broadcast_to_room(room_id, {
                "type": "next_question",
                "question": questions[0].dict(exclude={'correct_answer'}),
                "questionEndAt": question_end_at
            })

            # Auto chuyển câu hỏi
            async def auto_next():
                await asyncio.sleep(question_duration)
                r = self.room_service.get_room(room_id)
                if not r or not getattr(r, 'current_questions', None):
                    print(f"[AUTO_NEXT] Room {room_id} has no questions, ending game.")
                    results = [
                        {
                            "wallet": p.wallet_id,
                            "oath": p.username,
                            "score": sum(a.get('score', 0) for a in p.answers or [])
                        }
                        for p in r.players
                    ] if r else []
                    if r:
                        r.status = GAME_STATUS.FINISHED
                        self.room_service.save_room(r)
                    await self.manager.broadcast_to_room(room_id, {
                        "type": "game_ended",
                        "results": results
                    })
                    await self.manager.broadcast_to_room(room_id, {
                        "type": "clear_local_storage"
                    })
                    return

                qid = questions[0].id
                not_answered = [
                    p for p in r.players
                    if not p.answers or not any(a.get("question_id") == qid for a in p.answers)
                ]

                if not_answered:
                    print(f"[AUTO_NEXT] Forcing next question for room {room_id}")
                    await self._handle_submit_answer(None, room_id, None, {"forceNext": True})

            asyncio.create_task(auto_next())

        asyncio.create_task(send_first_question())

    async def _handle_submit_answer(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        answer = data.get('answer')
        response_time = data.get('responseTime', 0)
        room = self.room_service.get_room(room_id)

        if not room or not getattr(room, 'current_questions', None):
            print(f"[ERROR] Room {room_id} has no questions when handling submit_answer. Ending game.")
            results = [
                {
                    "wallet": p.wallet_id,
                    "oath": p.username,
                    "score": sum(a.get('score', 0) if isinstance(a, dict) else a.score for a in p.answers or [])
                }
                for p in room.players
            ] if room else []

            if room:
                room.status = GAME_STATUS.FINISHED
                self.room_service.save_room(room)

            await self.manager.broadcast_to_room(room_id, {
                "type": "game_ended",
                "results": results
            })
            await self.manager.broadcast_to_room(room_id, {
                "type": "clear_local_storage"
            })
            return

        current_index = getattr(room, 'current_index', 0)
        if current_index >= len(room.current_questions):
            await send_json_safe(websocket, {"type": "error", "message": "No more questions."})
            return

        question = room.current_questions[current_index]

        # Tìm player và xử lý câu trả lời
        for player in room.players:
            if player.wallet_id == wallet_id:
                if not hasattr(player, 'answers') or player.answers is None:
                    player.answers = []

                # Kiểm tra đã trả lời chưa
                already_answered = any(
                    (a.get("question_id") if isinstance(a, dict) else a.question_id) == question.id
                    for a in player.answers
                )
                if already_answered:
                    return

                is_correct = answer == question.correct_answer
                score = 10 if is_correct else 0
                player_answer = Answer(
                    room_id=room_id,
                    wallet_id=wallet_id,
                    is_correct=is_correct,
                    question_id=question.id,
                    answer=answer,
                    score=score,
                    response_time=response_time
                )
                player.answers.append(player_answer)
                self.answer_service.save_player_answer(player_answer)

        # Kiểm tra tất cả player đã trả lời chưa
        all_answered = all(
            hasattr(p, 'answers') and any(
                (a.get("question_id") if isinstance(a, dict) else a.question_id) == question.id
                for a in p.answers
            )
            for p in room.players
        )

        if all_answered or data.get('forceNext'):
            if not hasattr(room, 'current_index'):
                room.current_index = 0
            room.current_index += 1

            if room.current_index < len(room.current_questions):
                next_q = room.current_questions[room.current_index]
                question_duration = 15
                question_end_at = int(time.time() * 1000) + question_duration * 1000
                print(f"[NEXT_QUESTION] Sent question {next_q.id} to room {room_id} with end at {question_end_at}")
                await self.manager.broadcast_to_room(room_id, {
                    "type": "next_question",
                    "question": next_q.dict(exclude={'correct_answer'}),
                    "questionEndAt": question_end_at
                })

                async def auto_next():
                    await asyncio.sleep(question_duration)
                    r = self.room_service.get_room(room_id)
                    qid = next_q.id
                    not_answered = [
                        p for p in r.players
                        if not hasattr(p, 'answers') or not any(
                            (a.get("question_id") if isinstance(a, dict) else a.question_id) == qid
                            for a in p.answers
                        )
                    ]
                    if not_answered:
                        print(f"[AUTO_NEXT] Forcing next question for room {room_id}")
                        await self._handle_submit_answer(None, room_id, None, {"forceNext": True})

                asyncio.create_task(auto_next())
            else:
                # Kết thúc game
                results = []
                for p in room.players:
                    answers = self.answer_service.get_answers_by_wallet_id(p.wallet_id, room_id)
                    score = sum(a.score for a in answers)
                    results.append({
                        "wallet": p.wallet_id,
                        "oath": p.username,
                        "score": score
                    })
                room.status = GAME_STATUS.FINISHED
                self.room_service.save_room(room)
                print(f"[GAME_ENDED] Room {room_id} finished. Results: {results}")
                await self.manager.broadcast_to_room(room_id, {
                    "type": "game_ended",
                    "results": results
                })
                await self.manager.broadcast_to_room(room_id, {
                    "type": "clear_local_storage"
                })

        self.room_service.save_room(room)

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
                except WebSocketDisconnect:
                    print("❌ [LOBBY] WebSocket disconnected.")
                    break
                except Exception as e:
                    print(f"⚠️ [LOBBY] Failed to parse JSON: {e}")
                    continue

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

        except Exception as e:
            print(f"🔥 [LOBBY] Unexpected error: {e}")
        finally:
            self.manager.disconnect_lobby(websocket)

    # ---------- ROOM SOCKET ----------

    async def handle_room_socket(self, websocket: WebSocket, room_id: str, wallet_id: str):
        await self.manager.connect_room(websocket, room_id, wallet_id)

        # Gửi lại câu hỏi hiện tại nếu phòng đang IN_PROGRESS
        room = self.room_service.get_room(room_id)
        if room and getattr(room, 'current_questions', None) and room.status == GAME_STATUS.IN_PROGRESS:
            current_index = getattr(room, 'current_index', 0)
            if 0 <= current_index < len(room.current_questions):
                import time
                question = room.current_questions[current_index]
                question_duration = 15
                # Ưu tiên lấy questionEndAt từ localStorage phía client nếu có, nếu không thì gửi thời gian mới
                question_end_at = int(time.time() * 1000) + question_duration * 1000
                await send_json_safe(websocket, {
                    "type": "next_question",
                    "question": question.dict(exclude={'correct_answer'}),
                    "questionEndAt": question_end_at
                })

        room_handlers = {
            "chat": self._handle_chat,
            "kick_player": self._handle_kick_player,
            "start_game": self._handle_start_game,
            "submit_answer": self._handle_submit_answer,
        }

        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except Exception as e:
                    break

                if not isinstance(data, dict):
                    continue

                msg_type = data.get("type")

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
