from fastapi import HTTPException
from enums.game_status import GAME_STATUS
from models.room import Room
from models.answer import Answer
from services.answer_service import AnswerService
from services.game_service import GameService
from services.tie_break_service import TieBreakService
from datetime import datetime

from services.room_service import RoomService


class AnswerController:
    def __init__(
        self, 
        answer_service: AnswerService, 
        room_service: RoomService, 
        game_service: GameService,
        tie_break_service: TieBreakService
    ):
        self.answer_service = answer_service
        self.room_service = room_service
        self.game_service = game_service
        self.tie_break_service = tie_break_service

    async def submit_answer(
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

            # Handle tie-break answers
            if room.status == GAME_STATUS.TIE_BREAK:
                return await self._handle_tie_break_answer(room, wallet_id, question_id, answer, timestamp)
            
            # Handle sudden death answers
            if room.status == GAME_STATUS.SUDDEN_DEATH:
                return await self._handle_sudden_death_answer(room, wallet_id, question_id, answer, timestamp)

            # Handle regular game answers
            if room.status != GAME_STATUS.IN_PROGRESS:
                raise HTTPException(status_code=400, detail="Game not in progress")

            question = room.current_question
            if not question or question.id != question_id:
                raise HTTPException(status_code=400, detail="Invalid question")

            normalized_answer = answer.lower().strip()
            normalized_options = [opt.strip().lower() for opt in question.options]
            selected_index = normalized_options.index(normalized_answer)

            response_time = (timestamp - room.started_at).total_seconds()
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
            
            await self.answer_service.save_player_answer(player_answer)
            return {"success": True, "score": score}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def _handle_tie_break_answer(
        self, 
        room: Room, 
        wallet_id: str, 
        question_id: str, 
        answer: str, 
        timestamp: datetime
    ):
        """Handle answer submission during tie-break"""
        try:
            room, result = await self.tie_break_service.submit_tie_break_answer(
                room, wallet_id, answer, question_id
            )
            
            return {
                "success": True,
                "tie_break_result": result,
                "status": result.get("status"),
                "message": result.get("message")
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Tie-break error: {str(e)}")

    async def _handle_sudden_death_answer(
        self, 
        room: Room, 
        wallet_id: str, 
        question_id: str, 
        answer: str, 
        timestamp: datetime
    ):
        """Handle answer submission during sudden death"""
        try:
            room, result = await self.tie_break_service.submit_sudden_death_answer(
                room, wallet_id, answer, question_id
            )
            
            return {
                "success": True,
                "sudden_death_result": result,
                "status": result.get("status"),
                "message": result.get("message")
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sudden death error: {str(e)}")

    async def handle_no_answer_timeout(self, room_id: str, question_id: str):
        """Handle timeout when no one answers a question"""
        try:
            room: Room = self.room_service.get_room(room_id)
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")

            if room.is_tie_break_active():
                result = await self.tie_break_service.handle_no_answer_timeout(room, question_id)
                return {
                    "success": True,
                    "timeout_result": result,
                    "message": result.get("message")
                }
            else:
                # Handle regular game timeout
                return {
                    "success": True,
                    "message": "No answer submitted within time limit"
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Timeout error: {str(e)}")
