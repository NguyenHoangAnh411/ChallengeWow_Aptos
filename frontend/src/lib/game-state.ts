"use client";

import { create } from "zustand";
import type { Player, Question, Room, User } from "@/types/schema";

interface GameState {
  currentUser: User | null;
  currentRoom: any | null;
  currentQuestion: any | null;
  timeRemaining: number;
  isGameActive: boolean;
  players: Player[];
  questions: Question[];
  startAt: number | null;

  // Game Flow States
  gameStatus:
    | "waiting"
    | "countdown"
    | "in_progress"
    | "question_result"
    | "finished";
  questionIndex: number;
  totalQuestions: number;
  questionEndAt: number | null;
  questionCountdown: number;
  hasAnswered: boolean;
  selectedAnswer: string | null;

  // Question Result State
  questionResult: {
    questionIndex: number;
    correctAnswer: string;
    explanation?: string;
    answerStats: Record<string, number>;
    leaderboard: Array<{
      walletId: string;
      username: string;
      score: number;
      rank: number;
      rankChange?: number;
      scoreChange?: number;
    }>;
    totalPlayers?: number;
    options?: string[];
    totalResponses?: number;
  } | null;

  // Game Results
  gameResults: any[];
  winnerWallet: string | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setTimeRemaining: (time: number) => void;
  setIsGameActive: (active: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setQuestions: (questions: Question[]) => void;
  setStartAt: (startAt: number | null) => void;
  updatePlayerStatus: (
    playerId: string,
    status: string,
    responseTime?: number
  ) => void;

  // Game Flow Actions
  setGameStatus: (
    status:
      | "waiting"
      | "countdown"
      | "in_progress"
      | "question_result"
      | "finished"
  ) => void;
  setQuestionIndex: (index: number) => void;
  setTotalQuestions: (total: number) => void;
  setQuestionEndAt: (endAt: number | null) => void;
  setQuestionCountdown: (countdown: number) => void;
  setHasAnswered: (answered: boolean) => void;
  setSelectedAnswer: (answer: string | null) => void;
  setQuestionResult: (result: any) => void;
  setGameResults: (results: any[]) => void;
  setWinnerWallet: (wallet: string | null) => void;

  // Reset game state
  resetGameState: () => void;
}

export const useGameState = create<GameState>((set, get) => ({
  currentUser: null,
  currentRoom: null,
  currentQuestion: null,
  timeRemaining: 15,
  isGameActive: false,
  players: [],
  questions: [],
  startAt: null,

  // Game Flow States
  gameStatus: "waiting",
  questionIndex: 0,
  totalQuestions: 0,
  questionEndAt: null,
  questionCountdown: 0,
  hasAnswered: false,
  selectedAnswer: null,

  // Question Result State
  questionResult: null,

  // Game Results
  gameResults: [],
  winnerWallet: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentQuestion: (question) => {
    console.log("[ZUSTAND] setCurrentQuestion called", question);
    set({ currentQuestion: question });
  },
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsGameActive: (active) => set({ isGameActive: active }),
  setPlayers: (players) => set({ players }),
  setQuestions: (questions) => set({ questions }),
  setStartAt: (startAt) => set({ startAt }),

  updatePlayerStatus: (playerId, status, responseTime) => {
    const { players } = get();
    const updatedPlayers: Player[] = players.filter((player: Player) =>
      player.walletId === playerId
        ? { ...player, status, responseTime }
        : player
    );
    set({ players: updatedPlayers });
  },

  // Game Flow Actions
  setGameStatus: (status) => set({ gameStatus: status }),
  setQuestionIndex: (index) => set({ questionIndex: index }),
  setTotalQuestions: (total) => set({ totalQuestions: total }),
  setQuestionEndAt: (endAt) => set({ questionEndAt: endAt }),
  setQuestionCountdown: (countdown) => set({ questionCountdown: countdown }),
  setHasAnswered: (answered) => set({ hasAnswered: answered }),
  setSelectedAnswer: (answer) => set({ selectedAnswer: answer }),
  setQuestionResult: (result) => set({ questionResult: result }),
  setGameResults: (results) => set({ gameResults: results }),
  setWinnerWallet: (wallet) => set({ winnerWallet: wallet }),

  // Reset game state
  resetGameState: () =>
    set({
      gameStatus: "waiting",
      questionIndex: 0,
      totalQuestions: 0,
      questionEndAt: null,
      questionCountdown: 0,
      hasAnswered: false,
      selectedAnswer: null,
      questionResult: null,
      gameResults: [],
      winnerWallet: null,
      currentQuestion: null,
      isGameActive: false,
    }),
}));
