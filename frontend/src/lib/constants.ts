export const MAX_PLAYERS_PER_ROOM = 4;

// WS Message Type
export const LEAVE_ROOM_TYPE = "leave_room";
export const PLAYER_JOINED_TYPE = "player_joined";
export const PLAYER_READY_TYPE = "player_ready";
export const PLAYER_LEFT_TYPE = "player_left";
export const KICK_PLAYER_TYPE = "kick_player";
export const COUNT_DOWN_UPDATE = "count_down_update";
export const ROOM_CONFIG_UPDATE = "room_config_update";

// Game Flow Message Types
export const GAME_STARTED_TYPE = "game_started";
export const NEXT_QUESTION_TYPE = "next_question";
export const SUBMIT_ANSWER_TYPE = "submit_answer";
export const ANSWER_SUBMITTED_TYPE = "answer_submitted";
export const QUESTION_RESULT_TYPE = "question_result";
export const GAME_END_TYPE = "game_ended";
export const START_GAME_TYPE = "start_game";
export const CHAT_TYPE = "chat";
export const KICKED_TYPE = "kicked";
export const PING_TYPE = "ping";
export const PONG_TYPE = "pong";

// WS Alive-time
export const RECONNECT_WS = 25000;

// Olym3 Testnet Configuration
export const OLYM3_TESTNET = {
  id: 256000, // Chain ID for Olym3 Testnet
  name: "Olym3 Testnet",
  network: "olym3-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "OLYM",
    symbol: "OLYM",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc1.olym3.xyz"],
    },
    public: {
      http: ["https://rpc1.olym3.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Olym3 Explorer",
      url: "https://explorer.olym3.xyz",
    },
  },
  testnet: true,
} as const;

// Contract addresses (if needed for your game)
export const CONTRACT_ADDRESSES = {
  GAME_CONTRACT: "0x5a61eCfe03f01Ea1928f8adCe278B201b6a94Ab1",
  OLYM_TOKEN: "0x93Aa93c57f2c4B3265e34eb1610a3B2E17eD4Aac",
  NFT_CONTRACT: "0x7aae365deb5704842e9db405bE4f531d004e0011",
} as const;
