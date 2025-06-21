from datetime import datetime
from typing import Dict, List
from config.database import supabase
from repositories.interfaces.answer_repo import IAnswerRepository
import uuid


class AnswerRepository(IAnswerRepository):
    table = "player_answers"

    def save(
        self,
        room_id: str,
        wallet_id: str,
        question_id: str,
        selected_index: int,
        is_correct: bool,
        time_taken: float,
        timestamp: datetime,
    ) -> None:
        supabase.table(AnswerRepository.table).insert(
            {
                "id": str(uuid.uuid4()),
                "room_id": room_id,
                "wallet_id": wallet_id,
                "question_id": question_id,
                "selected_index": selected_index,
                "is_correct": is_correct,
                "time_taken": time_taken,
                "created_at": timestamp,
            }
        ).execute()

    def get_answers_by_room(self, room_id: str) -> List[Dict]:
        response = (
            supabase.table(AnswerRepository.table)
            .select("*")
            .eq("room_id", room_id)
            .execute()
        )
        return response.data or []

    def get_answers_by_user(self, room_id: str, wallet_id: str) -> List[Dict]:
        response = (
            supabase.table(AnswerRepository.table)
            .select("*")
            .eq("room_id", room_id)
            .eq("wallet_id", wallet_id)
            .execute()
        )
        return response.data or []

    def get_score_by_user(self, room_id: str, wallet_id: str) -> float:
        response = (
            supabase.table(AnswerRepository.table)
            .select("is_correct, time_taken")
            .eq("room_id", room_id)
            .eq("wallet_id", wallet_id)
            .execute()
        )
        answers = response.data or []
        # Ví dụ: 1 điểm nếu đúng + 1 điểm bonus nếu trả lời nhanh
        total_score = 0.0
        for a in answers:
            if a["is_correct"]:
                bonus = max(0, 5 - a["time_taken"])  # max bonus 5s
                total_score += 1 + bonus
        return total_score
