# tests/test_game_service.py
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import asyncio
from datetime import datetime, timezone
from models.room import Room
from models.player import Player
from enums.game_status import GAME_STATUS
from services.game_service import GameService

class FakeRoomService:
    def __init__(self):
        self.saved_rooms = []

    def save_room(self, room):
        self.saved_rooms.append(room)

    def get_room(self, room_id):
        return next((r for r in self.saved_rooms if r.id == room_id), None)

class FakeQuestionService:
    def __init__(self):
        self.counter = 0

    def get_random_question(self):
        self.counter += 1
        return {
            "id": f"q{self.counter}",
            "question": f"Sample question {self.counter}",
            "correct_answer": "42",
            "options": ["1", "2", "42", "99"]
        }

class FakeZkProofService:
    def __init__(self):
        self.proofs = []

    def store_proof(self, room_id, winner_wallet_id, proof_url, scores):
        self.proofs.append((room_id, winner_wallet_id, proof_url, scores))

@pytest.mark.asyncio
async def test_full_game_flow():
    # Arrange
    room_service = FakeRoomService()
    question_service = FakeQuestionService()
    zkproof_service = FakeZkProofService()
    game_service = GameService(room_service, question_service, zkproof_service)

    p1 = Player(wallet_id="w1", username="Alice")
    p2 = Player(wallet_id="w2", username="Bob")

    room = Room(id="room123", players=[p1, p2], status=GAME_STATUS.WAITING)

    # Act
    await game_service.start_game(room)

    # Assert
    assert room.status == GAME_STATUS.FINISHED
    assert len(room.players[0].answers) == 5
    assert zkproof_service.proofs  # should contain 1 proof
    assert room_service.saved_rooms[-1].winner_wallet_id in [p1.id, p2.id]


def test_calculate_score():
    from datetime import timedelta
    game_service = GameService(None, None, None)

    now = datetime.now(timezone.utc)
    early = now + timedelta(seconds=5)
    late = now + timedelta(seconds=25)

    assert game_service.calculate_score(early, now) == 10
    assert game_service.calculate_score(late, now) == 0


def test_generate_fake_proof():
    game_service = GameService(None, None, None)
    room = Room(id="testroom")
    room.players = [Player(wallet_id="1", username="A", score=10)]
    room.winner_wallet_id = "winner-id"

    proof = game_service.generate_fake_proof(room)
    assert isinstance(proof, str)
    assert len(proof) == 64  # sha256 hash length
