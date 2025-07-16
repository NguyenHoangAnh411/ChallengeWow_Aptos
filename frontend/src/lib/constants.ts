export const MAX_PLAYERS_PER_ROOM = 4;

// WS Message Type
export const LEAVE_ROOM_TYPE = "leave_room";
export const PLAYER_JOINED_TYPE = "player_joined";
export const PLAYER_READY_TYPE = "player_ready";
export const PLAYER_LEFT_TYPE = "player_left";
export const KICK_PLAYER_TYPE = "kick_player";
export const COUNT_DOWN_UPDATE_TYPE = "count_down_update";
export const ROOM_CONFIG_UPDATE_TYPE = "room_config_update";
export const PLAYER_DISCONNECTED_TYPE = "player_disconnected";
export const HOST_TRANSFER_TYPE = "host_transfer";
export const GAME_SYNC_TYPE = "game_sync";
export const PLAYER_RECONNECTED_TYPE = "player_reconnected";

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

// Tie-break Message Types
export const TIE_BREAK_ACTIVATED_TYPE = "tie_break_activated";
export const TIE_BREAK_QUESTION_TYPE = "tie_break_question";
export const TIE_BREAK_ANSWER_SUBMITTED_TYPE = "tie_break_answer_submitted";
export const TIE_BREAK_WINNER_TYPE = "tie_break_winner";
export const TIE_BREAK_NEXT_ROUND_TYPE = "tie_break_next_round";
export const TIE_BREAK_TIMEOUT_TYPE = "tie_break_timeout";
export const TIE_BREAK_CANCELLED_TYPE = "tie_break_cancelled";
export const SUDDEN_DEATH_ACTIVATED_TYPE = "sudden_death_activated";
export const SUDDEN_DEATH_QUESTION_TYPE = "sudden_death_question";
export const SUDDEN_DEATH_TIMEOUT_TYPE = "sudden_death_timeout";

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
  iconUrl: "/olym3-logo.svg", // Đảm bảo đã tải logo này vào public
} as const;

// Solana Devnet Configuration (dummy EVM config for UI dropdown)
export const SOLANA_DEVNET = {
  id: 103,
  name: "Solana Devnet",
  network: "solana-devnet",
  nativeCurrency: {
    decimals: 9,
    name: "SOL",
    symbol: "SOL",
  },
  rpcUrls: {
    default: { http: ["https://api.devnet.solana.com"] },
    public: { http: ["https://api.devnet.solana.com"] },
  },
  blockExplorers: {
    default: {
      name: "Solana Explorer",
      url: "https://explorer.solana.com?cluster=devnet",
    },
  },
  testnet: true,
  iconUrl: "/solana-sol-logo.svg",
} as const;

// Ronin Saigon Configuration (dummy EVM config for UI dropdown)
export const RONIN_SAIGON = {
  id: 2021,
  name: "Ronin Saigon",
  network: "ronin-saigon",
  nativeCurrency: {
    decimals: 18,
    name: "RON",
    symbol: "RON",
  },
  rpcUrls: {
    default: { http: ["https://saigon-testnet.roninchain.com/rpc"] },
    public: { http: ["https://saigon-testnet.roninchain.com/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Ronin Explorer",
      url: "https://saigon-explorer.roninchain.com",
    },
  },
  testnet: true,
  iconUrl: "/ronin-ron-logo.svg",
} as const;

// LISK Testnet Configuration (dummy EVM config for UI dropdown)
export const LISK_TESTNET = {
  id: 113,
  name: "Lisk Testnet",
  network: "lisk-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "LSK",
    symbol: "LSK",
  },
  rpcUrls: {
    default: { http: ["https://testnet-service.lisk.com/rpc"] },
    public: { http: ["https://testnet-service.lisk.com/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Lisk Explorer",
      url: "https://testnet-explorer.lisk.com",
    },
  },
  testnet: true,
  iconUrl: "/lisk-lsk-logo.svg",
} as const;

// Viction Testnet Configuration (dummy EVM config for UI dropdown)
export const VICTION_TESTNET = {
  id: 88,
  name: "Viction Testnet",
  network: "viction-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "VIC",
    symbol: "VIC",
  },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.viction.xyz"] },
    public: { http: ["https://rpc-testnet.viction.xyz"] },
  },
  blockExplorers: {
    default: { name: "Viction Explorer", url: "https://explorer.viction.xyz" },
  },
  testnet: true,
  iconUrl: "https://viction.xyz/favicon.ico",
} as const;

// Contract addresses (if needed for your game)
export const CONTRACT_ADDRESSES = {
  GAME_CONTRACT: "0x5a61eCfe03f01Ea1928f8adCe278B201b6a94Ab1",
  OLYM_TOKEN: "0x93Aa93c57f2c4B3265e34eb1610a3B2E17eD4Aac",
  NFT_CONTRACT: "0x7aae365deb5704842e9db405bE4f531d004e0011",
} as const;
