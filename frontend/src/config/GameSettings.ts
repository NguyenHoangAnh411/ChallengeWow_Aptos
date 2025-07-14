export interface GameQuestions {
  easy: number;
  medium: number;
  hard: number;
}

export interface GameSettings {
  timePerQuestion: number;
  questions: GameQuestions;
}

const TIME_PER_QUESTION = 10;
const EASY_QUESTION_AMOUNT = 5;
const MEDIUM_QUESTION_AMOUNT = 3;
const HARD_QUESTION_AMOUNT = 2;

export const DEFAULT_GAME_SETTINGS = {
  timePerQuestion: TIME_PER_QUESTION,
  questions: {
    easy: EASY_QUESTION_AMOUNT,
    medium: MEDIUM_QUESTION_AMOUNT,
    hard: HARD_QUESTION_AMOUNT,
  },
};
