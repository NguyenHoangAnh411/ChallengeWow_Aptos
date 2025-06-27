import { RoomStatus } from "./RoomStatus";
export interface Room {
  id: string;
  roomCode: string;
  players: Player[];
  status: RoomStatus;
  totalQuestions: number;
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
  timePerQuestion: number;
  prize: number;
  currentQuestion?: Question | null;
  winnerWalletId?: string | null;
  proof?: ZKProof | null;
  createdAt: Date;
  startedAt: number | null;
  endedAt?: number | null;
  countdownDuration: number;
}

export interface User {
  walletId: string;
  username?: string | null;
  totalScore: number;
  gamesWon: number;
  rank: number;
  createdAt?: string;
}

export interface Player {
  walletId: string;
  status: "online" | "offline";
  username: string;
  score: number;
  joinedAt: string; // ISO 8601 string for datetime
  isWinner: boolean;
  answers: Answer[];

  gamesWon: number;
  rank: number;
  responseTime: number;
  isReady: boolean;
  isHost: boolean;
  character: string;
  level: number;
}

export interface Question {
  id: string;
  content: string;
  options: string[];
}

export interface QuestionPayload {
  questionIndex: number;
  question: Question;
  timing: {
    questionStartAt: number; // timestamp (ms)
    questionEndAt: number; // timestamp (ms)
    timePerQuestion: number; // tính theo giây
  };
  config: {
    shuffleAnswers: boolean;
    allowSkip?: boolean;
    [key: string]: any; // nếu có thêm config khác
  };
  progress: {
    current: number; // 1-based index: ví dụ 3/10
    total: number;
  };
}

export interface Answer {
  id: string;
  questionId: string;
  walletId: string;
  roomId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
  createdAt: string; // ISO 8601 string for datetime
}

export interface ZKProof {
  id: string;
  roomId: string;
  score: number;
  winnerWalletId: string;
  proofUrl: string;
  onchainTxHash: string;
  timestamp: Date;
}

export interface GameResult {
  wallet: string;
  oath: string;
  score: number;
}

export interface LeaderboardEntry {
  walletId: string;
  username: string;
  totalScore: number;
  gamesWon: number;
  rank: string;
}
