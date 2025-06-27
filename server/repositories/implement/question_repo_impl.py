import random
from typing import List, Optional
from supabase import AsyncClient
from enums.question_difficulty import QUESTION_DIFFICULTY
from models.question import Question
from repositories.interfaces.question_repo import IQuestionRepository

class QuestionRepository(IQuestionRepository):
    def __init__(self, supabase: AsyncClient):
        self.supabase = supabase
        self.table = "questions"

    async def get_random(self) -> Optional[Question]:
        try:
            count_res = await (
                self.supabase
                .table(self.table)
                .select("id", count="exact")
                .execute()
            )
            total = count_res.count
            if not total or total == 0:
                return None

            offset = random.randint(0, total - 1)

            res = await (
                self.supabase
                .table(self.table)
                .select("*")
                .range(offset, offset)  # get one random row
                .execute()
            )

            return Question(**res.data[0]) if res.data else None
        except Exception as e:
            print(f"Error fetching random question: {e}")
            return None

    async def get_random_by_difficulty(self, difficulty: QUESTION_DIFFICULTY, limit: int = 10) -> List[Question]:
        try:
            res = await (
                self.supabase
                .table(self.table)
                .select("*")
                .eq("difficulty", difficulty.value)
                .execute()
            )
            questions = res.data or []
            if len(questions) <= limit:
                return [Question(**q) for q in questions]
            return [Question(**q) for q in random.sample(questions, limit)]
        except Exception as e:
            print(f"Error fetching questions by difficulty '{difficulty}': {e}")
            return []
