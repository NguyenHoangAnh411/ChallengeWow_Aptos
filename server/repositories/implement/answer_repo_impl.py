from config.database import supabase
from repositories.interfaces.answer_repo import IAnswerRepository
import uuid

class AnswerRepository(IAnswerRepository):
    table = "player_answers"
    def save(self, room_id: str, player_id: str, question_id: str, answer: str, score: float, timestamp) -> None:
        data = {
            "id": str(uuid.uuid4()),
            "room_id": room_id,
            "player_id": player_id,
            "question_id": question_id,
            "answer": answer,
            "score": score,
            "submitted_at": timestamp.isoformat()
        }
        supabase.table(AnswerRepository.table).insert(data).execute()

