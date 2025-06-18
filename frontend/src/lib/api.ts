// src/lib/api.ts

// Example: Fetch data from an API endpoint
export async function fetchData(endpoint: string) {
  // Replace BASE_URL with your actual API base URL
  const BASE_URL = "https://your-api-url.com";
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Fetch all users
export async function fetchUsers() {
  return fetchData('/users');
}

// Fetch all rooms
export async function fetchRooms() {
  return fetchData('/rooms');
}

// Fetch all questions
export async function fetchQuestions() {
  return fetchData('/questions');
}

// Usage example (in your component or store):
// const users = await fetchUsers();
// const rooms = await fetchRooms();
// const questions = await fetchQuestions(); 