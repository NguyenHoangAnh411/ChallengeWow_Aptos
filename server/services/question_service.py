from repositories.interfaces.question_repo import IQuestionRepository

class QuestionService:
    def __init__(self, question_repo: IQuestionRepository):
        self.question_repo = question_repo

    def get_random_question(self):
        return self.question_repo.get_random()

