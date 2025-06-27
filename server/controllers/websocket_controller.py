from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from config.question_config import QUESTION_CONFIG
from enums.player_status import PLAYER_STATUS
from enums.question_difficulty import QUESTION_DIFFICULTY
from helpers.json_helper import send_json_safe
from models.answer import Answer
from models.chat_payload import ChatPayload
from models.kick_player import KickPayload
from models.player import Player
from models.room import Room
from services.answer_service import AnswerService
from services.player_service import PlayerService
from services.question_service import QuestionService
from services.room_service import RoomService
from services.websocket_manager import WebSocketManager
from pydantic import ValidationError
from enums.game_status import GAME_STATUS
from repositories.implement.user_repo_impl import UserRepository, UserStatsRepository
import random, asyncio, pprint, time

class WebSocketController:
    def __init__(self, manager: WebSocketManager, player_service: PlayerService, room_service: RoomService,
                 question_service: QuestionService, answer_service: AnswerService, user_repo: UserRepository, user_stats_repo: UserStatsRepository):
        self.manager = manager
        self.player_service = player_service
        self.room_service = room_service
        self.question_service = question_service
        self.answer_service = answer_service
        self.user_repo = user_repo
        self.user_stats_repo = user_stats_repo
        # Thêm tracking cho active tasks
        self.active_tasks = {}

    async def _handle_kick_player(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = KickPayload(**data.get("payload", {}))
        except ValidationError:
            return

        host_wallet_id = await self.room_service.get_host_room_wallet(room_id)
        if not host_wallet_id or host_wallet_id != wallet_id:
            await send_json_safe(websocket, {"type": "error", "message": "Only the host can kick players."})
            return

        kicked_ws = await self.manager.get_player_socket_by_wallet(payload.wallet_id)
        if wallet_id == payload.wallet_id:
            await send_json_safe(websocket, {"type": "error", "payload": {"message": "You cannot kick yourself"}})
            return

        result = await self.player_service.leave_room(payload.wallet_id, payload.room_id)

        if kicked_ws:
            await send_json_safe(kicked_ws, {
                "type": "kicked",
                "payload": {"reason": "You were kicked from the room", "roomId": payload.room_id}
            })

        kicked_player: Player = result["data"]
        username = getattr(kicked_player, "username", "Unknown")
        await self.manager.broadcast_to_room(payload.room_id, {
            "type": "player_left",
            "action": "kick",
            "payload": {"walletId": payload.wallet_id, "username": username}
        })

    async def _handle_chat(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = ChatPayload(**data.get("payload", {}))
        except ValidationError:
            return

        await self.manager.broadcast_to_room(room_id, {
            "type": "chat",
            "payload": {"sender": payload.sender, "message": payload.message}
        })

    async def _handle_ping(self, websocket: WebSocket, data: dict):
        await send_json_safe(websocket, {"type": "pong"})

    async def _handle_broadcast(self, websocket: WebSocket, data: dict):
        await self.manager.broadcast_to_lobby(data)

    # ✅ Helper function để chuyển sang câu hỏi tiếp theo
    async def _move_to_next_question(self, room_id: str):
        """Chuyển sang câu hỏi tiếp theo"""
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            return

        # Tăng index và lưu
        room.current_index += 1
        
        # Kiểm tra xem còn câu hỏi không
        if room.current_index >= len(room.current_questions):
            # Game kết thúc
            await self._handle_game_end(room_id)
            return
        
        # Không cần set current_question vì nó là property tự động tính toán
        await self.room_service.save_room(room)

        # Gửi câu hỏi tiếp theo
        await self._send_current_question(room_id)

    # ✅ Handle game end - kết thúc game và tính toán kết quả
    async def _handle_game_end(self, room_id: str):
        """Xử lý khi game kết thúc"""
        room = await self.room_service.get_room(room_id)
        if not room:
            return

        # Cập nhật trạng thái room
        room.status = GAME_STATUS.FINISHED
        game_end_time = datetime.now(timezone.utc)
        room.ended_at = game_end_time
        
        # Sắp xếp players theo điểm số (leaderboard)
        sorted_players = sorted(room.players, key=lambda x: x.score, reverse=True)
        
        # Tính toán thống kê game
        total_players = len(room.players)
        total_questions = room.total_questions
        
        # Chuẩn bị leaderboard với ranking
        leaderboard = []
        for idx, player in enumerate(sorted_players):
            # Tính accuracy (cần implement logic lưu correct answers per player)
            # Tạm thời giả sử có method để lấy player stats
            player_stats = {
                "rank": idx + 1,
                "walletId": player.wallet_id,
                "username": player.username,
                "avatar": getattr(player, 'avatar', None),
                "score": player.score,
                "correctAnswers": 0,  # TODO: Implement tracking correct answers
                "totalAnswers": total_questions,
                "accuracy": 0.0,  # TODO: Calculate from correct/total ratio
                "averageTime": 0.0,  # TODO: Calculate average response time
                "isWinner": idx == 0,  # First place is winner
                "reward": 0  # TODO: Calculate based on ranking and room settings
            }
            leaderboard.append(player_stats)

        # Tính toán game statistics
        game_stats = {
            "totalPlayers": total_players,
            "totalQuestions": total_questions,
            "gameMode": getattr(room, 'game_mode', 'standard'),
            "gameDuration": (game_end_time - room.started_at).total_seconds(),
            "averageScore": sum(p.score for p in room.players) / total_players if total_players > 0 else 0,
            "highestScore": sorted_players[0].score if sorted_players else 0,
            "questionBreakdown": {
                "easy": room.easy_questions,
                "medium": room.medium_questions,
                "hard": room.hard_questions
            }
        }

        # Update player statistics in database
        await self._update_player_statistics(room, leaderboard)
        
        # Save updated room
        await self.room_service.save_room(room)

        # Broadcast game end to all players
        await self.manager.broadcast_to_room(room_id, {
            "type": "game_ended",
            "payload": {
                "gameStats": game_stats,
                "leaderboard": leaderboard,
                "winner": leaderboard[0] if leaderboard else None,
                "endedAt": int(game_end_time.timestamp() * 1000),
                "roomId": room_id
            }
        })

        # Schedule room cleanup after some time
        async def cleanup_room():
            await asyncio.sleep(300)  # Wait 5 minutes before cleanup
            await self._cleanup_finished_room(room_id)
        
        asyncio.create_task(cleanup_room())

    # ✅ Update player statistics after game
    async def _update_player_statistics(self, room: Room, leaderboard: list):
        """Cập nhật thống kê của players sau game"""
        try:
            for player_result in leaderboard:
                wallet_id = player_result["walletId"]
                
                # Get current user stats
                user_stats = await self.user_stats_repo.get_user_stats(wallet_id)
                if not user_stats:
                    # Create new stats if not exists
                    user_stats = {
                        "wallet_id": wallet_id,
                        "total_games": 0,
                        "total_wins": 0,
                        "total_score": 0,
                        "total_correct_answers": 0,
                        "total_questions_answered": 0,
                        "average_accuracy": 0.0,
                        "best_score": 0,
                        "current_streak": 0,
                        "best_streak": 0
                    }
                
                # Update stats
                user_stats["total_games"] += 1
                user_stats["total_score"] += player_result["score"]
                user_stats["total_correct_answers"] += player_result["correctAnswers"]
                user_stats["total_questions_answered"] += player_result["totalAnswers"]
                
                if player_result["isWinner"]:
                    user_stats["total_wins"] += 1
                    user_stats["current_streak"] += 1
                    user_stats["best_streak"] = max(user_stats["best_streak"], user_stats["current_streak"])
                else:
                    user_stats["current_streak"] = 0
                
                user_stats["best_score"] = max(user_stats["best_score"], player_result["score"])
                user_stats["average_accuracy"] = user_stats["total_correct_answers"] / user_stats["total_questions_answered"] if user_stats["total_questions_answered"] > 0 else 0.0
                
                # Save updated stats
                await self.user_stats_repo.update_user_stats(wallet_id, user_stats)
                
        except Exception as e:
            print(f"Error updating player statistics: {e}")

    # ✅ Cleanup finished room
    async def _cleanup_finished_room(self, room_id: str):
        """Dọn dẹp room đã kết thúc"""
        try:
            # Disconnect all remaining connections
            await self.manager.disconnect_all_from_room(room_id)
            
            # Optionally remove room from cache/database
            # await self.room_service.delete_room(room_id)
            
        except Exception as e:
            print(f"Error cleaning up room {room_id}: {e}")
    
    async def _handle_start_game(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        # ✅ 1. Chỉ host mới được bắt đầu game
        host_wallet_id = await self.room_service.get_host_room_wallet(room_id)
        if wallet_id != host_wallet_id:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Only host can start the game."
            })
            return

        # ✅ 2. Kiểm tra xem game đã bắt đầu chưa
        room = await self.room_service.get_room(room_id)
        if not room:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Room not found."
            })
            return
            
        if room.status == GAME_STATUS.IN_PROGRESS:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Game is already in progress."
            })
            return

        # ✅ 3. Lấy cấu hình game
        settings = data.get("settings", {})
        questions_config = settings.get("questions", {})

        easy_count = questions_config.get("easy", QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY]["quantity"])
        medium_count = questions_config.get("medium", QUESTION_CONFIG[QUESTION_DIFFICULTY.MEDIUM]["quantity"])
        hard_count = questions_config.get("hard", QUESTION_CONFIG[QUESTION_DIFFICULTY.HARD]["quantity"])

        # ✅ 4. Lấy danh sách câu hỏi và shuffle
        easy_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.EASY, easy_count)
        medium_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.MEDIUM, medium_count)
        hard_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.HARD, hard_count)

        questions = [*easy_qs, *medium_qs, *hard_qs]
        random.shuffle(questions)

        if not questions:
            await send_json_safe(websocket, {"type": "error", "message": "No questions found."})
            return

        # ✅ 5. Chuẩn bị dữ liệu câu hỏi cho client (loại bỏ đáp án đúng)
        def prepare_question_for_client(question):
            """Chuẩn bị câu hỏi để gửi cho client, loại bỏ correct_answer"""
            question_dict = question.dict()
            
            # Tạo danh sách các options đã shuffle
            options = question_dict.get("options", [])
            if options:
                # Shuffle options để tránh predictable pattern
                shuffled_options = options.copy()
                random.shuffle(shuffled_options)
                question_dict["options"] = shuffled_options
            
            # Loại bỏ correct_answer khỏi dữ liệu gửi client
            question_dict.pop("correct_answer", None)
            
            return question_dict

        # ✅ 6. Chuẩn bị danh sách câu hỏi cho client
        client_questions = [prepare_question_for_client(q) for q in questions]

        # ✅ 7. Cập nhật trạng thái phòng
        room.players = [p.model_copy(update={"status": PLAYER_STATUS.ACTIVE}) for p in room.players]
        room.status = GAME_STATUS.IN_PROGRESS
        room.total_questions = len(questions)
        room.current_questions = questions 
        room.easy_questions = easy_count
        room.medium_questions = medium_count
        room.hard_questions = hard_count
        room.current_index = 0
        room.question_configs = QUESTION_CONFIG
        room.started_at = datetime.now(timezone.utc)

        await self.room_service.save_room(room)
        self.manager.clear_room_timeout(room_id)

        # ✅ 8. Gửi sự kiện bắt đầu game với tất cả câu hỏi (không có đáp án)
        start_at = int(time.time() * 1000) + (room.countdown_duration * 1000)
        await self.manager.broadcast_to_room(room_id, {
            "type": "game_started",
            "payload": {
                # "questions": client_questions,
                "totalQuestions": len(questions),
                "easyCount": easy_count,
                "mediumCount": medium_count,
                "hardCount": hard_count,
                "countdownDuration": room.countdown_duration,
                "startAt": start_at,
                "roomSettings": {
                    "easyQuestions": QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY],
                    "mediumQuestions": QUESTION_CONFIG[QUESTION_DIFFICULTY.MEDIUM],
                    "hardQuestions": QUESTION_CONFIG[QUESTION_DIFFICULTY.HARD],
                }
            }
        })

        # ✅ 9. Gửi câu hỏi đầu tiên sau countdown
        async def send_first_question():
            await asyncio.sleep(room.countdown_duration)
            await self._send_current_question(room_id)

        asyncio.create_task(send_first_question())

    # ✅ Helper function để gửi câu hỏi hiện tại
    async def _send_current_question(self, room_id: str):
        """Gửi câu hỏi hiện tại dựa trên room.current_index"""
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            return

        current_question = room.current_question
        if not current_question:
            # Không nên xảy ra vì logic này đã được xử lý trong _move_to_next_question
            print(f"Warning: No current question for room {room_id}")
            return

        # Lấy config cho câu hỏi hiện tại
        question_config = QUESTION_CONFIG.get(current_question.difficulty)
        if not question_config:
            # Fallback config nếu không tìm thấy
            question_config = QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY]

        time_per_question = question_config["time_per_question"]
        question_start_at = int(time.time() * 1000)
        question_end_at = question_start_at + time_per_question * 1000

        # Chuẩn bị câu hỏi cho client (loại bỏ correct_answer)
        client_question = current_question.model_dump(exclude={"correct_answer"})
        options = client_question.get("options", [])
        if options:
            shuffled_options = options.copy()
            random.shuffle(shuffled_options)
            client_question["options"] = shuffled_options
        client_question.pop("correct_answer", None)

        await self.manager.broadcast_to_room(room_id, {
            "type": "next_question",
            "payload": {
                "questionIndex": room.current_index,
                "question": client_question,
                "timing": {
                    "questionStartAt": question_start_at,
                    "questionEndAt": question_end_at,
                    "timePerQuestion": time_per_question,                    
                },
                "config": question_config,
                "progress": {
                    "current": room.current_index + 1,
                    "total": room.total_questions
                }
            }
        })

        # Tự động chuyển sang câu hỏi tiếp theo sau thời gian hết hạn + thời gian hiển thị kết quả
        # Chỉ tạo task nếu chưa có task active cho room này
        if room_id not in self.active_tasks:
            async def auto_next_question():
                try:
                    await asyncio.sleep(time_per_question + 5)  # 5 giây để hiển thị kết quả
                    await self._move_to_next_question(room_id)
                finally:
                    # Xóa task khỏi tracking khi hoàn thành
                    self.active_tasks.pop(room_id, None)

            task = asyncio.create_task(auto_next_question())
            self.active_tasks[room_id] = task

    # ✅ Helper function để xử lý submit answer (IMPROVED)
    async def _handle_submit_answer(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        """Xử lý khi player submit câu trả lời"""
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "Game is not in progress."
            })
            return

        current_question = room.current_question
        if not current_question:
            await send_json_safe(websocket, {
                "type": "error",
                "message": "No current question available."
            })
            return

        # Lấy config cho câu hỏi hiện tại
        question_config = QUESTION_CONFIG.get(current_question.difficulty)
        if not question_config:
            question_config = QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY]

        player_answer = data.get("answer")
        submit_time = int(time.time() * 1000)
        question_start_at = data.get("questionStartAt", submit_time)

        # Kiểm tra đáp án đúng (sử dụng correct_answer từ server)
        is_correct = player_answer == current_question.correct_answer
        
        # Tính điểm dựa trên config và thời gian trả lời
        points = 0
        speed_bonus = 0
        if is_correct:
            base_score = question_config["score"]
            points = base_score
            
            # Tính speed bonus nếu được bật
            if question_config["speed_bonus_enabled"]:
                time_taken = (submit_time - question_start_at) / 1000
                time_per_question = question_config["time_per_question"]
                
                # Tính tỷ lệ thời gian còn lại
                time_remaining_ratio = max(0, (time_per_question - time_taken) / time_per_question)
                speed_bonus = int(question_config["max_speed_bonus"] * time_remaining_ratio)
                points += speed_bonus

        # Cập nhật điểm player
        for player in room.players:
            if player.wallet_id == wallet_id:
                player.score += points
                break

        # Lưu answer để tracking (nếu cần)
        try:
            answer_record = Answer(
                room_id=room_id,
                wallet_id=wallet_id,
                score=points,
                question_id=current_question.id if hasattr(current_question, 'id') else None,
                question_index=room.current_index,
                player_answer=player_answer,
                correct_answer=current_question.correct_answer,
                is_correct=is_correct,
                points_earned=points,
                response_time=submit_time - question_start_at,
                submitted_at=datetime.now(timezone.utc)
            )
            await self.answer_service.save_answer(answer_record)
        except Exception as e:
            print(f"Error saving answer: {e}")

        # Phản hồi cho player đã submit
        await send_json_safe(websocket, {
            "type": "answer_submitted",
            "payload": {
                "isCorrect": is_correct,
                "points": points,
                "baseScore": question_config["score"] if is_correct else 0,
                "speedBonus": speed_bonus,
                "correctAnswer": current_question.correct_answer,
                "explanation": getattr(current_question, 'explanation', None),
                "totalScore": next(p.score for p in room.players if p.wallet_id == wallet_id),
                "responseTime": submit_time - question_start_at
            }
        })

        await self.room_service.save_room(room)

        # Kiểm tra xem tất cả players đã trả lời chưa
        # Thay vì query database, sử dụng logic đơn giản hơn
        # Chỉ cần đếm số players và so sánh với số answers đã submit
        all_answered = True
        # TODO: Implement logic đếm answers đã submit cho câu hỏi hiện tại
        # Tạm thời bỏ qua logic này để tránh lỗi database
        
        # Nếu tất cả players đã trả lời, hiển thị kết quả và chuyển câu hỏi
        if all_answered:
            await self._show_question_result(room_id)

    # ✅ Helper function để show kết quả câu hỏi (IMPROVED)
    async def _show_question_result(self, room_id: str):
        """Hiển thị kết quả của câu hỏi hiện tại"""
        room = await self.room_service.get_room(room_id)
        if not room:
            return

        current_question = room.current_question
        if not current_question:
            return
        
        # Thống kê câu trả lời từ database
        answer_stats = {}
        for option in current_question.options:
            answer_stats[option] = 0
        
        # Tạm thời bỏ qua logic query database để tránh lỗi
        # TODO: Implement logic lấy answer stats từ database
        
        await self.manager.broadcast_to_room(room_id, {
            "type": "question_result",
            "payload": {
                "questionIndex": room.current_index,
                "correctAnswer": current_question.correct_answer,
                "explanation": getattr(current_question, 'explanation', None),
                "answerStats": answer_stats,
                "totalResponses": sum(answer_stats.values()),
                "leaderboard": [
                    {
                        "walletId": p.wallet_id,
                        "username": p.username,
                        "score": p.score,
                        "rank": idx + 1
                    } for idx, p in enumerate(sorted(room.players, key=lambda x: x.score, reverse=True))
                ]
            }
        })

        # Tự động chuyển sang câu hỏi tiếp theo sau 5 giây
        # Chỉ tạo task nếu chưa có task active cho room này
        if room_id not in self.active_tasks:
            async def next_question_delay():
                try:
                    await asyncio.sleep(5)
                    await self._move_to_next_question(room_id)
                finally:
                    # Xóa task khỏi tracking khi hoàn thành
                    self.active_tasks.pop(room_id, None)
            
            task = asyncio.create_task(next_question_delay())
            self.active_tasks[room_id] = task
    
    async def handle_lobby_socket(self, websocket: WebSocket):
        await self.manager.connect_lobby(websocket)
        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except WebSocketDisconnect:
                    break

                msg_type = data.get("type")
                handler = {"ping": self._handle_ping, "broadcast": self._handle_broadcast}.get(msg_type)
                if handler:
                    await handler(websocket, data)
        finally:
            self.manager.disconnect_lobby(websocket)

    async def handle_room_socket(self, websocket: WebSocket, room_id: str, wallet_id: str):
        await self.manager.connect_room(websocket, room_id, wallet_id)

        room = await self.room_service.get_room(room_id)
        if room and room.status == GAME_STATUS.IN_PROGRESS:
            # Chỉ gửi câu hỏi hiện tại nếu có và chưa hết thời gian
            current_question = room.current_question
            if current_question:
                # Kiểm tra xem câu hỏi còn thời gian không
                current_time = int(time.time() * 1000)
                question_config = QUESTION_CONFIG.get(current_question.difficulty, QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY])
                time_per_question = question_config["time_per_question"]
                
                # Tính thời gian bắt đầu câu hỏi hiện tại
                question_start_time = int(room.started_at.timestamp() * 1000) + room.current_index * time_per_question * 1000
                question_end_time = question_start_time + time_per_question * 1000
                
                # Chỉ gửi nếu còn thời gian (ví dụ: còn ít nhất 5 giây)
                if current_time < question_end_time - 5000:
                    # Chuẩn bị câu hỏi cho client (loại bỏ correct_answer)
                    client_question = current_question.model_dump(exclude={"correct_answer"})
                    options = client_question.get("options", [])
                    if options:
                        shuffled_options = options.copy()
                        random.shuffle(shuffled_options)
                        client_question["options"] = shuffled_options
                    client_question.pop("correct_answer", None)
                    
                    await send_json_safe(websocket, {
                        "type": "next_question",
                        "payload": {
                            "questionIndex": room.current_index,
                            "question": client_question,
                            "timing": {
                                "questionStartAt": question_start_time,
                                "questionEndAt": question_end_time,
                                "timePerQuestion": time_per_question,
                            },
                            "config": question_config,
                            "progress": {
                                "current": room.current_index + 1,
                                "total": room.total_questions
                            }
                        }
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
                except WebSocketDisconnect:
                    break

                msg_type = data.get("type")
                handler = room_handlers.get(msg_type)
                if handler:
                    await handler(websocket, room_id, wallet_id, data)
        finally:
            self.manager.disconnect_room(websocket, room_id, wallet_id)