"use client";

import { create } from "zustand";
import type { User } from "@/types/schema";

interface GameState {
  currentUser: User | null;
  currentRoom: any | null;
  currentQuestion: any | null;
  timeRemaining: number;
  isGameActive: boolean;
  players: (any & { status?: string; responseTime?: number })[];
  questions: any[];
  startAt: number | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentRoom: (room: any | null) => void;
  setCurrentQuestion: (question: any | null) => void;
  setTimeRemaining: (time: number) => void;
  setIsGameActive: (active: boolean) => void;
  setPlayers: (
    players: (any & { status?: string; responseTime?: number })[]
  ) => void;
  setQuestions: (questions: any[]) => void;
  setStartAt: (startAt: number | null) => void;
  updatePlayerStatus: (
    playerId: number,
    status: string,
    responseTime?: number
  ) => void;
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
    const updatedPlayers = players.map((player) =>
      player.id === playerId ? { ...player, status, responseTime } : player
    );
    set({ players: updatedPlayers });
  },
}));
