from collections import defaultdict
from typing import Any, Dict, List
from models.answer import Answer
from repositories.interfaces.answer_repo import IAnswerRepository
from models.player_result import PlayerResult
from repositories.implement.user_repo_impl import UserRepository

class AnswerService:
    def __init__(self, answer_repo: IAnswerRepository, user_repo: UserRepository):
        self.user_repo = user_repo
        self.answer_repo = answer_repo

    async def save_player_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

    async def save_answer(self, answer: Answer):
        await self.answer_repo.save(answer)

    async def get_answers_by_wallet_id(self, room_id: str, wallet_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_wallet_id(room_id, wallet_id)

    async def get_answers_by_room_and_question(self, room_id: str, question_index: int) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question(room_id, question_index)

    async def get_answers_by_room_and_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        return await self.answer_repo.get_answers_by_room_and_question_id(room_id, question_id)

    async def get_answer_count_by_room_and_question(self, room_id: str, question_index: int) -> int:
        """Get the count of answers for a specific question in a room"""
        answers = await self.answer_repo.get_answers_by_room_and_question(room_id, question_index)
        return len(answers)

    async def get_correct_answers_by_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        """Get all correct answers for a specific question in a room, ordered by submission time"""
        answers = await self.answer_repo.get_answers_by_room_and_question_id(room_id, question_id)
        # Filter correct answers and sort by submission time
        correct_answers = [answer for answer in answers if answer.is_correct]
        correct_answers.sort(key=lambda x: x.submitted_at if x.submitted_at else 0)
        return correct_answers
    
    async def get_game_results(self, room_id: str) -> List[Dict[str, Any]]:
        """
        Tổng hợp kết quả cuối cùng của room: điểm số, câu trả lời, username từng player.
        """

        # 1. Lấy tất cả answers của room
        all_answers: List[Answer] = await self.answer_repo.get_answers_by_room(room_id)

        if not all_answers:
            return []

        # 2. Gom nhóm theo player
        player_answers_map: Dict[str, List[Answer]] = defaultdict(list)
        for answer in all_answers:
            player_answers_map[answer.wallet_id].append(answer)

        # 3. Tính kết quả cho từng player
        results: List[PlayerResult] = []
        for wallet_id, answers in player_answers_map.items():
            user = await self.user_repo.get_by_wallet(wallet_id)
            username = user.username if user else "Unknown"
            total_score = sum(a.score for a in answers)
            answer_list = [
                {
                    "question_id": a.question_id,
                    "selected_option": a.answer,
                    "score": a.score,
                    "response_time": a.response_time,
                    "is_correct": a.is_correct,
                    "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None
                }
                for a in answers
            ]

            results.append({
                "wallet": wallet_id,
                "oath": username,
                "score": total_score,
                "answers": answer_list
            })

        return results
