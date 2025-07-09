from enums.question_difficulty import QUESTION_DIFFICULTY
from repositories.interfaces.question_repo import IQuestionRepository
class QuestionService:
    def __init__(self, question_repo: IQuestionRepository):
        self.question_repo = question_repo

    async def get_random_question(self):
        return await self.question_repo.get_random()

    async def get_random_question_by_difficulty(self, difficulty: QUESTION_DIFFICULTY):
        """Get a single random question by difficulty"""
        questions = await self.question_repo.get_random_by_difficulty(difficulty, 1)
        return questions[0] if questions else None

    async def get_random_questions_by_difficulty(self, difficulty: QUESTION_DIFFICULTY, limit: int):
        return await self.question_repo.get_random_by_difficulty(difficulty, limit)
