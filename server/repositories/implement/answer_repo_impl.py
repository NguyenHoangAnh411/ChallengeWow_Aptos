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
            # Convert datetime fields to ISO format strings
            if data.get("created_at"):
                data["created_at"] = data["created_at"].isoformat()
            if data.get("submitted_at"):
                data["submitted_at"] = data["submitted_at"].isoformat()
            
            # Only save fields that exist in the database schema
            db_fields = {
                "id": data.get("id"),
                "question_id": data.get("question_id"),
                "wallet_id": data.get("wallet_id"),
                "room_id": data.get("room_id"),
                "answer": data.get("answer"),
                "is_correct": data.get("is_correct"),
                "score": data.get("score"),
                "response_time": data.get("response_time"),
                "created_at": data.get("created_at")
            }
            
            # Remove None values
            db_fields = {k: v for k, v in db_fields.items() if v is not None}
            
            await self.supabase.table(self.table).insert(db_fields).execute()
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
            # Since the database doesn't have question_index column, 
            # we'll get all answers for the room and filter by question_id
            # For now, we'll return all answers for the room since we can't filter by question_index
            response = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .execute()
            )
            return [Answer(**item) for item in (response.data or [])]
        except Exception as e:
            print(f"Error fetching answers for question {question_index} in room {room_id}: {e}")
            return []

    async def get_answers_by_room_and_question_id(self, room_id: str, question_id: str) -> List[Answer]:
        """Get answers by room_id and question_id"""
        try:
            response = await (
                self.supabase.table(self.table)
                .select("*")
                .eq("room_id", room_id)
                .eq("question_id", question_id)
                .execute()
            )
            return [Answer(**item) for item in (response.data or [])]
        except Exception as e:
            print(f"Error fetching answers for question_id {question_id} in room {room_id}: {e}")
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
