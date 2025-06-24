from fastapi import HTTPException
from enums.game_status import GAME_STATUS
from models.room import Room
from models.answer import Answer
from services.answer_service import AnswerService
from services.game_service import GameService
from datetime import datetime

from services.room_service import RoomService


class AnswerController:
    def __init__(self, answer_service: AnswerService, room_service: RoomService, game_service: GameService):
        self.answer_service = answer_service
        self.room_service = room_service
        self.game_service = game_service

    def submit_answer(
        self,
        room_id: str,
        wallet_id: str,
        question_id: str,
        answer: str,
        timestamp: datetime,
    ):
        try:
            room: Room = self.room_service.get_room(room_id)
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")

            if room.status != GAME_STATUS.IN_PROGRESS:
                raise HTTPException(status_code=400, detail="Game not in progress")

            question = room.current_question
            if not question or question.id != question_id:
                raise HTTPException(status_code=400, detail="Invalid question")

            normalized_answer = answer.lower().strip()
            normalized_options = [opt.strip().lower() for opt in question.options]
            selected_index = normalized_options.index(normalized_answer)

            response_time = (timestamp - room.start_time).total_seconds()
            is_correct = normalized_answer == question.correct_answer
            score = self.game_service.calculate_score(is_correct, response_time, question)

            player_answer = Answer(
                room_id=room_id,
                wallet_id=wallet_id,
                question_id=question_id,
                answer=answer,
                is_correct=is_correct,
                score=score,
                response_time=response_time
            )
            
            self.answer_service.save_player_answer(player_answer)
            return {"success": True, "score": score}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
