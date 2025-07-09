import { useState, useEffect, useCallback } from "react";
import { RoomStatus } from "@/types/RoomStatus";

interface TieBreakState {
  roomStatus: RoomStatus;
  tieBreakRound: number;
  currentQuestion: any;
  isSuddenDeath: boolean;
  winnerInfo?: {
    wallet_id: string;
    username: string;
  };
  message: string;
  timeLimit: number;
}

interface UseTieBreakProps {
  roomId: string;
  walletId: string;
  onGameEnd?: (winner: any) => void;
}

export const useTieBreak = ({
  roomId,
  walletId,
  onGameEnd,
}: UseTieBreakProps) => {
  const [tieBreakState, setTieBreakState] = useState<TieBreakState>({
    roomStatus: RoomStatus.WAITING,
    tieBreakRound: 1,
    currentQuestion: null,
    isSuddenDeath: false,
    message: "",
    timeLimit: 10,
  });

  const [isLoading, setIsLoading] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // TODO: Implement WebSocket connection for tie-break updates
    // This should listen for room status changes and tie-break events
  }, [roomId]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!tieBreakState.currentQuestion) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/submit-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_id: roomId,
            wallet_id: walletId,
            question_id: tieBreakState.currentQuestion.id,
            answer: answer,
            timestamp: new Date().toISOString(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Handle tie-break result
          if (result.tie_break_result) {
            const tieBreakResult = result.tie_break_result;

            setTieBreakState((prev) => ({
              ...prev,
              message: tieBreakResult.message,
            }));

            switch (tieBreakResult.status) {
              case "winner":
                setTieBreakState((prev) => ({
                  ...prev,
                  roomStatus: RoomStatus.COMPLETED,
                  winnerInfo: {
                    wallet_id: tieBreakResult.winner_wallet_id,
                    username: tieBreakResult.winner_username,
                  },
                }));
                onGameEnd?.(tieBreakResult);
                break;

              case "next_round":
                setTieBreakState((prev) => ({
                  ...prev,
                  tieBreakRound: tieBreakResult.round,
                  message: tieBreakResult.message,
                }));
                break;

              case "sudden_death":
                setTieBreakState((prev) => ({
                  ...prev,
                  roomStatus: RoomStatus.SUDDEN_DEATH,
                  isSuddenDeath: true,
                  message: tieBreakResult.message,
                }));
                break;

              case "cancelled":
                setTieBreakState((prev) => ({
                  ...prev,
                  roomStatus: RoomStatus.CANCELLED,
                  message: tieBreakResult.message,
                }));
                break;
            }
          }

          // Handle sudden death result
          if (result.sudden_death_result) {
            const suddenDeathResult = result.sudden_death_result;

            if (suddenDeathResult.status === "winner") {
              setTieBreakState((prev) => ({
                ...prev,
                roomStatus: RoomStatus.COMPLETED,
                winnerInfo: {
                  wallet_id: suddenDeathResult.winner_wallet_id,
                  username: suddenDeathResult.winner_username,
                },
                message: suddenDeathResult.message,
              }));
              onGameEnd?.(suddenDeathResult);
            }
          }
        }
      } catch (error) {
        console.error("Error submitting tie-break answer:", error);
        setTieBreakState((prev) => ({
          ...prev,
          message: "Có lỗi xảy ra khi gửi câu trả lời.",
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [roomId, walletId, tieBreakState.currentQuestion, onGameEnd]
  );

  const handleTimeout = useCallback(async () => {
    if (!tieBreakState.currentQuestion) return;

    try {
      const response = await fetch(
        `/api/timeout/${roomId}/${tieBreakState.currentQuestion.id}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (result.success && result.timeout_result) {
        setTieBreakState((prev) => ({
          ...prev,
          message: result.timeout_result.message,
        }));
      }
    } catch (error) {
      console.error("Error handling timeout:", error);
    }
  }, [roomId, tieBreakState.currentQuestion]);

  const updateRoomStatus = useCallback((status: RoomStatus, data?: any) => {
    setTieBreakState((prev) => ({
      ...prev,
      roomStatus: status,
      ...(data && {
        tieBreakRound: data.tie_break_round || prev.tieBreakRound,
        currentQuestion: data.current_question || prev.currentQuestion,
        isSuddenDeath: data.sudden_death_activated || prev.isSuddenDeath,
        message: data.message || prev.message,
        timeLimit: data.time_limit || prev.timeLimit,
      }),
    }));
  }, []);

  const resetTieBreak = useCallback(() => {
    setTieBreakState({
      roomStatus: RoomStatus.WAITING,
      tieBreakRound: 1,
      currentQuestion: null,
      isSuddenDeath: false,
      message: "",
      timeLimit: 10,
    });
  }, []);

  return {
    tieBreakState,
    isLoading,
    submitAnswer,
    handleTimeout,
    updateRoomStatus,
    resetTieBreak,
  };
};
