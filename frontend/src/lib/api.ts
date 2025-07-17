// src/lib/api.ts

import { GameSettings } from "@/app/config/GameSettings";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api";

async function fetchData(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Lấy danh sách phòng
export async function fetchRooms(status?: string) {
  let endpoint = "/rooms";
  if (status) {
    endpoint += `?status=${status}`;
  }
  return fetchData(endpoint);
}

// Lấy data phòng
export async function fetchRoomById(roomId: string) {
  return fetchData(`/rooms/${roomId}`);
}

// Lấy data bằng room code
export async function fetchRoomByCode(roomCode: string) {
  return fetchData(`/rooms/by-code/${roomCode}`);
}

// Tham gia phòng đang chơi hiện tại
export async function fetchCurrentRoom(walletId: string) {
  return fetchData(`/current-room?wallet_id=${walletId}`);
}

export async function fetchRoomResults(roomId: string) {
  return fetchData(`/rooms/${roomId}/game-results`);
}

// Tạo phòng mới
export async function createRoom(data: any) {
  return fetchData("/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Tham gia phòng
export async function joinRoom(data: any) {
  return fetchData("/join-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Lấy trạng thái phòng
export async function fetchRoomStatus(roomId: string) {
  return fetchData(`/rooms/${roomId}/status`);
}

// Lấy danh sách người chơi trong phòng
export async function fetchPlayers(roomId: string) {
  return fetchData(`/room/${roomId}/players`);
}

export async function changePlayerStatus(
  roomId: string,
  walletId: string,
  status: string
) {
  return fetchData(`/${roomId}/player/${walletId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function leaveRoom(data: any) {
  return fetchData(`/leave-room`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Lấy câu hỏi ngẫu nhiên
export async function fetchRandomQuestion() {
  return fetchData("/question/random");
}

// Gửi đáp án
export async function submitAnswer(data: any) {
  return fetchData("/submit-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchGameData(roomId: string) {
  return fetchData(`/rooms/${roomId}/results`);
}

export async function updateGameSettings(roomId: string, data: GameSettings) {
  return fetchData(`/rooms/${roomId}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Gửi zk-proof
export async function submitZkProof(data: any) {
  return fetchData("/zk-proof", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Đăng nhập hoặc tạo user bằng ví
export async function loginUser(wallet_id: string, username?: string) {
  return fetchData("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_id, username }),
  });
}

// Lấy thông tin user theo wallet address
export async function fetchUserByWallet(wallet_id: string) {
  return fetchData(`/users/by-wallet/${wallet_id}`);
}

// Cập nhật username cho user
export async function updateUser(
  walletId: string,
  username?: string,
  aptosWallet?: string
) {
  const body: any = { wallet_id: walletId };
  if (username !== undefined) body.username = username;
  if (aptosWallet !== undefined) body.aptos_wallet = aptosWallet;

  return fetchData("/users/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchLeaderboard(limit: number, period: string = "all") {
  return fetchData(`/leaderboard?limit=${limit}&period=${period}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

// Gọi backend để mint hoặc transfer NFT cho winner
export async function awardNFT(to_address: string, token_id?: number) {
  return fetchData("/nft/award", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to_address, token_id }),
  });
}

export async function fetchHistories(
  walletId: string,
  limit: number,
  offset: number,
  status?: string
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (status) {
    params.append("status", status);
  }

  return fetchData(`/history/${walletId}?${params.toString()}`);
}

// Aptos Blockchain API calls
export const aptosApi = {
  // Get network information
  getNetworkInfo: async () => {
    const response = await fetch(`${BASE_URL}/aptos/network`);
    return response.json();
  },

  // Get account balance
  getAccountBalance: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/balance/${address}`);
    return response.json();
  },

  // Get token balance
  getTokenBalance: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/token-balance/${address}`);
    return response.json();
  },

  // Get player data
  getPlayerData: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/player-data/${address}`);
    return response.json();
  },

  // Fund account
  fundAccount: async (address: string, amount?: number) => {
    const url = amount
      ? `${BASE_URL}/aptos/fund/${address}?amount=${amount}`
      : `${BASE_URL}/aptos/fund/${address}`;
    const response = await fetch(url, { method: "POST" });
    return response.json();
  },

  // Get account information
  getAccountInfo: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/account/${address}`);
    return response.json();
  },

  // Get account resources
  getAccountResources: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/account/${address}/resources`);
    return response.json();
  },

  // Get account summary
  getAccountSummary: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/account/${address}/summary`);
    return response.json();
  },

  // Get transaction details
  getTransaction: async (hash: string) => {
    const response = await fetch(`${BASE_URL}/aptos/transaction/${hash}`);
    return response.json();
  },

  // Validate address
  validateAddress: async (address: string) => {
    const response = await fetch(`${BASE_URL}/aptos/validate-address/${address}`);
    return response.json();
  },
};

export const userPostApi = {
  createPost: async (formData: FormData) => {
    const res = await fetch(`${BASE_URL}/posts/create`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Tạo bài đăng thất bại");
    return res.json();
  },

  getPostsByWallet: async (wallet_id: string) => {
    return fetchData(`/posts/user/${wallet_id}`);
  },

  getPostById: async (post_id: string) => {
    return fetchData(`/posts/${post_id}`);
  },

  getAllPosts: async (limit = 20, offset = 0) => {
    return fetchData(`/posts?limit=${limit}&offset=${offset}`);
  },
}
