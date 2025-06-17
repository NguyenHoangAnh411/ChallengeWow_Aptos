import { create } from "zustand";
import type { User, Room, Question } from "@shared/schema";

interface GameState {
  currentUser: User | null;
  currentRoom: Room | null;
  currentQuestion: Question | null;
  timeRemaining: number;
  isGameActive: boolean;
  players: (User & { status?: string; responseTime?: number })[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setTimeRemaining: (time: number) => void;
  setIsGameActive: (active: boolean) => void;
  setPlayers: (players: (User & { status?: string; responseTime?: number })[]) => void;
  updatePlayerStatus: (playerId: number, status: string, responseTime?: number) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  currentUser: null,
  currentRoom: null,
  currentQuestion: null,
  timeRemaining: 15,
  isGameActive: false,
  players: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsGameActive: (active) => set({ isGameActive: active }),
  setPlayers: (players) => set({ players }),
  
  updatePlayerStatus: (playerId, status, responseTime) => {
    const { players } = get();
    const updatedPlayers = players.map(player => 
      player.id === playerId 
        ? { ...player, status, responseTime }
        : player
    );
    set({ players: updatedPlayers });
  },
}));
