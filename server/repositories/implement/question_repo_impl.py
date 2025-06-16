from config.database import supabase
from repositories.interfaces.question_repo import IQuestionRepository
import random

class QuestionRepository(IQuestionRepository):
    table = "quiz_questions"
    
    def get_random(self) -> dict | None:
        count_res = supabase.table(QuestionRepository.table).select("id", count="exact").execute()
        total = count_res.count
        if not total:
            return None
        offset = random.randint(0, total - 1)
        res = supabase.table(QuestionRepository.table).select("*").range(offset, offset).execute()
        return res.data[0] if res.data else None
