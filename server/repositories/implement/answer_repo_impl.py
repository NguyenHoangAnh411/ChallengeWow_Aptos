from typing import List

from supabase import AsyncClient
from models.answer import Answer
from repositories.interfaces.answer_repo import IAnswerRepository
class AnswerRepository(IAnswerRepository):
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase
        self.table = "answers"

    async def save(self, answer: Answer) -> None:
        try:
            data = answer.model_dump()
            data["created_at"] = answer.created_at.isoformat()
            await self.supabase.table(self.table).insert(data).execute()
        except Exception as e:
            print(f"Error saving answer: {e}")

    async def get_answers_by_room(self, room_id: str) -> List[Answer]:
        try:
            response = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .execute()
            )
            return [Answer(**item) for item in (response.data or [])]
        except Exception as e:
            print(f"Error fetching answers for room {room_id}: {e}")
            return []

    async def get_answers_by_wallet_id(self, room_id: str, wallet_id: str) -> List[Answer]:
        try:
            response = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .eq("wallet_id", wallet_id)
                .execute()
            )
            return [Answer(**item) for item in (response.data or [])]
        except Exception as e:
            print(f"Error fetching answers for wallet {wallet_id} in room {room_id}: {e}")
            return []

    async def get_answers_by_room_and_question(self, room_id: str, question_index: int) -> List[Answer]:
        try:
            # Lấy tất cả answers trong room, sau đó filter theo question_index
            response = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .execute()
            )
            answers = [Answer(**item) for item in (response.data or [])]
            
            # Filter theo question_index (nếu có field này trong Answer model)
            # Hoặc có thể cần thêm logic khác để xác định câu hỏi hiện tại
            return answers
        except Exception as e:
            print(f"Error fetching answers for question {question_index} in room {room_id}: {e}")
            return []

    async def get_score_by_user(self, room_id: str, wallet_id: str) -> float:
        try:
            response = await (
                self.supabase.table(self.table)
                .select("is_correct, response_time")
                .eq("room_id", room_id)
                .eq("wallet_id", wallet_id)
                .execute()
            )
            answers = response.data or []
            total_score = 0.0
            for a in answers:
                if a["is_correct"]:
                    bonus = max(0, 5 - a["response_time"])  # Max bonus: 5s
                    total_score += 1 + bonus
            return total_score
        except Exception as e:
            print(f"Error calculating score for user {wallet_id} in room {room_id}: {e}")
            return 0.0
