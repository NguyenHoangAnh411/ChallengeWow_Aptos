export interface Room {
  id: number;
  roomCode: string;
  hostId: number;
  maxPlayers: number;
  currentPlayers: number;
  prize: number;
  duration: number;
  status: 'waiting' | 'in_progress' | 'completed';
  players: User[];
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  walletAddress?: string;
  totalScore: number;
  gamesWon: number;
  rank: number;
  createdAt: Date;
  status?: 'thinking' | 'answered' | 'timeout';
  responseTime?: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
} 