export interface GameSettings {
  timePerQuestion: number;
  questions: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const TIME_PER_QUESTION = 10;
const EASY_QUESTION_AMOUNT = 5;
const MEDIUM_QUESTION_AMOUNT = 3;
const HARD_QUESTION_AMOUNT = 3;

export const DEFAULT_GAME_SETTINGS = {
  timePerQuestion: TIME_PER_QUESTION,
  questions: {
    easy: EASY_QUESTION_AMOUNT,
    medium: MEDIUM_QUESTION_AMOUNT,
    hard: HARD_QUESTION_AMOUNT,
  },
};
