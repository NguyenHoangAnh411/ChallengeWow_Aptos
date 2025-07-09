"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import TimerCircle from "./timer-circle";
import { motion, AnimatePresence } from "framer-motion";
import { RoomStatus } from "@/types/RoomStatus";

interface TieBreakUIProps {
  roomStatus: RoomStatus;
  tieBreakRound?: number;
  currentQuestion?: any;
  onAnswerSubmit?: (answer: string) => void;
  onTimeout?: () => void;
  timeLimit?: number;
  isSuddenDeath?: boolean;
  winnerInfo?: {
    wallet_id: string;
    username: string;
  };
  message?: string;
}

// No use (now)
export const TieBreakUI: React.FC<TieBreakUIProps> = ({
  roomStatus,
  tieBreakRound = 1,
  currentQuestion,
  onAnswerSubmit,
  onTimeout,
  timeLimit = 10,
  isSuddenDeath = false,
  winnerInfo,
  message,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (
      roomStatus === RoomStatus.TIE_BREAK ||
      roomStatus === RoomStatus.SUDDEN_DEATH
    ) {
      setTimeLeft(timeLimit);
      setIsAnswered(false);
      setSelectedAnswer("");
    }
  }, [roomStatus, timeLimit, currentQuestion]);

  useEffect(() => {
    if (timeLeft <= 0 && !isAnswered) {
      onTimeout?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, onTimeout]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || isAnswered) return;
    setIsAnswered(true);
    onAnswerSubmit?.(selectedAnswer);
  };

  const getStatusMessage = () => {
    if (message) return message;

    switch (roomStatus) {
      case RoomStatus.TIE_BREAK:
        return `Tie-Break Round ${tieBreakRound}. Whoever wins 2 consecutive rounds will be the winner!`;
      case RoomStatus.SUDDEN_DEATH:
        return "Sudden Death activated! Whoever answers correctly first will win immediately!";
      case RoomStatus.COMPLETED:
        return winnerInfo
          ? `${winnerInfo.username} win the Tie-Break! Final Winner!`
          : "Game Ended!";
      case RoomStatus.CANCELLED:
        return "No answers found! Game Ended!";
      default:
        return "We need to start a Tie-Break!";
    }
  };

  const getStatusColor = () => {
    switch (roomStatus) {
      case RoomStatus.TIE_BREAK:
        return "bg-blue-500";
      case RoomStatus.SUDDEN_DEATH:
        return "bg-red-500";
      case RoomStatus.COMPLETED:
        return "bg-green-500";
      case RoomStatus.CANCELLED:
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (roomStatus === RoomStatus.COMPLETED && winnerInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-700">
              🏆 Chiến Thắng!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-xl font-semibold text-green-600 mb-4">
              {winnerInfo.username}
            </div>
            <p className="text-gray-600">{getStatusMessage()}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (roomStatus === RoomStatus.CANCELLED) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="border-2 border-gray-500 bg-gray-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-700">
              ❌ Game Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">{getStatusMessage()}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="border-2 border-blue-500">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className={`${getStatusColor()} text-white`}>
              {isSuddenDeath
                ? "SUDDEN DEATH"
                : `TIE-BREAK ROUND ${tieBreakRound}`}
            </Badge>
            {!isSuddenDeath && (
              <TimerCircle
                duration={timeLimit}
                onTimeUp={() => {}}
                isPaused={false}
              />
            )}
          </div>
          <CardTitle className="text-xl font-bold">
            {isSuddenDeath
              ? "⚡ Sudden Death"
              : `Tie-Break Round ${tieBreakRound}`}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center font-medium">
              {getStatusMessage()}
            </AlertDescription>
          </Alert>

          {currentQuestion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {currentQuestion.options?.map(
                    (option: string, index: number) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={
                            selectedAnswer === option ? "default" : "outline"
                          }
                          className={`w-full justify-start h-auto p-3 ${
                            selectedAnswer === option
                              ? "bg-blue-500 text-white"
                              : "hover:bg-blue-50"
                          }`}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={isAnswered}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </Button>
                      </motion.div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || isAnswered}
                  className="px-8 py-2"
                >
                  {isAnswered ? "Đã trả lời" : "Gửi câu trả lời"}
                </Button>
              </div>
            </div>
          )}

          {isSuddenDeath && (
            <div className="text-center text-sm text-gray-500">
              ⚡ Không có thời gian chờ - Ai trả lời đúng trước sẽ thắng ngay!
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
