from datetime import datetime, timezone
from typing import List
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
from config.constants import NEXT_QUESTION_DELAY, SEND_ONLY_REAMIN_TIME_IN_SECONDS
from models.question import Question
from services.aptos_service import AptosService
from services.answer_service import AnswerService
from services.player_service import PlayerService
from services.question_service import QuestionService
from services.room_service import RoomService
from services.websocket_manager import WebSocketManager
from pydantic import ValidationError
from enums.game_status import GAME_STATUS
from repositories.implement.user_repo_impl import UserRepository, UserStatsRepository
import random, asyncio, pprint, time, uuid
from services.nft_service import BlockchainService
from typing import Dict, List, Optional, Any

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
        self.nft_service = BlockchainService()  # Thêm NFT service
        self.aptos_service = AptosService()  # Thêm Aptos service
        # Thêm tracking cho active tasks
        self.active_tasks = {}
        self.is_moving_to_next = set()

    async def _handle_disconnect_ws(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        # Lấy ra kết nối HIỆN TẠI (có thể là một kết nối mới nếu người dùng đã reconnect)
        current_socket = await self.manager.get_player_socket(wallet_id)

        is_truly_disconnected = not current_socket or current_socket == websocket
        
        if is_truly_disconnected:
            print(f"[WS_DICONNECTED] User {wallet_id} is truly disconnected.")
            current_player = await self.player_service.get_players_by_wallet_and_room_id(room_id=room_id, wallet_id=wallet_id)
            
            DISCONNECTABLE_STATUSES = {
                PLAYER_STATUS.ACTIVE,
                PLAYER_STATUS.READY,
                PLAYER_STATUS.WAITING,
            }
            if current_player and current_player.player_status in DISCONNECTABLE_STATUSES:
                # 1. Cập nhật trạng thái trong DB/cache
                await self.player_service.update_player(wallet_id, room_id, {
                    "player_status": PLAYER_STATUS.DISCONNECTED
                })
            
            # 2. Broadcast cho mọi người
            await self.manager.broadcast_to_room(
                room_id,
                {
                    "type": "player_disconnected",
                    "payload": {"walletId": wallet_id},
                },
            )
            
            # 3. Kích hoạt lại việc kiểm tra logic game
            try:
                room = await self.room_service.get_room(room_id)
                if room and room.status == GAME_STATUS.IN_PROGRESS:
                    print(f"[DISCONNECT_CHECK] Re-evaluating game state for room {room_id}.")
                    await self._check_and_show_question_result(room_id)
            except Exception as e:
                print(f"[ERROR] Could not check game result after disconnect: {e}")
                
        else:
            # Người dùng đã ngắt kết nối và kết nối lại ngay lập tức với một socket mới.
            # Chúng ta không cần chạy logic disconnect đầy đủ, vì họ đã quay trở lại.
            print(f"[WS_RECONNECT] User {wallet_id} disconnected but reconnected instantly. Skipping full disconnect logic.")

        # Cuối cùng, luôn luôn dọn dẹp kết nối CŨ ra khỏi manager.
        self.manager.disconnect_room(websocket, room_id)    
    
    async def _handle_leave_room(self, websocket, room_id: str, wallet_id: str, data: dict):
        self.manager.disconnect_room(websocket, room_id)
        await self.player_service.leave_room(wallet_id=wallet_id, room_id=room_id)

    async def _handle_kick_player(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        try:
            payload = KickPayload(**data.get("payload", {}))
        except ValidationError:
            return

        host_wallet_id = await self.room_service.get_host_room_wallet(room_id)
        if not host_wallet_id or host_wallet_id != wallet_id:
            await send_json_safe(websocket, {"type": "error", "message": "Only the host can kick players."})
            return

        kicked_ws = await self.manager.get_player_socket(payload.wallet_id)
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
        print(f"[MOVE_NEXT] Attempting to move to next question for room {room_id}.")
        
        # Lấy lại trạng thái phòng mới nhất
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            print(f"[MOVE_NEXT] Aborting: Room not found or game not in progress.")
            self.is_moving_to_next.discard(room_id)
            return

        # Ghi lại index hiện tại để so sánh
        original_index = room.current_index
        
        # Cập nhật index
        new_index = original_index + 1
        
        # Kiểm tra xem game đã kết thúc chưa
        if new_index >= room.total_questions:
            print(f"[MOVE_NEXT] Reached end of questions. Ending game.")
            await self._handle_game_end(room_id)
            return

        # CẬP NHẬT ROOM OBJECT TRONG BỘ NHỚ
        room.current_index = new_index
        # RESET THỜI GIAN BẮT ĐẦU CỦA CÂU HỎI CŨ
        # Đây là bước quan trọng nhất để ngăn việc sử dụng lại dữ liệu cũ.
        room.current_question_started_at = None 

        # LƯU TRẠNG THÁI MỚI VÀO DB/CACHE
        # Toàn bộ object room với index mới và started_at=None được lưu lại
        await self.room_service.save_room(room)
        print(f"[MOVE_NEXT] Room {room_id} state saved. New index: {new_index}, started_at is now None.")
        
        # KÍCH HOẠT VIỆC GỬI CÂU HỎI TIẾP THEO
        # Hàm này bây giờ sẽ đọc được trạng thái phòng mới và sạch
        await self._send_current_question(room_id)

    # ✅ Handle game end - kết thúc game và tính toán kết quả
    async def _handle_game_end(self, room_id: str):
        """Xử lý khi game kết thúc"""
        room = await self.room_service.get_room(room_id)
        if not room or room.status == GAME_STATUS.FINISHED:
            return

        # Cập nhật trạng thái room
        room.status = GAME_STATUS.FINISHED
        game_end_time = datetime.now(timezone.utc)
        room.ended_at = game_end_time
        
        # THAY ĐỔI 1: Lấy kết quả của TẤT CẢ người chơi, kể cả disconnected
        results = []
        all_players = room.players # Sử dụng tất cả người chơi
        
        for p in all_players:
            answers = await self.answer_service.get_answers_by_wallet_id(room_id, p.wallet_id)
            if answers is None:
                answers = []
            
            valid_answers = []
            for a in answers:
                if hasattr(a, 'score'):
                    valid_answers.append({"score": a.score, "question_id": a.question_id, "response_time": getattr(a, 'response_time', 0), "is_correct": getattr(a, 'is_correct', a.score > 0)})
                elif isinstance(a, dict) and "score" in a:
                    valid_answers.append(a)
            
            score = sum(a["score"] for a in valid_answers)
            results.append({
                "wallet": p.wallet_id,
                "oath": p.username,
                "score": score,
                "answers": valid_answers
            })
        
        # THAY ĐỔI 2: Xác định winner CHỈ từ những người chơi còn lại (active)
        active_results = [
            r for r in results 
            if r["wallet"] in {p.wallet_id for p in all_players if p.player_status != PLAYER_STATUS.DISCONNECTED}
        ]
        winner = max(active_results, key=lambda x: x['score']) if active_results else None
        winner_wallet = winner['wallet'] if winner else None
        
        # Sắp xếp results của tất cả người chơi để tạo leaderboard
        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)
        
        # Chuẩn bị leaderboard với ranking chi tiết
        leaderboard = []
        for idx, result in enumerate(sorted_results):
            player = next((p for p in all_players if p.wallet_id == result["wallet"]), None)
            
            correct_answers = len([a for a in result["answers"] if a.get("score", 0) > 0])
            total_answers = len(result["answers"])
            accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0.0
            
            response_times = [a.get("response_time", 0) for a in result["answers"] if "response_time" in a]
            average_time = sum(response_times) / len(response_times) if response_times else 0.0
            
            status_obj = getattr(player, 'player_status', PLAYER_STATUS.DISCONNECTED)
            if isinstance(status_obj, PLAYER_STATUS):
                final_status = status_obj.value # Lấy giá trị chuỗi từ Enum
            else:
                final_status = str(status_obj) # Nó đã là một chuỗi, chỉ cần dùng nó

            player_stats = {
                "rank": idx + 1,
                "walletId": result["wallet"],
                "username": result["oath"],
                "avatar": getattr(player, 'avatar', None) if player else None,
                "score": result["score"],
                "correctAnswers": correct_answers,
                "totalAnswers": total_answers,
                "accuracy": round(accuracy, 2),
                "averageTime": round(average_time, 2),
                "isWinner": result["wallet"] == winner_wallet,
                "reward": 0,
                "status": final_status # Sử dụng biến đã được xử lý an toàn
            }
            leaderboard.append(player_stats)

        # Tính toán game statistics
        active_players_list = [p for p in all_players if p.player_status != PLAYER_STATUS.DISCONNECTED]
        total_players = len(active_players_list)
        game_stats = {
            "totalPlayers": total_players,
            "totalQuestions": room.total_questions,
            "gameMode": getattr(room, 'game_mode', 'standard'),
            "gameDuration": (game_end_time - room.started_at).total_seconds() if room.started_at else 0,
            "averageScore": sum(r['score'] for r in active_results) / total_players if total_players > 0 else 0,
            "highestScore": sorted_results[0]['score'] if sorted_results else 0,
            "questionBreakdown": {
                "easy": getattr(room, 'easy_questions', 0),
                "medium": getattr(room, 'medium_questions', 0),
                "hard": getattr(room, 'hard_questions', 0)
            }
        }

        # Cập nhật DB cho TẤT CẢ người chơi đã tham gia
        for result in results:
            await self.user_stats_repo.update_user_stats(
                wallet_id=result["wallet"],
                score=result["score"],
                is_winner=(result["wallet"] == winner_wallet)
            )
        
        await self.user_stats_repo.recalculate_ranks()
        await self.room_service.save_room(room)

        # Broadcast game end với leaderboard chi tiết
        await self.manager.broadcast_to_room(room_id, {
            "type": "game_ended",
            "payload": {
                "gameStats": game_stats,
                "leaderboard": leaderboard,
                "winner": next((p for p in leaderboard if p["isWinner"]), None),
                "endedAt": int(game_end_time.timestamp() * 1000),
                "roomId": room_id
            }
        })

        # Broadcast clear local storage
        await self.manager.broadcast_to_room(room_id, {
            "type": "clear_local_storage"
        })

        if winner_wallet:
            try:
                print(f"[NFT] Starting NFT minting process for winner {winner_wallet} in room {room_id}")
                
                # 1. Mint NFT từ BlockchainService (code cũ)
                blockchain_nft_result = await self._mint_and_transfer_nft(room_id, winner_wallet)
                print(f"[BLOCKCHAIN_NFT] Result: {blockchain_nft_result}")
                
                # 2. Mint NFT từ AptosService (code mới)
                aptos_nft_result = await self._mint_aptos_nft(room_id, winner_wallet)
                print(f"[APTOS_NFT] Result: {aptos_nft_result}")
                
                # 3. Broadcast kết quả tổng hợp
                await self.manager.broadcast_to_room(room_id, {
                    "type": "nft_awarded",
                    "payload": {
                        "winner_wallet": winner_wallet,
                        "room_id": room_id,
                        "blockchain_nft": blockchain_nft_result,
                        "aptos_nft": aptos_nft_result,
                        "message": "🎉 Congratulations! You've won NFTs from both blockchain and Aptos!"
                    }
                })
                
            except Exception as e:
                print(f"[NFT_ERROR] Exception during NFT minting: {str(e)}")
                # Broadcast error to room
                await self.manager.broadcast_to_room(room_id, {
                    "type": "nft_error",
                    "payload": {
                        "winner_wallet": winner_wallet,
                        "error": str(e),
                        "room_id": room_id,
                        "message": "Sorry, there was an error minting your NFTs."
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
                await self.user_stats_repo.update_user_stats(wallet_id, user_stats["total_score"], user_stats["total_wins"] > 0)
                
        except Exception as e:
            print(f"Error updating player statistics: {e}")

    # ✅ Cleanup finished room
    async def _cleanup_finished_room(self, room_id: str):
        """Dọn dẹp room đã kết thúc"""
        try:
            # Disconnect all remaining connections
            self.manager.disconnect_room_by_room_id(room_id)
            
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

        easy_count = room.easy_questions if room.easy_questions is not None else QUESTION_CONFIG[QUESTION_DIFFICULTY.EASY]["quantity"]
        medium_count = room.medium_questions if room.medium_questions is not None else QUESTION_CONFIG[QUESTION_DIFFICULTY.MEDIUM]["quantity"]
        hard_count = room.hard_questions if room.hard_questions is not None else QUESTION_CONFIG[QUESTION_DIFFICULTY.HARD]["quantity"]

        # ✅ 4. Lấy danh sách câu hỏi và shuffle
        easy_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.EASY, easy_count)
        medium_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.MEDIUM, medium_count)
        hard_qs = await self.question_service.get_random_questions_by_difficulty(QUESTION_DIFFICULTY.HARD, hard_count)

        questions = [*easy_qs, *medium_qs, *hard_qs]
        random.shuffle(questions)

        if not questions:
            await send_json_safe(websocket, {"type": "error", "message": "No questions found."})
            return
            
        # Nếu không đủ câu hỏi, điều chỉnh total_questions
        if len(questions) < (easy_count + medium_count + hard_count):
            pass
            
        # Đảm bảo có đủ câu hỏi bằng cách lặp lại nếu cần
        target_questions = easy_count + medium_count + hard_count
        if len(questions) < target_questions:
            # Lặp lại câu hỏi để đạt được số lượng mong muốn
            repeated_questions = []
            while len(repeated_questions) < target_questions:
                repeated_questions.extend(questions[:target_questions - len(repeated_questions)])
            questions = repeated_questions[:target_questions]

        # ✅ 5. Chuẩn bị dữ liệu câu hỏi cho client (loại bỏ đáp án đúng)
        def prepare_question_for_client(question):
            """Chuẩn bị câu hỏi để gửi cho client, loại bỏ correct_answer"""
            question_dict = question.dict()
            options = question_dict.get("options", [])
            if options:
                shuffled_options = options.copy()
                random.shuffle(shuffled_options)
                question_dict["options"] = shuffled_options
                # Gán lại options đã shuffle vào object gốc để lưu vào room
                question.options = shuffled_options
            question_dict.pop("correct_answer", None)
            return question_dict

        # ✅ 6. Chuẩn bị danh sách câu hỏi cho client
        client_questions = [prepare_question_for_client(q) for q in questions]

        # ✅ 7. Cập nhật trạng thái phòng
        room.players = [p.model_copy(update={"status": PLAYER_STATUS.ACTIVE}) for p in room.players]
        room.status = GAME_STATUS.IN_PROGRESS
        room.current_questions = questions 
        room.current_index = 0
        room.started_at = datetime.now(timezone.utc)

        await self.room_service.save_room(room)
        self.manager.clear_room_timeout(room_id)

        # ✅ 8. Gửi sự kiện bắt đầu game với tất cả câu hỏi (không có đáp án)
        start_at = int(time.time() * 1000) + (room.countdown_duration * 1000)
        await self.manager.broadcast_to_room(room_id, {
            "type": "game_started",
            "payload": {
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

    # ✅ Helper function để xử lý submit answer (IMPROVED)
    async def _handle_submit_answer(self, websocket: WebSocket, room_id: str, wallet_id: str, data: dict):
        """
        Xử lý khi người chơi submit câu trả lời.
        Phiên bản này chỉ tin vào dữ liệu và thời gian của server.
        """
        
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            await send_json_safe(websocket, {"type": "error", "message": "Game is not in progress."})
            return

        current_question = room.current_question
        if not current_question:
            return
        
        # Thêm kiểm tra: nếu người chơi đã trả lời rồi thì không xử lý nữa
        # Điều này cần một cơ chế kiểm tra trong answer_service
        existing_answer = await self.answer_service.get_answer_by_question_and_wallet(room_id, current_question.id, wallet_id)
        if existing_answer:
            await send_json_safe(websocket, {"type": "error", "message": "You have already answered this question."})
            return
            
        if not current_question:
            await send_json_safe(websocket, {"type": "error", "message": "No current question available."})
            return

        # 1. LẤY "NGUỒN CHÂN LÝ" VỀ THỜI GIAN TỪ SERVER
        if not room.current_question_started_at:
            print(f"[ERROR] Cannot process answer for room {room_id}: current_question_started_at is not set!")
            await send_json_safe(websocket, {"type": "error", "message": "Server error: Cannot determine question start time."})
            return
        question_start_at = int(room.current_question_started_at.timestamp() * 1000)

        # 2. TÍNH TOÁN THỜI GIAN CHO PHÉP (SỬ DỤNG HELPER)
        time_per_question = self._get_time_for_question(room, current_question)
        
        # 3. LẤY DỮ LIỆU TỪ PAYLOAD
        player_answer = data.get("data", {}).get("answer", "")
        submit_time = int(time.time() * 1000)
        is_correct = player_answer == current_question.correct_answer

        # 4. TÍNH ĐIỂM
        points = 0
        speed_bonus = 0
        time_bonus = 0
        order_bonus = 0
        question_config = QUESTION_CONFIG.get(current_question.difficulty, {})
        
        if is_correct:
            base_score = question_config.get("score", 0)
            points = base_score
            
            if question_config.get("speed_bonus_enabled", False):
                time_taken = (submit_time - question_start_at) / 1000
                
                # Chỉ tính bonus nếu trả lời trong thời gian cho phép
                if 0 <= time_taken < time_per_question:
                    time_remaining_ratio = (time_per_question - time_taken) / time_per_question
                    max_bonus = question_config.get("max_speed_bonus", 0)
                    
                    # Speed bonus (dựa trên thời gian còn lại)
                    speed_bonus = int(max_bonus * time_remaining_ratio)
                    points += speed_bonus

                    # Time bonus (dựa trên thời gian đã sử dụng)
                    time_percentage = time_taken / time_per_question
                    time_bonus = int(max_bonus * 0.5 * (1.0 - time_percentage))
                    points += time_bonus
                    
                    # Order bonus (tính toán dựa trên các câu trả lời đúng đã có)
                    try:
                        correct_answers = await self.answer_service.get_correct_answers_by_question_id(room_id, current_question.id)
                        correct_answer_count = len(correct_answers) if correct_answers else 0
                        
                        if correct_answer_count == 0:
                            order_bonus = int(max_bonus * 0.3)
                        elif correct_answer_count == 1:
                            order_bonus = int(max_bonus * 0.15)
                        elif correct_answer_count == 2:
                            order_bonus = int(max_bonus * 0.05)
                        points += order_bonus
                    except Exception as e:
                        print(f"Error calculating order bonus: {e}")

        # 5. CẬP NHẬT TRẠNG THÁI VÀ LƯU DỮ LIỆU
        # Cập nhật điểm player trong object room
        player = next((p for p in room.players if p.wallet_id == wallet_id), None)
        if player:
            player.score += points

        # Lưu bản ghi câu trả lời vào DB
        response_time = submit_time - question_start_at
        is_no_answer = not player_answer
        try:
            answer_record = Answer(
                room_id=room_id,
                wallet_id=wallet_id,
                score=points,
                question_id=current_question.id,
                question_index=room.current_index,
                answer=player_answer,
                is_correct=is_correct,
                points_earned=points,
                response_time=response_time if not is_no_answer else 0,
                submitted_at=datetime.fromtimestamp(submit_time / 1000, tz=timezone.utc)
            )
            await self.answer_service.save_answer(answer_record)
        except Exception as e:
            print(f"Error saving answer: {e}")
            
        # Lưu lại room object đã cập nhật điểm
        await self.room_service.save_room(room)

        # 6. GỬI PHẢN HỒI CHO CLIENT
        await send_json_safe(websocket, {
            "type": "answer_submitted",
            "payload": {
                "isCorrect": is_correct,
                "points": points,
                "baseScore": question_config.get("score", 0) if is_correct else 0,
                "speedBonus": speed_bonus,
                "timeBonus": time_bonus,
                "orderBonus": order_bonus,
                "correctAnswer": current_question.correct_answer,
                "explanation": getattr(current_question, 'explanation', None),
                "totalScore": player.score if player else 0,
                "responseTime": response_time if not is_no_answer else 0,
                "message": f"You earned {points} points" if not is_no_answer else "No answer submitted - 0 points",
                "isNoAnswer": is_no_answer
            }
        })

        # 7. KÍCH HOẠT KIỂM TRA LOGIC GAME
        try:
            await self._check_and_show_question_result(room_id)
        except Exception as e:
            print(f"Error in _check_and_show_question_result from _handle_submit_answer: {e}")
    
    # ✅ Helper function để show kết quả câu hỏi (IMPROVED)
    async def _show_question_result(self, room_id: str, handle_unanswered: bool = True):
        """Hiển thị kết quả của câu hỏi hiện tại"""
        room = await self.room_service.get_room(room_id)
        if not room:
            return

        current_question = room.current_question
        if not current_question:
            return
        
        # Chỉ tự động submit "no answer" khi handle_unanswered=True (tức là hết thời gian)
        if handle_unanswered:
            await self._handle_unanswered_questions(room_id, current_question)
        
        # Thống kê câu trả lời từ database
        answer_stats = {}
        for option in current_question.options:
            answer_stats[option] = 0
        
        # Add "No Answer" option to stats
        answer_stats["No Answer"] = 0
        
        # Lấy thống kê từ database
        try:
            current_question_answers = await self.answer_service.get_answers_by_room_and_question_id(room_id, current_question.id)
            if current_question_answers:
                for answer in current_question_answers:
                    if answer.answer and answer.answer in answer_stats:
                        answer_stats[answer.answer] += 1
                    elif not answer.answer or answer.answer == "":
                        answer_stats["No Answer"] += 1
        except Exception as e:
            print(f"Error getting answer stats: {e}")
        
        # Calculate total responses (excluding "No Answer" for percentage calculations)
        total_responses = sum(count for option, count in answer_stats.items() if option != "No Answer")
        
        # Chỉ tính active players trong thống kê
        active_players = room.players
        
        await self.manager.broadcast_to_room(room_id, {
            "type": "question_result",
            "payload": {
                "questionIndex": room.current_index,
                "correctAnswer": current_question.correct_answer,
                "explanation": getattr(current_question, 'explanation', None),
                "answerStats": answer_stats,
                "totalResponses": total_responses,
                "totalPlayers": len(active_players),
                "options": current_question.options,
                "leaderboard": [
                    {
                        "walletId": p.wallet_id,
                        "username": p.username,
                        "score": p.score,
                        "rank": idx + 1,
                        "status": p.player_status,
                    } for idx, p in enumerate(sorted(active_players, key=lambda x: x.score, reverse=True))
                ]
            }
        })

        if room_id not in self.active_tasks:
            async def next_question_delay():
                try:
                    print(f"[NEXT_QUESTION] Room {room_id} - Waiting 3 seconds before moving to next question")
                    # Wait 3 seconds to show result, then move to next question
                    await asyncio.sleep(NEXT_QUESTION_DELAY)
                    print(f"[NEXT_QUESTION] Room {room_id} - Moving to next question now")
                    await self._move_to_next_question(room_id)
                except Exception as e:
                    print(f"[ERROR] Error in next_question_delay for room {room_id}: {e}")
                finally:
                    # Xóa task khỏi tracking khi hoàn thành
                    self.active_tasks.pop(room_id, None)
                    print(f"[NEXT_QUESTION] Room {room_id} - Next question delay task completed")
            
            task = asyncio.create_task(next_question_delay())
            self.active_tasks[room_id] = task
        else:
            print(f"[NEXT_QUESTION] Room {room_id} - Skipping next question delay task (already exists)")

    # Trong lớp WebSocketController

    async def _send_current_question(self, room_id: str, force: bool = False):
        # 1. LẤY DỮ LIỆU MỚI NHẤT
        # Luôn lấy lại room object để đảm bảo có trạng thái chính xác nhất
        room = await self.room_service.get_room(room_id)
        if not room or room.status != GAME_STATUS.IN_PROGRESS:
            print(f"[SEND_Q] Aborting, room {room_id} not found or game not in progress.")
            return
        
        # Lớp bảo vệ chống race condition:
        # Nếu một tiến trình khác đã gửi câu hỏi này, `started_at` sẽ không còn là None.
        if not force and room.current_question_started_at is not None:
            print(f"[SEND_Q] Aborting, question {room.current_index} for room {room_id} seems to be already sent.")
            return

        current_question = room.current_question
        if not current_question:
            print(f"[SEND_Q_ERROR] No question found at index {room.current_index} for room {room_id}.")
            await self._handle_game_end(room_id)
            return

        # 2. TẠO RA "NGUỒN CHÂN LÝ" VỀ THỜI GIAN (MỘT LẦN DUY NHẤT)
        question_start_moment = datetime.now(timezone.utc)
        question_start_at_ts = int(question_start_moment.timestamp() * 1000)

        # 3. TÍNH TOÁN THÔNG SỐ CÂU HỎI (SỬ DỤNG HELPER)
        time_per_question = self._get_time_for_question(room, current_question)
        question_end_at_ts = question_start_at_ts + time_per_question * 1000
        question_config = QUESTION_CONFIG.get(current_question.difficulty, {})
        
        # 4. CHUẨN BỊ PAYLOAD VÀ CẬP NHẬT TRẠNG THÁI ROOM
        # Xáo trộn các lựa chọn cho client
        client_question = current_question.model_dump(exclude={"correct_answer"})
        options = client_question.get("options", [])
        if options:
            random.shuffle(options)
            client_question["options"] = options
            # Gán lại options đã shuffle vào object gốc để lưu lại
            current_question.options = options

        # Gán thời gian bắt đầu vào room object
        room.current_question_started_at = question_start_moment
        
        # LƯU TRẠNG THÁI MỚI VÀO DB/CACHE MỘT LẦN DUY NHẤT
        await self.room_service.save_room(room)
        print(f"[SEND_Q] Saved room {room.id} with new question {room.current_index} and started_at timestamp.")

        # 5. GỬI BROADCAST VỚI "NGUỒN CHÂN LÝ"
        await self.manager.broadcast_to_room(room_id, {
            "type": "next_question",
            "payload": {
                "questionIndex": room.current_index,
                "question": client_question,
                "timing": {
                    "questionStartAt": question_start_at_ts,
                    "questionEndAt": question_end_at_ts,
                    "timePerQuestion": time_per_question,
                },
                "config": question_config,
                "progress": {
                    "current": room.current_index + 1,
                    "total": room.total_questions
                }
            }
        })
        
        # 6. TẠO FALLBACK TIMER AN TOÀN
        # Hủy timer cũ nếu còn tồn tại để tránh xung đột
        if room_id in self.active_tasks:
            self.active_tasks[room_id].cancel()
        
        async def fallback_auto_next_question():
            try:
                # Buffer thời gian chờ có thể là 5 giây
                await asyncio.sleep(time_per_question + 5)
                
                # Kiểm tra khóa "is_moving_to_next" để tránh race condition
                if room_id in self.is_moving_to_next:
                    return

                current_room_state = await self.room_service.get_room(room_id)
                if (current_room_state and
                    current_room_state.status == GAME_STATUS.IN_PROGRESS and
                    current_room_state.current_index == room.current_index):
                    
                    # Giành lấy khóa để chỉ tiến trình này được phép chuyển câu hỏi
                    self.is_moving_to_next.add(room_id)
                    print(f"[FALLBACK] Timer expired for question {room.current_index}. Forcing next step.")
                    
                    await self._handle_unanswered_questions(room_id, current_question)
                    await self._show_question_result(room_id, handle_unanswered=False)

            except asyncio.CancelledError:
                print(f"[FALLBACK] Timer for room {room_id} was cancelled, likely because all players answered.")
            except Exception as e:
                print(f"[FALLBACK_ERROR] An error occurred in fallback timer for room {room_id}: {e}")
            finally:
                self.active_tasks.pop(room_id, None)

        task = asyncio.create_task(fallback_auto_next_question())
        self.active_tasks[room_id] = task

    # ✅ NEW: Handle unanswered questions
    async def _handle_unanswered_questions(self, room_id: str, current_question: Question):
        """Automatically submit 'no answer' for players who didn't respond"""
        room = await self.room_service.get_room(room_id)
        if not room:
            return

        try:
            # Get all answers for current question
            current_question_answers = await self.answer_service.get_answers_by_room_and_question_id(room_id, current_question.id)
            
            # Get list of players who answered
            answered_players = set()
            if current_question_answers:
                for answer in current_question_answers:
                    if answer.wallet_id:
                        answered_players.add(answer.wallet_id)
            
            # Find active players who didn't answer (exclude disconnected players)
            active_players = set(p.wallet_id for p in room.players if p.player_status != PLAYER_STATUS.DISCONNECTED)
            unanswered_active_players = active_players - answered_players
            
            print(f"[UNANSWERED] Room {room_id} - Question {room.current_index + 1}: {len(unanswered_active_players)} active players didn't answer")
            
            # Submit "no answer" for each active player who didn't respond
            for wallet_id in unanswered_active_players:
                try:
                    # Create answer record with no answer (empty string)
                    answer_record = Answer(
                        room_id=room_id,
                        wallet_id=wallet_id,
                        score=0,
                        question_id=current_question.id if hasattr(current_question, 'id') else "",
                        question_index=room.current_index,
                        answer="",
                        player_answer="",
                        correct_answer=current_question.correct_answer,
                        is_correct=False,
                        points_earned=0,
                        response_time=0,
                        submitted_at=datetime.now(timezone.utc)
                    )
                    
                    await self.answer_service.save_answer(answer_record)
                    print(f"[UNANSWERED] Auto-submitted no answer for active player {wallet_id}")
                    
                except Exception as e:
                    print(f"Error auto-submitting no answer for player {wallet_id}: {e}")
                    
        except Exception as e:
            print(f"Error handling unanswered questions: {e}")

    # Sửa hàm _mint_and_transfer_nft để có logic trực tiếp từ controller
    async def _mint_and_transfer_nft(self, room_id: str, winner_wallet: str) -> dict:
        """Mint NFT cho deployer và transfer cho winner"""
        try:
            # Generate default metadata_uri
            metadata_uri = f"https://challengewave.com/nft/{room_id}"
            
            # Mint NFT trước (nếu chưa có), sau đó transfer cho winner
            try:
                # Thử mint NFT (có thể đã tồn tại)
                mint_result = self.nft_service.mint_nft(room_id, metadata_uri)
                # print(f"[NFT] Mint NFT result: {mint_result}")
            except Exception as mint_error:
                # Nếu NFT đã tồn tại, bỏ qua lỗi và tiếp tục
                if "NFT already exists" in str(mint_error):
                    # print(f"[NFT] NFT already exists for room {room_id}, continuing with transfer...")
                    mint_result = "NFT already existed"
                else:
                    raise mint_error
            
            # Transfer NFT cho winner bằng cách submit game result
            score = 100
            zk_proof = "0x" + "00"*32
            transfer_result = self.nft_service.submit_game_result(room_id, winner_wallet, score, zk_proof)
            
            return {
                "message": "NFT minted and transferred successfully",
                "mint_result": mint_result,
                "transfer_result": transfer_result,
                "winner_wallet": winner_wallet
            }
            
        except Exception as e:
            print(f"[NFT_ERROR] Error in _mint_and_transfer_nft: {str(e)}")
            raise e

    # ✅ NEW: Mint NFT using AptosService
    async def _mint_aptos_nft(self, room_id: str, winner_wallet: str) -> dict:
        """Mint NFT cho winner sử dụng AptosService"""
        try:
            # Lấy thông tin user để có aptos_wallet
            user = await self.user_repo.get_by_wallet(winner_wallet)
            if not user or not user.aptos_wallet:
                return {
                    "success": False,
                    "message": "Winner does not have an Aptos wallet connected",
                    "error": "No aptos_wallet found for winner",
                    "winner_wallet": winner_wallet
                }
            
            aptos_wallet_address = user.aptos_wallet
            
            # Tạo metadata cho NFT
            collection_name = "ChallengeWave Winners"
            token_name = f"Winner Trophy - Room {room_id}"
            token_description = f"Winner NFT for ChallengeWave game room {room_id}"
            token_uri = f"https://challengewave.com/nft/{room_id}/metadata.json"
            
            print(f"[APTOS_NFT] Minting NFT for winner {winner_wallet} (Aptos: {aptos_wallet_address}) in room {room_id}")
            
            # Sử dụng AptosService để mint NFT với aptos_wallet
            mint_result = await self.aptos_service.mint_nft_to_player(
                recipient_address=aptos_wallet_address,
                collection_name=collection_name,
                token_name=token_name,
                token_description=token_description,
                token_uri=token_uri
            )
            
            if mint_result.get("success"):
                print(f"[APTOS_NFT] Successfully minted NFT for winner {winner_wallet} to Aptos wallet {aptos_wallet_address}")
                return {
                    "success": True,
                    "message": "Aptos NFT minted and transferred successfully",
                    "transaction_hash": mint_result.get("transaction_hash"),
                    "explorer_url": mint_result.get("explorer_url"),
                    "winner_wallet": winner_wallet,
                    "aptos_wallet": aptos_wallet_address,
                    "token_name": token_name
                }
            else:
                print(f"[APTOS_NFT_ERROR] Failed to mint NFT: {mint_result.get('error')}")
                return {
                    "success": False,
                    "message": "Failed to mint Aptos NFT",
                    "error": mint_result.get("error"),
                    "winner_wallet": winner_wallet,
                    "aptos_wallet": aptos_wallet_address
                }
            
        except Exception as e:
            print(f"[APTOS_NFT_ERROR] Error in _mint_aptos_nft: {str(e)}")
            return {
                "success": False,
                "message": "Error minting Aptos NFT",
                "error": str(e),
                "winner_wallet": winner_wallet
            }

    async def force_end_game_for_test(self, room_id: str):
        """Force kết thúc game cho mục đích test NFT"""
        # print(f"[TEST] Force ending game for room {room_id}")
        await self._handle_game_end(room_id)
        return {"message": f"Game force ended for room {room_id}"}

    async def test_aptos_nft_mint(self, room_id: str, winner_wallet: str):
        """Test Aptos NFT minting cho mục đích test"""
        print(f"[TEST] Testing Aptos NFT mint for room {room_id}, winner {winner_wallet}")
        
        # Lấy thông tin user để có aptos_wallet
        user = await self.user_repo.get_by_wallet(winner_wallet)
        if not user or not user.aptos_wallet:
            return {
                "success": False,
                "message": "User does not have an Aptos wallet connected",
                "error": "No aptos_wallet found for user",
                "winner_wallet": winner_wallet
            }
        
        print(f"[TEST] User {winner_wallet} has Aptos wallet: {user.aptos_wallet}")
        result = await self._mint_aptos_nft(room_id, winner_wallet)
        return result

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
        # Bước 1: Lấy dữ liệu ban đầu
        # Sử dụng `room_service` để đảm bảo lấy dữ liệu mới nhất từ cache/DB
        room = await self.room_service.get_room(room_id)
        if not room:
            await websocket.close(code=1008, reason="Room not found")
            return
                
        player = next((p for p in room.players if p.wallet_id == wallet_id), None)
        if not player:
            await websocket.close(code=1008, reason="Player not found in this room")
            return

        # Bước 2: Kết nối người chơi vào WebSocketManager
        await self.manager.connect_room(websocket, room_id, wallet_id)

        # Bước 3: Xử lý các kịch bản kết nối
        is_reconnecting = player.player_status == PLAYER_STATUS.DISCONNECTED
        is_game_in_progress_and_stale = False
        
        if room.status == GAME_STATUS.IN_PROGRESS and room.current_question_started_at:
            # Lấy ra datetime object (có thể đang là naive)
            started_at_naive = room.current_question_started_at
            
            # Gán thông tin timezone UTC vào cho nó để biến nó thành aware
            started_at_aware = started_at_naive.replace(tzinfo=timezone.utc)

            # Thực hiện phép trừ với hai object đều đã aware
            time_since_last_action = datetime.now(timezone.utc) - started_at_aware
            
            if time_since_last_action.total_seconds() > 60:
                is_game_in_progress_and_stale = True

        # Kịch bản 1: Phục hồi game bị "cũ" (quan trọng nhất)
        if is_reconnecting and is_game_in_progress_and_stale:
            print(f"[RECOVERY] Player {wallet_id} reconnected to a stale game in room {room_id}. Recovering state.")
            
            # 1a. Cập nhật trạng thái người chơi
            player.player_status = PLAYER_STATUS.ACTIVE
            await self.player_service.update_player(wallet_id, room_id, {"player_status": PLAYER_STATUS.ACTIVE})
            
            # 1b. Broadcast cho những người khác (nếu có)
            await self.manager.broadcast_to_room(room_id, {
                "type": "player_reconnected",
                "payload": {"walletId": player.wallet_id, "username": player.username, "status": "active"}
            })
            
            # 1c. "Làm mới" câu hỏi hiện tại bằng cách gửi lại nó với một timestamp mới.
            # Đây là hành động cốt lõi để sửa lỗi time_remaining_ms.
            # Thao tác này sẽ broadcast 'next_question' cho TẤT CẢ mọi người trong phòng.
            print(f"[RECOVERY] Re-sending current question {room.current_index} to refresh timers.")
            await self._send_current_question(room_id, force=True)
            
        # Kịch bản 2: Người chơi reconnect vào một game đang chạy bình thường hoặc ở phòng chờ
        elif is_reconnecting:
            print(f"[RECONNECT] Player {wallet_id} reconnected to room {room_id}.")
            
            # Cập nhật trạng thái người chơi về lại trạng thái phù hợp
            player_status_before_disconnect = PLAYER_STATUS.ACTIVE if room.status == GAME_STATUS.IN_PROGRESS else PLAYER_STATUS.READY if player.is_ready or player.is_host else PLAYER_STATUS.WAITING
            player.player_status = player_status_before_disconnect
            await self.player_service.update_player(wallet_id, room_id, {"player_status": player_status_before_disconnect})
            
            # Broadcast cho mọi người
            await self.manager.broadcast_to_room(room_id, {
                "type": "player_reconnected",
                "payload": {"walletId": player.wallet_id, "username": player.username, "status": player_status_before_disconnect.value}
            })
            
            # Gửi gói tin đồng bộ hóa riêng cho người này
            await self._send_game_sync_payload(websocket, room_id)
            
        # Kịch bản 3: Kết nối mới (ví dụ: mở tab khác)
        else:
            print(f"[CONNECT] Player {wallet_id} established a new connection to room {room_id}.")
            # Chỉ cần gửi gói tin đồng bộ hóa, không cần broadcast.
            await self._send_game_sync_payload(websocket, room_id)
        
        
        # Bước 4: Vòng lặp xử lý tin nhắn (giữ nguyên)
        room_handlers = {
            "chat": self._handle_chat,
            "kick_player": self._handle_kick_player,
            "start_game": self._handle_start_game,
            "submit_answer": self._handle_submit_answer,
            "leave_room": self._handle_leave_room,
            # player_disconnected được xử lý qua disconnect event, không cần handler ở đây
        }
        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                handler = room_handlers.get(msg_type)
                if handler:
                    await handler(websocket, room_id, wallet_id, data)
                else:
                    print(f"[DEBUG] No handler found for message type: {msg_type}")
        except (WebSocketDisconnect, RuntimeError):
            await self._handle_disconnect_ws(websocket, room_id, wallet_id, {})
        finally:
            # Luôn đảm bảo ngắt kết nối khỏi manager khi coroutine kết thúc
            self.manager.disconnect_room(websocket, room_id)
    
    async def _check_and_show_question_result(self, room_id: str):
        room = await self.room_service.get_room(room_id)
        # Thêm kiểm tra phòng và câu hỏi hiện tại để tăng độ an toàn
        if not room or not room.current_question:
            return

        # 1. Lấy tập hợp wallet của những người đã trả lời
        current_question_answers = await self.answer_service.get_answers_by_room_and_question_id(room.id, room.current_question.id)
        answered_wallets = {a.wallet_id for a in current_question_answers}

        # 2. Lấy tập hợp wallet của những người đang active
        active_players = [p for p in room.players if p.player_status != PLAYER_STATUS.DISCONNECTED]
        active_wallets = {p.wallet_id for p in active_players}
        
        # In logs để debug
        print(f"[CHECK_RESULT] Room {room.id} - Active Wallets: {active_wallets}")
        print(f"[CHECK_RESULT] Room {room.id} - Answered Wallets: {answered_wallets}")

        # 3. ĐIỀU KIỆN ĐÚNG: Kiểm tra xem tập hợp người active có phải là TẬP CON của tập hợp người đã trả lời không
        # Điều này đảm bảo MỌI người đang active đều phải có trong danh sách đã trả lời.
        # Thêm `and active_wallets` để đảm bảo không chạy khi không có người chơi active nào.
        if active_wallets and active_wallets.issubset(answered_wallets):
            print(f"[CHECK_RESULT] Condition met: All active players have answered. Proceeding to show result.")
            
            # Hủy task fallback nếu có
            if room.id in self.active_tasks:
                try:
                    self.active_tasks[room.id].cancel()
                except asyncio.CancelledError:
                    pass # Bỏ qua lỗi nếu task đã bị hủy rồi
                self.active_tasks.pop(room.id, None)

            await self._show_question_result(room.id)
        else:
            print(f"[CHECK_RESULT] Condition NOT met. Waiting for more answers from: {active_wallets - answered_wallets}")
            
    async def _send_game_sync_payload(self, websocket: WebSocket, room_id: str):
        room = await self.room_service.get_room(room_id)
        if not room:
            print(f"[SYNC_ERROR] Room {room_id} not found.")
            return

        current_question_payload = None

        # Chỉ thực hiện logic câu hỏi nếu game đang chạy
        if room.status == GAME_STATUS.IN_PROGRESS:
            # Kiểm tra các điều kiện tiên quyết một cách tường minh
            is_valid_index = room.current_index is not None
            has_started_time = room.current_question_started_at is not None
            current_question = room.current_question

            if is_valid_index and has_started_time and current_question:
                time_per_question = self._get_time_for_question(room, current_question)
                
                # Đảm bảo datetime là "aware" để tính toán chính xác
                started_at_aware = room.current_question_started_at.replace(tzinfo=timezone.utc)
                question_start_time = int(started_at_aware.timestamp() * 1000)
                question_end_time = question_start_time + time_per_question * 1000
                
                now_utc = datetime.now(timezone.utc)
                time_remaining_ms = question_end_time - int(now_utc.timestamp() * 1000)

                print(f"[SYNC_CALC] Start: {started_at_aware.isoformat()}, Now: {now_utc.isoformat()}, Remaining (ms): {time_remaining_ms}")

                if time_remaining_ms > (SEND_ONLY_REAMIN_TIME_IN_SECONDS * 1000):
                    question_config = QUESTION_CONFIG.get(current_question.difficulty, {})
                    client_question = current_question.model_dump(exclude={"correct_answer"})
                    current_question_payload = {
                        "questionIndex": room.current_index,
                        "question": client_question,
                        "timing": {
                            "questionStartAt": question_start_time,
                            "questionEndAt": question_end_time,
                            "timePerQuestion": time_per_question,
                        },
                        "config": question_config,
                    }
                    print("[SYNC_RESULT] Time condition MET. Payload CREATED.")
                else:
                    print("[SYNC_RESULT] Time condition NOT MET. Payload is null.")
            else:
                print(f"[SYNC_RESULT] Pre-condition NOT MET. Index: {is_valid_index}, StartTime: {has_started_time}, QuestionObj: {current_question is not None}. Payload is null.")
        
        # Tạo payload cuối cùng
        sync_payload = {
            "status": room.status,
            "players": self._get_players_for_client(room),
            "roomSettings": {
                "timePerQuestion": room.time_per_question,
                "totalQuestions": room.total_questions,
                "questions": {
                    "easy": room.easy_questions,
                    "medium": room.medium_questions,
                    "hard": room.hard_questions,
                },
            },
            "progress": {
                "current": room.current_index + 1 if room.current_index is not None else 0,
                "total": room.total_questions,
            },
            "currentQuestion": current_question_payload,
            "serverTime": int(time.time() * 1000),
        }
        
        await send_json_safe(websocket, {
            "type": "game_sync",
            "payload": sync_payload
        })

    def _get_players_for_client(self, room: Room) -> List[Dict]:
        """Helper để định dạng danh sách người chơi gửi cho client."""
        player_list = []
        for p in room.players:
            player_list.append({
                "walletId": p.wallet_id,
                "username": p.username,
                "score": p.score,
                "isHost": p.is_host,
                "isReady": p.is_ready,
                "status": p.player_status.value if isinstance(p.player_status, PLAYER_STATUS) else p.player_status,
            })
        return player_list
    
    def _get_time_for_question(self, room: Room, question: Question) -> int:
        if not question:
            return room.time_per_question # Trả về giá trị mặc định nếu không có câu hỏi

        question_config = QUESTION_CONFIG.get(question.difficulty, QUESTION_CONFIG.get(QUESTION_DIFFICULTY.EASY))
        
        # Nếu không có config, trả về giá trị mặc định của phòng
        if not question_config:
            return room.time_per_question

        base_time = room.time_per_question
        
        # Chỉ cộng thêm thời gian nếu không phải độ khó 'easy'
        additional_time = question_config.get("time_per_question", 0) if question.difficulty != QUESTION_DIFFICULTY.EASY else 0
        
        return base_time + additional_time