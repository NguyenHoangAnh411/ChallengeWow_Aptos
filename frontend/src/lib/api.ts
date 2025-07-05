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
export async function fetchRooms() {
  return fetchData("/rooms");
}

// Lấy data phòng
export async function fetchRoomById(roomId: string) {
  return fetchData(`/rooms/${roomId}`);
}

// Lấy data bằng room code
export async function fetchRoomByCode(roomCode: string) {
  alert("room : " + roomCode);
  return fetchData(`/rooms/by-code/${roomCode}`);
}

// Tham gia phòng đang chơi hiện tại
export async function fetchCurrentRoom(walletId: string) {
  return fetchData(`/current-room?wallet_id=${walletId}`);
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
export async function updateUser(walletId: string, username: string) {
  return fetchData("/users/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_id: walletId, username }),
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

// Usage example (in your component or store):
// const rooms = await fetchRooms();
// const roomStatus = await fetchRoomStatus('room-id');
// const players = await fetchPlayers('room-id');
// const randomQuestion = await fetchRandomQuestion();
// const answerSubmission = await submitAnswer({ questionId: 'question-id', answer: 'answer' });
// const zkProofSubmission = await submitZkProof({ proof: 'zk-proof' });
