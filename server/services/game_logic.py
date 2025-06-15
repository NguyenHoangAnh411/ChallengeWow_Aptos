import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
import json
import hashlib

from models.room import Room
from models.player import Player
from config.database import get_random_question, save_game_result

async def start_countdown(room: Room):
    """Start 3-minute countdown for room"""
    room.status = "counting_down"
    await asyncio.sleep(180)  # 3 minutes
    if len(room.players) >= 2:
        await start_game(room)
    else:
        room.status = "waiting"

async def start_game(room: Room):
    """Start the game with questions"""
    room.status = "in_progress"
    room.start_time = datetime.utcnow()
    
    # Simulate 5 questions
    for _ in range(5):
        question = await get_random_question()
        room.current_question = question
        
        # Wait for 15 seconds for answers
        await asyncio.sleep(15)
        
        # Process answers and update scores
        for player in room.players:
            if not any(a.get("question_id") == question["id"] for a in player.answers):
                player.answers.append({
                    "question_id": question["id"],
                    "answer": None,
                    "score": 0
                })
    
    # End game and determine winner
    await end_game(room)

async def end_game(room: Room):
    """End the game and determine winner"""
    room.status = "finished"
    
    # Find winner (player with highest score)
    winner = max(room.players, key=lambda p: p.score)
    room.winner = winner.id
    
    # Generate fake zk-SNARK proof
    proof = generate_fake_proof(room)
    room.proof = proof
    
    # Save results
    final_scores = [{"player_id": p.id, "username": p.username, "score": p.score} 
                   for p in room.players]
    
    await save_game_result(
        room.id,
        winner.id,
        proof,
        final_scores
    )

def generate_fake_proof(room: Room) -> str:
    """Generate a fake zk-SNARK proof"""
    # In a real implementation, this would generate an actual zk-SNARK proof
    data = {
        "room_id": room.id,
        "winner": room.winner,
        "timestamp": datetime.utcnow().isoformat(),
        "scores": [{"player_id": p.id, "score": p.score} for p in room.players]
    }
    return hashlib.sha256(json.dumps(data).encode()).hexdigest()

def calculate_score(answer_time: datetime, question_time: datetime) -> int:
    """Calculate score based on answer time"""
    time_diff = (answer_time - question_time).total_seconds()
    if time_diff <= 15:
        return max(0, 15 - int(time_diff))
    return 0 