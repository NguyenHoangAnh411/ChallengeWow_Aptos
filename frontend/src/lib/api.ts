// src/lib/api.ts

const BASE_URL = "http://localhost:9000/api"; // Sửa lại nếu backend chạy port khác

async function fetchData(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Lấy danh sách phòng
export async function fetchRooms() {
  return fetchData('/rooms');
}

// Tạo phòng mới
export async function createRoom(data: any) {
  return fetchData('/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Tham gia phòng
export async function joinRoom(data: any) {
  return fetchData('/join-room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Lấy trạng thái phòng
export async function fetchRoomStatus(roomId: string) {
  return fetchData(`/rooms/${roomId}`);
}

// Lấy danh sách người chơi trong phòng
export async function fetchPlayers(roomId: string) {
  return fetchData(`/room/${roomId}/players`);
}

// Lấy câu hỏi ngẫu nhiên
export async function fetchRandomQuestion() {
  return fetchData('/question/random');
}

// Gửi đáp án
export async function submitAnswer(data: any) {
  return fetchData('/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Gửi zk-proof
export async function submitZkProof(data: any) {
  return fetchData('/zk-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Đăng nhập hoặc tạo user bằng ví
export async function loginUser(wallet_address: string, username?: string) {
  return fetchData('/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address, username }),
  });
}

// Lấy thông tin user theo wallet address
export async function fetchUserByWallet(wallet_address: string) {
  return fetchData(`/users/by-wallet/${wallet_address}`);
}

// Cập nhật username cho user
export async function updateUser(walletAddress: string, username: string) {
  return fetchData('/users/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress, username }),
  });
}

// Usage example (in your component or store):
// const rooms = await fetchRooms();
// const roomStatus = await fetchRoomStatus('room-id');
// const players = await fetchPlayers('room-id');
// const randomQuestion = await fetchRandomQuestion();
// const answerSubmission = await submitAnswer({ questionId: 'question-id', answer: 'answer' });
// const zkProofSubmission = await submitZkProof({ proof: 'zk-proof' }); 