"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimerCircle from "@/components/timer-circle";
import PlayerCard from "@/components/player-card";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Question, Room, User } from "@/types/schema";
import { RoomStatus } from "@/types/RoomStatus";
import { fetchRoomById, fetchGameData, leaveRoom } from "@/lib/api";
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
  const [gameStatus, setGameStatus] = useState("waiting");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionEndAt, setQuestionEndAt] = useState<number | null>(null);
  const [questionCountdown, setQuestionCountdown] = useState<number>(0);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [winnerWallet, setWinnerWallet] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Pop page
  useEffect(() => {
    const onPopState = async () => {
      console.log("[Back] Triggered popstate");
      if (gameStatus !== RoomStatus.FINISHED) {
        await handleLeaveRoom();
      } else {
        await handleFinshed();
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Load room data
  useEffect(() => {
    async function loadRoomData() {
      try {
        const room: Room = await fetchRoomById(roomId);
        console.log("[DEBUG] Room data received:", room);

        if (!room) {
          throw new Error("Room data is null or undefined");
        }

        if (typeof room.totalQuestions !== "number") {
          console.warn(
            "[DEBUG] totalQuestions is not a number:",
            room.totalQuestions
          );
          // Try alternative field names
          if (typeof (room as any).total_questions === "number") {
            room.totalQuestions = (room as any).total_questions;
            console.log(
              "[DEBUG] Using total_questions field:",
              room.totalQuestions
            );
          } else {
            // Set a default value if totalQuestions is missing
            room.totalQuestions = 10;
            console.log(
              "[DEBUG] Using default totalQuestions:",
              room.totalQuestions
            );
          }
        }

        setCurrentRoom(room);
        setTotalQuestions(room.totalQuestions); // Use room instead of currentRoom
        setGameStatus(room.status);
        setStartAt(room.startedAt);
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

  // Fetch game results
  useEffect(() => {
    if (gameStatus === "finished" && roomId && gameResults.length === 0) {
      if (winnerWallet) {
        fetchGameResult();
      }
    }
  }, [gameStatus, roomId, winnerWallet]);

  const fetchGameResult = async () => {
    try {
      const res = await fetchGameData(roomId);
      setGameResults(res.data.results);
      setWinnerWallet(res.data.winner_wallet);
    } catch (err: any) {
      console.error("Failed to fetch game result", err);
      toast({
        title: "Error",
        description: err.message || "Could not fetch game result",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!startAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((startAt - now) / 1000));
      setCountdown(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setGameStatus(RoomStatus.IN_PROGRESS);
      }
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

  // useEffect(() => {
  //   // Nếu zustand không có, lấy từ localStorage
  //   if (
  //     (!questions || questions.length === 0) &&
  //     typeof window !== "undefined"
  //   ) {
  //     const q = localStorage.getItem("questions");
  //     if (q) setQuestions(JSON.parse(q));
  //   }
  //   if (!startAt && typeof window !== "undefined") {
  //     const s = localStorage.getItem("startAt");
  //     if (s) setStartAt(Number(s));
  //   }
  // }, []);

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

  // Fixed useWebSocket message handling logic
  const { sendMessage } = useWebSocket({
    url: currentUser?.walletId
      ? `/${roomId}?wallet_id=${currentUser?.walletId}`
      : undefined,
    onMessage: (data) => {
      switch (data.type) {
        case "game_started":
          if (data.payload) {
            const { questions, startAt, totalQuestions, countdownDuration } =
              data.payload;
            setStartAt(startAt);

            // Store in localStorage for persistence
            if (typeof window !== "undefined") {
              localStorage.setItem("questions", JSON.stringify(questions));
              localStorage.setItem("startAt", String(startAt));
            }
          }
          break;

        case "player_answered":
          updatePlayerStatus(data.playerId, "answered", data.responseTime);
          break;

        case "next_question": {
          console.log(
            "[DEBUG] Received next_question, current gameStatus:",
            gameStatus
          );
          // Clear timeout fallback when receiving new question
          if (nextQuestionTimeoutRef.current) {
            clearTimeout(nextQuestionTimeoutRef.current);
            nextQuestionTimeoutRef.current = null;
          }
          // Nếu không còn câu hỏi (server gửi null hoặc hết danh sách)
          if (!data.payload?.question) {
            console.log("[DEBUG] No question in payload, ending game");
            setGameStatus("finished");
            setCurrentQuestion(null);
            if (typeof window !== "undefined") {
              localStorage.setItem("gameEnded", "1");
            }
            break;
          }
          // Reset game status to in_progress when receiving new question
          console.log("[DEBUG] Setting gameStatus to in_progress");
          setGameStatus("in_progress");
          // Clear gameEnded flag since we're continuing the game
          if (typeof window !== "undefined") {
            localStorage.removeItem("gameEnded");
            console.log("[DEBUG] Cleared gameEnded from localStorage");
          }
          // Gọi trực tiếp zustand store để tránh closure sai
          setCountdown(data.payload.timing.timePerQuestion);
          useGameState.getState().setCurrentQuestion(data.payload.question);
          console.log("Received next_question:", data.payload.question);
          setQuestionNumber(data.payload.progress.current);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setQuestionEndAt(data.payload.timing?.questionEndAt);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "questionEndAt",
              String(data.payload.timing?.questionEndAt)
            );
          }

          break;
        }

        case "answer_submitted":
          // Handle answer submission response - this is missing
          if (data.payload) {
            const {
              isCorrect,
              points,
              totalScore,
              correctAnswer,
              explanation,
            } = data.payload;

            // You might want to show this feedback to the user
            toast({
              title: isCorrect ? "Correct!" : "Incorrect",
              description: `You earned ${points} points! Total: ${totalScore}`,
              variant: isCorrect ? "default" : "destructive",
            });

            // Store the correct answer and explanation
            if (currentQuestion && typeof window !== "undefined") {
              localStorage.setItem(
                `result_${currentQuestion.id}`,
                JSON.stringify({
                  isCorrect,
                  points,
                  correctAnswer,
                  explanation,
                })
              );
            }
          }
          break;

        case "question_result":
          // Handle question result statistics - this is missing
          if (data.payload) {
            const { correctAnswer, explanation, answerStats, leaderboard } =
              data.payload;

            console.log("Question result:", data.payload);

            // ✅ FIXED: Show question result to user
            toast({
              title: "Question Result",
              description: `Correct answer: ${correctAnswer}`,
              variant: "default",
            });

            // ✅ FIXED: Update leaderboard if provided
            if (leaderboard && Array.isArray(leaderboard)) {
              // Update player scores in game state
              leaderboard.forEach((player: any) => {
                updatePlayerStatus(player.walletId, "score", player.score);
              });
            }

            // ✅ FIXED: Store result for current question
            if (currentQuestion && typeof window !== "undefined") {
              localStorage.setItem(
                `result_${currentQuestion.id}`,
                JSON.stringify({
                  correctAnswer,
                  explanation,
                  answerStats,
                  leaderboard,
                })
              );
            }
          }
          break;

        case "game_ended":
          console.log("[DEBUG] Received game_ended message");
          setGameResults(data.payload?.leaderboard || []);
          setGameStatus("finished");
          setWinnerWallet(data.payload?.winner?.walletId || null);
          // Lưu trạng thái đã kết thúc game vào localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("gameEnded", "1");
            console.log("[DEBUG] Set gameEnded in localStorage");
          }
          break;

        case "error":
          toast({
            title: "Error",
            description:
              data.message || data.payload?.message || "An error occurred",
            variant: "destructive",
          });
          break;

        case "clear_local_storage":
          if (typeof window !== "undefined") {
            Object.keys(localStorage).forEach((key) => {
              if (
                key.startsWith("answered_") ||
                key.startsWith("result_") ||
                key === "questions" ||
                key === "startAt" ||
                key === "questionEndAt" ||
                key === "gameEnded"
              ) {
                localStorage.removeItem(key);
              }
            });
          }
          break;

        default:
          console.warn("Unknown WebSocket message type:", data.type);
          break;
      }
    },
  });

  // Fixed answer submission to match backend expectations
  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;

    console.log("[DEBUG] handleAnswerSelect called with answer:", answer);
    console.log("[DEBUG] Current question:", currentQuestion);

    setSelectedAnswer(answer);
    setHasAnswered(true);

    if (currentQuestion && typeof window !== "undefined") {
      localStorage.setItem(`answered_${currentQuestion.id}`, answer);
    }

    // ✅ FIXED: Calculate response time correctly using server timing
    const responseTime = questionEndAt
      ? Math.max(0, questionEndAt - Date.now())
      : 0; // Fallback if no questionEndAt

    const messageData = {
      type: "submit_answer",
      data: {
        // Wrap in data object to match backend structure
        roomId: currentRoom?.id,
        answer,
        responseTime: Math.abs(responseTime), // Ensure positive value
        questionStartAt: questionEndAt
          ? questionEndAt - (currentRoom?.timePerQuestion || 20) * 1000
          : Date.now(),
      },
    };

    console.log("[DEBUG] Sending submit_answer message:", messageData);

    sendMessage(messageData);

    toast({
      title: "Answer Submitted",
      description: "Your answer has been recorded!",
    });
  };

  // Fixed time up handler
  const handleTimeUp = () => {
    console.log("[DEBUG] handleTimeUp called - hasAnswered:", hasAnswered);
    if (!hasAnswered) {
      setHasAnswered(true);

      // ✅ FIXED: Send empty answer when time is up
      const messageData = {
        type: "submit_answer",
        data: {
          // Wrap in data object
          roomId: currentRoom?.id,
          answer: "", // Empty answer when time is up
          responseTime: questionEndAt
            ? Math.max(0, questionEndAt - Date.now())
            : 0,
          questionStartAt: questionEndAt
            ? questionEndAt - (currentRoom?.timePerQuestion || 20) * 1000
            : Date.now(),
        },
      };

      console.log("[DEBUG] Sending time up message:", messageData);

      sendMessage(messageData);

      toast({
        title: "Time's Up!",
        description: "Moving to next question...",
        variant: "destructive",
      });
    }
  };

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
      console.log("[DEBUG] Checking localStorage gameEnded:", ended);
      if (ended === "1") {
        console.log("[DEBUG] Setting gameStatus to FINISHED from localStorage");
        setGameStatus(RoomStatus.FINISHED);
      }
    }
  }, []);

  useEffect(() => {
    // Nếu đã hết game thì không đặt timeout fallback nữa
    if (gameStatus === RoomStatus.FINISHED) return;
    if (!currentQuestion) return;
    // Clear timeout cũ nếu có
    if (nextQuestionTimeoutRef.current)
      clearTimeout(nextQuestionTimeoutRef.current);

    // Đặt timeout fallback (ví dụ 16s)
    nextQuestionTimeoutRef.current = setTimeout(() => {
      toast({
        title: "Connection issue",
        description:
          "No next question received. Please check your connection or try rejoining the room.",
        variant: "destructive",
      });
      window.location.reload();
    }, 16000);

    // Cleanup khi unmount hoặc sang câu mới
    return () => {
      if (nextQuestionTimeoutRef.current)
        clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, [currentQuestion, gameStatus]);

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

  const handleFinshed = async () => {
    router.replace("/lobby");
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
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-neon-blue to-neon-purple border-neon-blue text-white scale-105 ring-2 ring-neon-purple"
                        : "bg-gray-900 border-gray-700 text-white hover:bg-neon-purple/20 hover:border-neon-purple"
                    }
                    ${
                      isDisabled && !isSelected
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                  onClick={() => {
                    console.log("[DEBUG] Button clicked with option:", opt);
                    console.log("[DEBUG] isDisabled:", isDisabled);
                    if (!isDisabled) {
                      console.log(
                        "[DEBUG] Calling handleAnswerSelect with:",
                        opt
                      );
                      handleAnswerSelect(opt);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <span className="mr-2 font-bold text-neon-purple text-xl">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="flex-1 text-left">{opt}</span>
                  {isSelected && (
                    <span className="ml-2 text-neon-blue text-2xl animate-bounce">
                      ✔
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {hasAnswered && (
            <div className="mt-8 text-neon-blue font-semibold text-lg animate-pulse text-center">
              Answer submitted!
              <br />
              Waiting for next question...
            </div>
          )}
        </div>
      );
    }
    if (
      questions &&
      questions.length > 0 &&
      questionNumber > 0 &&
      questionNumber <= questions.length
    ) {
      const q = questions[questionNumber - 1];
      if (q) {
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{q.content}</h2>
            <ul className="mb-4">
              {q.options && q.options.length > 0 ? (
                q.options.map((opt: string, idx: number) => (
                  <li
                    key={idx}
                    className="mb-2 p-2 border rounded bg-gray-800 text-white"
                  >
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
    return (
      <div className="text-center text-lg mt-10">Waiting for questions...</div>
    );
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
                onClick={
                  gameStatus === RoomStatus.FINISHED
                    ? handleFinshed
                    : handleLeaveRoom
                }
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
                  {questionNumber}/{totalQuestions}
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
            {gameStatus === RoomStatus.FINISHED ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-4xl font-orbitron font-bold mb-6 text-neon-blue drop-shadow-neon">
                  Game Results
                </h2>
                {winnerWallet && (
                  <div className="mb-6 px-8 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold text-2xl shadow-neon-glow flex items-center gap-3 animate-glow-pulse">
                    <Trophy className="w-7 h-7 text-yellow-300 drop-shadow" />
                    Winner:
                    <span className="text-yellow-300">
                      {gameResults.find((p) => p.wallet === winnerWallet)
                        ?.username ||
                        gameResults.find((p) => p.wallet === winnerWallet)
                          ?.oath ||
                        winnerWallet}
                    </span>
                  </div>
                )}
                <div className="overflow-x-auto w-full flex justify-center">
                  <table className="min-w-[700px] max-w-3xl w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 text-white">
                        <th className="px-6 py-3 rounded-tl-xl">Wallet</th>
                        <th className="px-6 py-3">OATH</th>
                        <th className="px-6 py-3">Score</th>
                        <th className="px-6 py-3 rounded-tr-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameResults.map((player, idx) => (
                        <tr
                          key={idx}
                          className={`transition-all duration-200 text-center bg-cyber-darker/80 hover:bg-neon-blue/10 ${
                            winnerWallet === player.wallet
                              ? "border-2 border-yellow-400 shadow-neon-glow font-bold scale-105"
                              : "border border-neon-blue/20"
                          }`}
                        >
                          <td className="px-6 py-3 font-mono text-neon-blue">
                            {player.walletId || player.wallet || "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-neon-purple">
                            {player.username || player.oath || "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-xl text-green-400 font-orbitron">
                            {player.score}
                          </td>
                          <td className="px-6 py-3">
                            {winnerWallet === player.wallet ? (
                              <span className="flex items-center gap-1 text-yellow-300">
                                <CheckCircle className="w-5 h-5" /> Winner
                              </span>
                            ) : (
                              <span className="text-gray-400">Player</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="mt-6 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold shadow hover:scale-105 transition-all"
                  onClick={() => setShowJson((v) => !v)}
                >
                  {showJson ? "Hide Raw JSON" : "Show Raw JSON"}
                </button>
                {showJson && (
                  <div className="mt-4 w-full max-w-2xl bg-cyber-darker/80 rounded-lg p-4 text-xs text-green-300 overflow-x-auto shadow-inner border border-neon-blue/30">
                    <pre>{JSON.stringify(gameResults, null, 2)}</pre>
                  </div>
                )}
                <button
                  className="mt-8 px-6 py-3 rounded-lg bg-neon-blue text-white font-bold shadow-neon-glow hover:bg-neon-purple transition-all"
                  onClick={handleFinshed}
                >
                  Back to Lobby
                </button>
              </div>
            ) : countdown > 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-3xl font-bold mb-4">
                  Game starts in: {countdown}s
                </h2>
              </div>
            ) : currentQuestion ? (
              renderQuestion()
            ) : (
              <div className="text-center text-lg mt-8">
                Waiting for questions...
              </div>
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
                    <PlayerCard key={player.id} player={player} />
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
