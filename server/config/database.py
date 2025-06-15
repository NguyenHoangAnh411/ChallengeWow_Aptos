from supabase import create_client
import os
from dotenv import load_dotenv
import random

load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv("SUPABASE_URL", "your-supabase-url"),
    os.getenv("SUPABASE_KEY", "your-supabase-key")
)

# In-memory storage for rooms (in production, this should be in a database)
rooms = {}

async def get_random_question():
    """Get a random question from Supabase"""
    try:
        # In a real implementation, this would query Supabase
        # For now, return a mock question
        return {
            "id": random.randint(1, 1000),
            "question": "What is the capital of France?",
            "correct_answer": "Paris",
            "options": ["London", "Paris", "Berlin", "Madrid"]
        }
    except Exception as e:
        print(f"Error fetching question: {e}")
        return None

async def save_game_result(room_id: str, winner: str, proof: str, scores: list):
    """Save game result to Supabase"""
    try:
        # In a real implementation, this would save to Supabase
        # For now, just print the result
        print(f"Game result saved for room {room_id}")
        print(f"Winner: {winner}")
        print(f"Proof: {proof}")
        print(f"Scores: {scores}")
        return True
    except Exception as e:
        print(f"Error saving game result: {e}")
        return False

def get_room(room_id: str):
    """Get room by ID"""
    return rooms.get(room_id)

def save_room(room):
    """Save room to in-memory storage"""
    rooms[room.id] = room
    return room 