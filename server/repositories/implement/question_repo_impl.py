from config.database import supabase
from models.question import Question
from repositories.interfaces.question_repo import IQuestionRepository
import random


class QuestionRepository(IQuestionRepository):
    table = "questions"

    def get_random(self) -> Question | None:
        count_res = (
            supabase.table(QuestionRepository.table)
            .select("id", count="exact")
            .execute()
        )
        total = count_res.count
        if not total:
            return None
        offset = random.randint(0, total - 1)
        res = (
            supabase.table(QuestionRepository.table)
            .select("*")
            .range(offset, offset)
            .execute()
        )

        return Question(**res.data[0]) if res.data else None
