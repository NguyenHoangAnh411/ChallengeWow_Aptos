import { RoomStatus } from "./RoomStatus";

export interface Room {
  id: string;
  roomCode: string;
  players: Player[];
  status: RoomStatus;
  totalQuestions: number;
  timePerQuestion: number;
  prize: number;
  currentQuestion?: Question | null;
  winnerWalletId?: string | null;
  proof?: ZKProof | null;
  createdAt: Date;
  startTime?: Date | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
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
  correctOptionIndex: number;
  createdAt: string; // ISO 8601 string for datetime
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
