"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimerCircle from "@/components/timer-circle";
import PlayerCard from "@/components/player-card";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Question, Room, User } from "@/types/schema";
import { RoomStatus } from "@/types/RoomStatus";
import { fetchRoomById, leaveRoom } from "@/lib/api";
import { LEAVE_ROOM_TYPE } from "@/lib/constants";

export default function ChallengeRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;
  const { toast } = useToast();
  const {
    currentUser,
    currentRoom,
    setCurrentRoom,
    players,
    setPlayers,
    updatePlayerStatus,
    questions,
    startAt,
    setQuestions,
    setStartAt,
    currentQuestion,
    setCurrentQuestion,
  } = useGameState();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [roomTimeRemaining, setRoomTimeRemaining] = useState("2:45");
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, active, completed
  const [countdown, setCountdown] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionEndAt, setQuestionEndAt] = useState<number | null>(null);
  const QUESTION_TIME = 15;
  const [questionCountdown, setQuestionCountdown] = useState<number>(QUESTION_TIME);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadRoomData() {
      try {
        const room: Room = await fetchRoomById(roomId);
        setCurrentRoom(room);

        if (room.status === RoomStatus.WAITING) {
          router.replace(`/room/${roomId}/waiting`);
          return;
        }

        setPlayers(room.players);
      } catch (error) {
        console.error("❌ Failed to load room data:", error);
        toast({
          title: "Error",
          description: "Could not load room data",
          variant: "destructive",
        });
      }
    }

    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  useEffect(() => {
    if (!startAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((startAt - now) / 1000));
      setCountdown(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [startAt]);

  // Đồng bộ countdown mỗi câu hỏi theo questionEndAt từ server
  useEffect(() => {
    if (!questionEndAt) return;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((questionEndAt - now) / 1000));
      setQuestionCountdown(diff);
      if (diff <= 0 && !hasAnswered && currentQuestion) {
        handleTimeUp();
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [questionEndAt, hasAnswered, currentQuestion]);

  useEffect(() => {
    // Nếu zustand không có, lấy từ localStorage
    if ((!questions || questions.length === 0) && typeof window !== "undefined") {
      const q = localStorage.getItem("questions");
      if (q) setQuestions(JSON.parse(q));
    }
    if (!startAt && typeof window !== "undefined") {
      const s = localStorage.getItem("startAt");
      if (s) setStartAt(Number(s));
    }
  }, []);

  // Khi nhận next_question, lưu trạng thái đã trả lời vào localStorage
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      // Không set hasAnswered dựa vào localStorage!
      if (typeof window !== "undefined") {
        const answered = localStorage.getItem(`answered_${currentQuestion.id}`);
        if (answered) {
          setSelectedAnswer(answered);
        }
      }
    }
  }, [currentQuestion]);

  const { sendMessage } = useWebSocket({
    url: `/${roomId}?wallet_id=${currentUser?.walletId}`,
    onMessage: (data) => {
      switch (data.type) {
        case "player_answered":
          updatePlayerStatus(data.playerId, "answered", data.responseTime);
          break;
        case "next_question": {
          // Clear timeout fallback ngay khi nhận được câu hỏi mới
          if (nextQuestionTimeoutRef.current) {
            clearTimeout(nextQuestionTimeoutRef.current);
            nextQuestionTimeoutRef.current = null;
          }
          // Nếu không còn câu hỏi (server gửi null hoặc hết danh sách)
          if (!data.question) {
            setGameStatus("finished");
            setCurrentQuestion(null);
            // Nếu server gửi kèm kết quả
            if (data.results) setGameResults(data.results);
            if (typeof window !== "undefined") {
              localStorage.setItem("gameEnded", "1");
            }
            break;
          }
          // Gọi trực tiếp zustand store để tránh closure sai
          useGameState.getState().setCurrentQuestion(data.question);
          console.log("Received next_question:", data.question);
          setQuestionNumber((prev) => prev + 1);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setQuestionEndAt(data.questionEndAt);
          if (typeof window !== "undefined") {
            localStorage.setItem("questionEndAt", String(data.questionEndAt));
          }
          break;
        }
        case "game_ended":
          setGameResults(data.results);
          setGameStatus("finished");
          // Lưu trạng thái đã kết thúc game vào localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("gameEnded", "1");
          }
          break;
        case "error":
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          break;
        case "clear_local_storage":
          if (typeof window !== "undefined") {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("answered_")) localStorage.removeItem(key);
            });
            localStorage.removeItem("questions");
            localStorage.removeItem("startAt");
            localStorage.removeItem("questionEndAt");
            localStorage.removeItem("gameEnded");
          }
          break;
      }
    },
  });

  // Khi có câu hỏi đầu tiên (sau countdown game), set questionEndAt nếu có
  useEffect(() => {
    if (currentQuestionIndex === 0 && questions.length > 0 && !questionEndAt) {
      // Nếu vừa vào game, lấy questionEndAt từ localStorage nếu có
      const qEnd = localStorage.getItem("questionEndAt");
      if (qEnd) setQuestionEndAt(Number(qEnd));
    }
  }, [currentQuestionIndex, questions, questionEndAt]);

  // Khi vào lại game room, nếu đã hết game thì luôn hiển thị kết quả
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ended = localStorage.getItem("gameEnded");
      if (ended === "1") {
        setGameStatus("finished");
      }
    }
  }, []);

  useEffect(() => {
    console.log("Current question (state):", currentQuestion);
  }, [currentQuestion]);

  useEffect(() => {
    console.log("Questions (state):", questions);
  }, [questions]);

  useEffect(() => {
    console.log("StartAt (state):", startAt);
  }, [startAt]);

  useEffect(() => {
    // Nếu đã hết game thì không đặt timeout fallback nữa
    if (gameStatus === "finished") return;
    if (!currentQuestion) return;
    // Clear timeout cũ nếu có
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    // Đặt timeout fallback (ví dụ 16s)
    nextQuestionTimeoutRef.current = setTimeout(() => {
      toast({
        title: "Connection issue",
        description: "No next question received. Please check your connection or try rejoining the room.",
        variant: "destructive",
      });
      window.location.reload();
    }, 16000);

    // Cleanup khi unmount hoặc sang câu mới
    return () => {
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, [currentQuestion, gameStatus]);

  const handleAnswerSelect = (answer: string) => {
    console.log("Click answer:", answer, hasAnswered);
    if (hasAnswered) return;
    setSelectedAnswer(answer);
    setHasAnswered(true);
    if (currentQuestion && typeof window !== "undefined") {
      localStorage.setItem(`answered_${currentQuestion.id}`, answer);
    }
    sendMessage({
      type: "submit_answer",
      roomId: currentRoom?.id,
      answer,
      responseTime: QUESTION_TIME - questionCountdown,
    });
    toast({
      title: "Answer Submitted",
      description: "Your answer has been recorded!",
    });
  };

  const handleTimeUp = () => {
    if (!hasAnswered) {
      setHasAnswered(true);
      sendMessage({
        type: "submit_answer",
        roomId: currentRoom?.id,
        answer: null,
        responseTime: QUESTION_TIME,
      });
      toast({
        title: "Time's Up!",
        description: "Moving to next question...",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({
        walletId: currentUser?.walletId,
        roomId: currentRoom?.id,
      });

      sendMessage({
        type: LEAVE_ROOM_TYPE,
        roomId: currentRoom?.id,
        playerId: currentUser?.walletId,
      });

      router.push("/lobby");
    } catch (error) {
      console.error("Failed to leave room:", error);
      toast({
        title: "Leave Room",
        description: "Leaving Room...",
        variant: "default",
      });
    }
  };

  const sortedPlayers = [...players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  // Render UI
  const renderQuestion = () => {
    if (currentQuestion) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-neon-blue text-center drop-shadow-lg">
            {currentQuestion.content}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
            {currentQuestion.options.map((opt: string, idx: number) => {
              const isSelected = selectedAnswer === opt;
              const isDisabled = hasAnswered;
              return (
                <button
                  key={idx}
                  className={`
                    w-full py-5 px-6 rounded-2xl border-2 font-orbitron text-lg md:text-xl transition-all duration-200
                    flex items-center gap-3 shadow-lg
                    ${isSelected
                      ? "bg-gradient-to-r from-neon-blue to-neon-purple border-neon-blue text-white scale-105 ring-2 ring-neon-purple"
                      : "bg-gray-900 border-gray-700 text-white hover:bg-neon-purple/20 hover:border-neon-purple"}
                    ${isDisabled && !isSelected ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  onClick={() => !isDisabled && handleAnswerSelect(opt)}
                  disabled={isDisabled}
                >
                  <span className="mr-2 font-bold text-neon-purple text-xl">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="flex-1 text-left">{opt}</span>
                  {isSelected && (
                    <span className="ml-2 text-neon-blue text-2xl animate-bounce">✔</span>
                  )}
                </button>
              );
            })}
          </div>
          {hasAnswered && (
            <div className="mt-8 text-neon-blue font-semibold text-lg animate-pulse text-center">
              Answer submitted!<br />Waiting for next question...
            </div>
          )}
        </div>
      );
    }
    if (questions && questions.length > 0 && questionNumber > 0 && questionNumber <= questions.length) {
      const q = questions[questionNumber - 1];
      if (q) {
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{q.content}</h2>
            <ul className="mb-4">
              {q.options && q.options.length > 0 ? (
                q.options.map((opt: string, idx: number) => (
                  <li key={idx} className="mb-2 p-2 border rounded bg-gray-800 text-white">
                    {String.fromCharCode(65 + idx)}. {opt}
                  </li>
                ))
              ) : (
                <li className="text-red-500">No options found</li>
              )}
            </ul>
          </div>
        );
      }
    }
    return <div className="text-center text-lg mt-10">Waiting for questions...</div>;
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid-fast relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 neural-network opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-neon-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-neon-purple/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 hexagon bg-neon-blue/20 animate-float pointer-events-none"></div>
      <div
        className="absolute top-60 right-16 w-12 h-12 hexagon bg-neon-purple/20 animate-float pointer-events-none"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-40 left-1/4 w-20 h-20 hexagon bg-neon-blue/15 animate-float pointer-events-none"
        style={{ animationDelay: "4s" }}
      ></div>

      {/* Enhanced Header */}
      <header className="relative z-10 bg-cyber-darker/90 backdrop-blur-xl border-b border-neon-blue/30 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  Room #{currentRoom?.roomCode}
                </h1>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Enhanced Room Timer */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Clock className="w-5 h-5 text-neon-purple" />
                <span className="font-orbitron text-lg font-bold text-neon-purple">
                  {questionCountdown}s
                </span>
              </div>

              {/* Enhanced Question Counter */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <HelpCircle className="w-5 h-5 text-neon-blue" />
                <span className="font-orbitron font-bold text-neon-blue">
                  {questionNumber}/10
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {gameStatus === "finished" ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-3xl font-bold mb-4">Game Results</h2>
                {gameResults.length > 0 ? (
                  <>
                    <table className="min-w-[300px] border border-neon-blue/40 rounded-lg overflow-hidden mb-4">
                      <thead>
                        <tr className="bg-neon-blue/10">
                          <th className="px-4 py-2">Wallet</th>
                          <th className="px-4 py-2">OATH</th>
                          <th className="px-4 py-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameResults.map((player, idx) => (
                          <tr key={idx} className="text-center border-b border-neon-blue/10">
                            <td className="px-4 py-2 font-mono">{player.wallet}</td>
                            <td className="px-4 py-2">{player.oath}</td>
                            <td className="px-4 py-2 font-bold text-neon-blue">{player.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <pre className="bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xl overflow-x-auto">
                      {JSON.stringify(gameResults, null, 2)}
                    </pre>
                  </>
                ) : (
                  <div className="text-lg text-neon-blue">Đang tổng kết kết quả...</div>
                )}
                <Button className="mt-6" onClick={() => router.push('/lobby')}>
                  Về lobby
                </Button>
              </div>
            ) : countdown > 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-3xl font-bold mb-4">Game starts in: {countdown}s</h2>
              </div>
            ) : currentQuestion ? (
              renderQuestion()
            ) : (
              <div className="text-center text-lg mt-8">Waiting for questions...</div>
            )}
          </div>

          {/* Players List */}
          <aside className="lg:col-span-1">
            <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-orbitron font-bold text-neon-purple mb-6 text-center">
                  Players
                </h3>
                <div className="space-y-4">
                  {sortedPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player as User} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
