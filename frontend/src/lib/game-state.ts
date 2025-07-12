"use client";

import { create } from "zustand";
import type { Player, Question, Room, User } from "@/types/schema";
import { DEFAULT_GAME_SETTINGS, GameSettings } from "@/config/GameSettings";
import { GameStatus } from "@/types/GameStatus";

interface GameState {
  currentUser: User | null;
  currentPlayer: Player | null;
  currentRoom: any | null;
  currentQuestion: any | null;
  timeRemaining: number;
  isGameActive: boolean;
  players: Player[];
  questions: Question[];
  startAt: number | null;

  // Game Flow States
  readyCount: number;
  gameSettings: GameSettings;
  gameStatus: GameStatus;
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

  // ✅ NEW: Tie-break States
  isTieBreakActive: boolean;
  tieBreakRound: number;
  isSuddenDeathActive: boolean;
  tieBreakQuestion: any | null;
  tieBreakQuestionEndAt: number | null;
  tieBreakQuestionCountdown: number;
  hasAnsweredTieBreak: boolean;
  selectedTieBreakAnswer: string | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
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
  setReadyCount: (count: number) => void;
  setGameSettings: (gameSettings: GameSettings) => void;
  setGameStatus: (status: GameStatus) => void;
  setQuestionIndex: (index: number) => void;
  setTotalQuestions: (total: number) => void;
  setQuestionEndAt: (endAt: number | null) => void;
  setQuestionCountdown: (countdown: number) => void;
  setHasAnswered: (answered: boolean) => void;
  setSelectedAnswer: (answer: string | null) => void;
  setQuestionResult: (result: any) => void;
  setGameResults: (results: any[]) => void;
  setWinnerWallet: (wallet: string | null) => void;

  // ✅ NEW: Tie-break Actions
  setIsTieBreakActive: (active: boolean) => void;
  setTieBreakRound: (round: number) => void;
  setIsSuddenDeathActive: (active: boolean) => void;
  setTieBreakQuestion: (question: any | null) => void;
  setTieBreakQuestionEndAt: (endAt: number | null) => void;
  setTieBreakQuestionCountdown: (countdown: number) => void;
  setHasAnsweredTieBreak: (answered: boolean) => void;
  setSelectedTieBreakAnswer: (answer: string | null) => void;

  // Reset game state
  resetGameState: () => void;
}

export const useGameState = create<GameState>((set, get) => ({
  currentUser: null,
  currentRoom: null,
  currentQuestion: null,
  currentPlayer: null,
  timeRemaining: 15,
  isGameActive: false,
  players: [],
  questions: [],
  startAt: null,

  // Game Flow States
  readyCount: 0,
  gameSettings: DEFAULT_GAME_SETTINGS,
  gameStatus: GameStatus.WAITING,
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

  // ✅ NEW: Tie-break States
  isTieBreakActive: false,
  tieBreakRound: 1,
  isSuddenDeathActive: false,
  tieBreakQuestion: null,
  tieBreakQuestionEndAt: null,
  tieBreakQuestionCountdown: 0,
  hasAnsweredTieBreak: false,
  selectedTieBreakAnswer: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentPlayer: (player) => {
    const { players, currentUser } = get();
    if (players.length > 0 && currentUser) {
      const currentPlayer = players.find(
        (p) => p.walletId === currentUser?.walletId
      );

      set({ currentPlayer });
    }
  },
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
  setReadyCount: (count) => set({ readyCount: count }),
  setGameSettings: (gameSettings) => set({ gameSettings }),
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

  // ✅ NEW: Tie-break Actions
  setIsTieBreakActive: (active) => set({ isTieBreakActive: active }),
  setTieBreakRound: (round) => set({ tieBreakRound: round }),
  setIsSuddenDeathActive: (active) => set({ isSuddenDeathActive: active }),
  setTieBreakQuestion: (question) => set({ tieBreakQuestion: question }),
  setTieBreakQuestionEndAt: (endAt) => set({ tieBreakQuestionEndAt: endAt }),
  setTieBreakQuestionCountdown: (countdown) =>
    set({ tieBreakQuestionCountdown: countdown }),
  setHasAnsweredTieBreak: (answered) => set({ hasAnsweredTieBreak: answered }),
  setSelectedTieBreakAnswer: (answer) =>
    set({ selectedTieBreakAnswer: answer }),

  // Reset game state
  resetGameState: () => {
    console.log("[ZUSTAND] resetGameState called");
    set({
      readyCount: 0,
      currentPlayer: null,
      players: [],
      currentRoom: null,
      questions: [],
      gameStatus: GameStatus.WAITING,
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
      // ✅ NEW: Reset tie-break states
      isTieBreakActive: false,
      tieBreakRound: 1,
      isSuddenDeathActive: false,
      tieBreakQuestion: null,
      tieBreakQuestionEndAt: null,
      tieBreakQuestionCountdown: 0,
      hasAnsweredTieBreak: false,
      selectedTieBreakAnswer: null,
    });
  },
}));
