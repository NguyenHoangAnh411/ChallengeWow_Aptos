import { create } from "zustand";

interface GameState {
  currentUser: any | null;
  currentRoom: any | null;
  currentQuestion: any | null;
  timeRemaining: number;
  isGameActive: boolean;
  players: (any & { status?: string; responseTime?: number })[];
  
  // Actions
  setCurrentUser: (user: any | null) => void;
  setCurrentRoom: (room: any | null) => void;
  setCurrentQuestion: (question: any | null) => void;
  setTimeRemaining: (time: number) => void;
  setIsGameActive: (active: boolean) => void;
  setPlayers: (players: (any & { status?: string; responseTime?: number })[]) => void;
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
