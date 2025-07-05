"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  CheckCircle,
  Trophy,
  Users,
  Crown,
  Play,
  Share2,
  MessageCircle,
  Mic,
  MicOff,
  Ban,
  Zap,
  Target,
  LogOut,
  Loader,
  Timer,
  Check,
  Circle,
  Award,
  Star,
  Medal,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimerCircle from "@/components/timer-circle";
import AnswerDistributionChart from "@/components/answer-distribution-chart";
import ConfettiEffect from "@/components/confetti-effect";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Room, User, Player } from "@/types/schema";
import { RoomStatus } from "@/types/RoomStatus";
import {
  awardNFT,
  fetchRoomById,
  fetchGameData,
  leaveRoom,
  updateGameSettings,
  changePlayerStatus,
} from "@/lib/api";
import {
  LEAVE_ROOM_TYPE,
  GAME_STARTED_TYPE,
  NEXT_QUESTION_TYPE,
  SUBMIT_ANSWER_TYPE,
  ANSWER_SUBMITTED_TYPE,
  QUESTION_RESULT_TYPE,
  GAME_END_TYPE,
  START_GAME_TYPE,
  CHAT_TYPE,
  KICKED_TYPE,
  ROOM_CONFIG_UPDATE,
  KICK_PLAYER_TYPE,
  PLAYER_JOINED_TYPE,
  PLAYER_READY_TYPE,
} from "@/lib/constants";
import EnhancedGameSettings from "@/components/room-game-settings";
import GameSettingsView from "@/components/room-settings-view";
import { DEFAULT_GAME_SETTINGS } from "@/app/config/GameSettings";
interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}
import { useAccount } from "wagmi";
import PlayerCard from "@/components/player-card";

export default function ChallengeRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;
  const { toast } = useToast();
  const { isConnected, address } = useAccount();

  const {
    currentUser,
    currentRoom,
    setCurrentRoom,
    players,
    setPlayers,
    gameStatus,
    setGameStatus,
    questionIndex,
    setQuestionIndex,
    totalQuestions,
    setTotalQuestions,
    questionEndAt,
    setQuestionEndAt,
    questionCountdown,
    setQuestionCountdown,
    hasAnswered,
    setHasAnswered,
    selectedAnswer,
    setSelectedAnswer,
    currentQuestion,
    setCurrentQuestion,
    questionResult,
    setQuestionResult,
    gameResults,
    setGameResults,
    winnerWallet,
    setWinnerWallet,
    resetGameState,
  } = useGameState();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [kickConfirmation, setKickConfirmation] = useState<{
    show: boolean;
    playerId: string;
    playerName: string;
  }>({ show: false, playerId: "", playerName: "" });
  const [isRefreshingPlayers, setIsRefreshingPlayers] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [gameSettings, setGameSettings] = useState(DEFAULT_GAME_SETTINGS);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // WebSocket connection
  const { sendMessage, isWsConnected, closeConnection } = useWebSocket({
    url: currentUser?.walletId
      ? `/${roomId}?wallet_id=${currentUser?.walletId}`
      : undefined,
    onMessage: handleWebSocketMessage,
  });

  function handleWebSocketMessage(data: any) {
    console.log("[WS] Received message:", data);

    switch (data.type) {
      case GAME_STARTED_TYPE:
        handleGameStarted(data.payload);
        break;
      case NEXT_QUESTION_TYPE:
        handleNextQuestion(data.payload);
        break;
      case ANSWER_SUBMITTED_TYPE:
        handleAnswerSubmitted(data.payload);
        break;
      case QUESTION_RESULT_TYPE:
        handleQuestionResult(data.payload);
        break;
      case GAME_END_TYPE:
        handleGameEnd(data.payload);
        break;
      case CHAT_TYPE:
        handleChatMessage(data.payload);
        break;
      case PLAYER_JOINED_TYPE:
        handleJoinGame(data.payload);
        break;
      case KICKED_TYPE:
        handleKicked(data.payload);
        break;
      case ROOM_CONFIG_UPDATE:
        setGameSettings(data.payload);
        break;
      case PLAYER_READY_TYPE:
        handlePlayerReady(data.payload);
        break;
      default:
        console.log("[WS] Unknown message type:", data.type);
    }
  }

  function handleGameStarted(payload: any) {
    console.log("[GAME] Game started:", payload);
    setGameStatus("countdown");
    setTotalQuestions(payload.totalQuestions);
    setStartAt(payload.startAt);

    // Start countdown
    const now = Date.now();
    const countdownDuration = payload.countdownDuration || 3;
    const countdownEnd = now + countdownDuration * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((countdownEnd - Date.now()) / 1000)
      );
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setGameStatus("in_progress");
      }
    }, 1000);
  }

  function handleNextQuestion(payload: any) {
    console.log("[GAME] Next question:", payload);
    setGameStatus("in_progress");
    setQuestionIndex(payload.questionIndex);
    setCurrentQuestion({
      ...payload.question,
      timePerQuestion: payload.timing.timePerQuestion,
    });
    setQuestionEndAt(payload.timing.questionEndAt);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setQuestionResult(null);
  }

  function handleAnswerSubmitted(payload: any) {
    console.log("[GAME] Answer submitted:", payload);
    setHasAnswered(true);

    // Show confetti for correct answers
    if (payload.isCorrect && !payload.isNoAnswer) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Show appropriate toast message based on answer type
    if (payload.isNoAnswer) {
      toast({
        title: "Time's up!",
        description: "No answer submitted - 0 points",
        variant: "destructive",
      });
    } else {
      // Create detailed message for correct answers
      let description =
        payload.message || `You earned ${payload.points} points`;

      if (
        payload.isCorrect &&
        (payload.speedBonus > 0 ||
          payload.timeBonus > 0 ||
          payload.orderBonus > 0)
      ) {
        const bonuses = [];
        if (payload.speedBonus > 0)
          bonuses.push(`Speed: +${payload.speedBonus}`);
        if (payload.timeBonus > 0) bonuses.push(`Time: +${payload.timeBonus}`);
        if (payload.orderBonus > 0)
          bonuses.push(`First: +${payload.orderBonus}`);

        if (bonuses.length > 0) {
          description = `Base: ${payload.baseScore} | ${bonuses.join(
            " | "
          )} | Total: ${payload.points}`;
        }
      }

      toast({
        title: payload.isCorrect ? "Correct!" : "Incorrect",
        description: description,
        variant: payload.isCorrect ? "default" : "destructive",
      });
    }
  }

  function handleQuestionResult(payload: any) {
    console.log("[GAME] Question result:", payload);
    setGameStatus("question_result");

    // Calculate rank changes by comparing with previous leaderboard
    const previousLeaderboard = questionResult?.leaderboard || [];
    const newLeaderboard = payload.leaderboard.map((player: any) => {
      const previousPlayer = previousLeaderboard.find(
        (p: any) => p.walletId === player.walletId
      );

      const rankChange = previousPlayer ? previousPlayer.rank - player.rank : 0;

      const scoreChange = previousPlayer
        ? player.score - previousPlayer.score
        : 0;

      return {
        ...player,
        rankChange,
        scoreChange,
      };
    });

    setQuestionResult({
      correctAnswer: payload.correctAnswer,
      explanation: payload.explanation,
      answerStats: payload.answerStats,
      leaderboard: newLeaderboard,
      totalPlayers: payload.totalPlayers,
      options: payload.options,
      totalResponses: payload.totalResponses,
      questionIndex: payload.questionIndex,
    });
  }

  function handleGameEnd(payload: any) {
    console.log("[GAME] Game ended:", payload);
    setGameStatus("finished");

    // Handle new payload structure with leaderboard
    if (payload.leaderboard) {
      setGameResults(payload.leaderboard);
      setWinnerWallet(payload.winner?.walletId || payload.winner_wallet);
    } else {
      // Fallback to old structure
      setGameResults(payload.results || []);
      setWinnerWallet(payload.winner_wallet);
    }

    // Show success toast for winner
    if (payload.winner && payload.winner.walletId === currentUser?.walletId) {
      toast({
        title: "🎉 Congratulations!",
        description: "You won the game!",
        variant: "default",
      });
    }
  }

  function handleChatMessage(data: any) {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        playerId: data.sender,
        playerName: data.sender,
        message: data.message,
        timestamp: new Date(),
      },
    ]);
  }

  function handleJoinGame(payload: any) {
    const playerWithDerivedIsReady = {
      ...payload.player,
      playerStatus: payload.player.playerStatus || "active",
      isReady: payload.player.isReady,
    };

    const existingPlayerIndex = players.findIndex(
      (p) => p.walletId === payload.player.walletId
    );

    let updatedPlayers: Player[];

    if (existingPlayerIndex >= 0) {
      updatedPlayers = [...players];
      updatedPlayers[existingPlayerIndex] = {
        ...updatedPlayers[existingPlayerIndex],
        ...playerWithDerivedIsReady,
      };
    } else {
      updatedPlayers = [...players, playerWithDerivedIsReady];
    }

    setPlayers(updatedPlayers);

    setChatMessages([
      ...chatMessages,
      {
        id: Date.now().toString(),
        playerId: "0",
        playerName: "System",
        message: `${payload.player.username} joined the room`,
        timestamp: new Date(),
        isSystem: true,
      },
    ]);
  }

  function handlePlayerReady(payload: any) {
    const updatedPlayers = players.map((player) =>
      player.walletId === payload.wallet_id
        ? { ...player, isReady: payload.isReady }
        : player
    );
    setPlayers(updatedPlayers);
  }

  function handleKicked(payload: any) {
    toast({
      title: "Kicked from room",
      description: payload.reason || "You were kicked from the room",
      variant: "destructive",
    });
    router.push("/lobby");
  }

  // Load room data
  useEffect(() => {
    async function loadRoomData() {
      try {
        setIsRefreshingPlayers(true);
        const room: Room = await fetchRoomById(roomId);
        console.log("[DEBUG] Room data received:", room);

        if (!room) {
          throw new Error("Room data is null or undefined");
        }

        setCurrentRoom(room);
        setPlayers(room.players || []);
        setGameStatus(
          room.status === RoomStatus.WAITING ? "waiting" : "in_progress"
        );
        setGameSettings({
          questions: {
            easy: room.easyQuestions,
            medium: room.mediumQuestions,
            hard: room.hardQuestions,
          },
          timePerQuestion: room.timePerQuestion,
        });

        if (currentUser) {
          const me = room.players.find(
            (p: Player) => p.walletId === currentUser.walletId
          );
          setIsHost(Boolean(me?.isHost));
        }
      } catch (error) {
        console.error("❌ Failed to load room data:", error);
        toast({
          title: "Error",
          description: "Could not load room data",
          variant: "destructive",
        });
        router.push("/lobby");
      } finally {
        setIsRefreshingPlayers(false);
        setIsLoadingRoom(false);
      }
    }

    if (roomId) {
      loadRoomData();
    }
  }, [roomId, currentUser]);

  // ✅ NEW: Reset game state when entering new room
  useEffect(() => {
    console.log("[ROOM] Entering new room:", roomId);

    // Reset all game-related state immediately
    resetGameState();

    // Reset local state
    setChatMessages([]);
    setNewMessage("");
    setIsVoiceChatEnabled(false);
    setIsHost(false);
    setKickConfirmation({ show: false, playerId: "", playerName: "" });
    setIsRefreshingPlayers(false);
    setCountdown(0);
    setStartAt(null);
    setGameSettings(DEFAULT_GAME_SETTINGS);
    setIsLoadingRoom(true); // ✅ Set loading state to true when entering new room

    console.log("[ROOM] Game state reset for room:", roomId);
  }, [roomId, resetGameState]);

  // Question countdown timer
  useEffect(() => {
    if (!questionEndAt || gameStatus !== "in_progress") return;

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
  }, [questionEndAt, hasAnswered, currentQuestion, gameStatus]);

  // Handle time up
  const handleTimeUp = () => {
    if (!hasAnswered) {
      if (selectedAnswer) {
        // Player had selected an answer but didn't submit - submit it now
        handleAnswerSelect(selectedAnswer);
      } else {
        // Player didn't select any answer - submit "no answer"
        console.log("[FRONTEND] Time up - submitting no answer");
        setHasAnswered(true);

        // Send "no answer" to server
        sendMessage({
          type: SUBMIT_ANSWER_TYPE,
          data: {
            answer: "",
            questionStartAt: questionEndAt
              ? questionEndAt - (currentQuestion?.timePerQuestion || 10) * 1000
              : Date.now(),
          },
        });
      }
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || gameStatus !== "in_progress") return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    // Send answer to server
    sendMessage({
      type: SUBMIT_ANSWER_TYPE,
      data: {
        answer: answer,
        questionStartAt: questionEndAt
          ? questionEndAt - (currentQuestion?.timePerQuestion || 10) * 1000
          : Date.now(),
      },
    });
  };

  const handleToggleReady = useCallback(() => {
    if (!currentUser?.walletId || !currentRoom.id) return;

    const currentPlayer = players.find(
      (p) => p.walletId === currentUser.walletId
    );
    if (!currentPlayer) return;

    const newIsReady = !currentPlayer.isReady;
    const updatedPlayers = players.map((p: Player) =>
      p.walletId === currentUser.walletId ? { ...p, isReady: newIsReady } : p
    );
    setPlayers(updatedPlayers);

    changePlayerStatus(
      currentRoom.id,
      currentUser.walletId,
      newIsReady ? "ready" : "active"
    ).catch((e: any) => {
      const updated = players.map((p) =>
        p.walletId === currentUser.walletId ? { ...p, isReady: !newIsReady } : p
      );
      setPlayers(updated);
      toast({
        title: "Status Update Failed",
        description: "Failed to update ready status",
        variant: "destructive",
      });
    });
  }, [currentUser, currentRoom, players, toast]);

  // Handle start game
  const handleStartGame = () => {
    if (!isHost) return;

    sendMessage({
      type: START_GAME_TYPE,
      roomId,
    });
  };

  // Handle kick player
  const handleKickPlayer = (walletId: string, playerName: string) => {
    setKickConfirmation({ show: true, playerId: walletId, playerName });
  };

  const confirmKickPlayer = () => {
    if (kickConfirmation.playerId) {
      sendMessage({
        type: KICK_PLAYER_TYPE,
        payload: {
          wallet_id: kickConfirmation.playerId,
          room_id: roomId,
        },
      });
    }
    setKickConfirmation({ show: false, playerId: "", playerName: "" });
  };

  // Handle chat
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser?.walletId) return;

    setNewMessage("");

    sendMessage({
      type: CHAT_TYPE,
      payload: {
        sender: currentUser,
        message: newMessage.trim(),
      },
    });
  };

  // Sau khi setWinnerWallet trong game_ended hoặc khi gameStatus === 'finished' và winnerWallet có giá trị:
  useEffect(() => {
    if (gameStatus === "finished" && winnerWallet) {
      // Gọi backend để mint/transfer NFT cho winner
      awardNFT(winnerWallet).then(() => {
        toast({
          title: "NFT Awarded!",
          description: `NFT đã được mint/transfer cho winner: ${winnerWallet}`,
        });
      });
      // .catch((err) => {
      //   toast({
      //     title: "NFT Award Error",
      //     description: err.message,
      //     variant: "destructive",
      //   });
      // });
    }
  }, [gameStatus, winnerWallet]);

  // Handle leave room
  const handleLeaveRoom = useCallback(async () => {
    try {
      await leaveRoom({
        walletId: currentUser?.walletId,
        roomId,
      });

      sendMessage({
        type: LEAVE_ROOM_TYPE,
        roomId: currentRoom?.id,
        playerId: currentUser?.walletId,
      });

      closeConnection();
      setIsLoadingRoom(false);
      router.replace("/lobby");
    } catch (error) {
      console.error("Failed to leave room:", error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  }, [
    currentUser,
    currentRoom,
    roomId,
    router,
    sendMessage,
    closeConnection,
    toast,
  ]);

  useEffect(() => {
    const onPopState = async () => {
      console.log("[Back] Triggered popstate");
      await handleLeaveRoom();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleLeaveRoom]);

  // Handle finished game
  const handleFinished = () => {
    resetGameState();
    setIsLoadingRoom(false);
    router.push("/lobby");
  };

  // Pop state handler
  useEffect(() => {
    const onPopState = async () => {
      console.log("[Back] Triggered popstate");
      if (gameStatus === "finished") {
        await handleFinished();
      } else {
        await handleLeaveRoom();
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [gameStatus]);

  // Helper functions
  const getCharacterIcon = (character: string) => {
    switch (character) {
      case "ninja":
        return "🥷";
      case "wizard":
        return "🧙‍♂️";
      case "engineer":
        return "👨‍💻";
      default:
        return "👤";
    }
  };

  const readyCount = players.filter((p) => p.isReady).length;
  const readyPercentage =
    players.length > 0 ? (readyCount / players.length) * 100 : 0;

  if (!currentRoom || !currentUser || isLoadingRoom) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-neon-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {isLoadingRoom ? "Loading room..." : "Connecting to room..."}
          </p>
        </div>
      </div>
    );
  }

  // Render different states based on game status
  const renderContent = () => {
    switch (gameStatus) {
      case "waiting":
        return renderWaitingRoom();
      case "countdown":
        return renderCountdown();
      case "in_progress":
        return renderGameQuestion();
      case "question_result":
        return renderQuestionResult();
      case "finished":
        return renderGameResults();
      default:
        return renderWaitingRoom();
    }
  };

  const renderWaitingRoom = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Players + Game Settings (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Players Section */}
        <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neon-blue">
              <Users className="w-5 h-5" />
              <span>Players ({players.length}/4)</span>
            </CardTitle>
            <Progress value={readyPercentage} className="h-2 bg-cyber-darker" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isRefreshingPlayers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-neon-blue animate-spin" />
                  <span className="ml-2 text-gray-400">Loading players...</span>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No players found. Refreshing...
                </div>
              ) : (
                players.map((player) => (
                  <motion.div
                    key={player.walletId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 glass-morphism rounded-lg border border-gray-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-neon-blue/30">
                          <AvatarImage
                            src={`/avatars/${player.character}.png`}
                          />
                          <AvatarFallback className="bg-cyber-darker text-neon-blue">
                            {getCharacterIcon(player.character || "default")}
                          </AvatarFallback>
                        </Avatar>
                        {player.isHost && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-100">
                            {player.username}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-neon-purple/20 text-neon-purple"
                          >
                            Lv.{player.level}
                          </Badge>
                          {player.isReady && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/20 text-green-400 animate-pulse"
                            >
                              Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {player.walletId}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            {player.score} pts
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {player.gamesWon} wins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Ready Button for non-host players */}
                      {!player.isHost &&
                        player.walletId === currentUser.walletId && (
                          <Button
                            variant={player.isReady ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleToggleReady()}
                            className={`transition-all duration-200 ${
                              player.isReady
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-neon-blue hover:bg-neon-blue/80"
                            }`}
                          >
                            {player.isReady ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Ready
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 mr-1" />
                                Ready Up
                              </>
                            )}
                          </Button>
                        )}

                      {/* Kick Button for host */}
                      {isHost && !player.isHost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleKickPlayer(player.walletId, player.username)
                          }
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 group"
                          title="Kick player"
                        >
                          <Ban className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Section */}
        {isHost ? (
          <EnhancedGameSettings
            isHost={isHost}
            onSave={() => updateGameSettings(roomId, gameSettings)}
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
          />
        ) : (
          <GameSettingsView gameSettings={gameSettings} />
        )}
      </div>

      {/* Right Column - Chat + Room Info + Controls (1/3 width) */}
      <div className="space-y-6">
        {/* Chat Section */}
        <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm flex flex-col min-h-[300px] max-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-neon-purple">
              <span className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chat</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceChatEnabled(!isVoiceChatEnabled)}
                className={
                  isVoiceChatEnabled ? "text-green-400" : "text-gray-400"
                }
              >
                {isVoiceChatEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-grow min-h-0">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-sm ${
                      msg.isSystem ? "text-gray-500 italic" : ""
                    }`}
                  >
                    {!msg.isSystem && (
                      <span className="font-semibold text-neon-blue">
                        {msg.playerName}:{" "}
                      </span>
                    )}
                    <span
                      className={
                        msg.isSystem ? "text-gray-400" : "text-gray-300"
                      }
                    >
                      {msg.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-cyber-darker border-gray-700 focus:border-neon-purple"
                onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-neon-purple hover:bg-neon-purple/80 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Room Info Section */}
        <Card className="glass-morphism-deep border border-gray-700/50 shadow-neon-glow-sm">
          <CardHeader>
            <CardTitle className="text-gray-300">Room Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Room Code:</span>
              <span className="text-neon-blue font-mono">
                #{currentRoom.roomCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Players:</span>
              <span className="text-gray-300">{players.length}/4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ready:</span>
              <span className="text-green-400">
                {readyCount}/{players.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-neon-purple">Waiting</span>
            </div>
          </CardContent>
        </Card>

        {/* Host Controls Section */}
        {isHost && (
          <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-neon-blue">
                <Crown className="w-5 h-5" />
                <span>Host Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 animate-glow-pulse transition-all duration-200"
                disabled={readyCount < 2 || gameStatus !== "waiting"}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/room/${roomId}`
                  );
                  toast({
                    title: "Link copied!",
                    description: "Room link copied to clipboard",
                  });
                }}
                className="w-full border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 transition-all duration-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCountdown = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8">
          <TimerCircle
            duration={3}
            className="mx-auto"
            onTimeUp={handleTimeUp}
            isPaused={false}
          />
        </div>
        <h2 className="text-4xl font-orbitron font-bold mb-4 text-neon-blue drop-shadow-neon">
          Game Starting in...
        </h2>
        <div className="text-6xl font-orbitron font-bold text-neon-purple animate-pulse">
          {countdown}
        </div>
        <p className="text-xl text-gray-400 mt-4">
          Get ready for {totalQuestions} questions!
        </p>
      </motion.div>
    </div>
  );

  const renderGameQuestion = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl">
        {/* Question Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Badge
              variant="secondary"
              className="bg-neon-blue/20 text-neon-blue text-lg px-4 py-2"
            >
              Question {questionIndex + 1} of {totalQuestions}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-neon-purple/20 text-neon-purple text-lg px-4 py-2"
            >
              {questionCountdown}s remaining
            </Badge>
          </div>
          <TimerCircle
            duration={currentQuestion?.timePerQuestion || 10}
            onTimeUp={handleTimeUp}
            isPaused={false}
            className="mx-auto"
          />
        </div>

        {/* Question Content */}
        <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-neon-blue text-center drop-shadow-lg">
              {currentQuestion?.content}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
              {currentQuestion?.options?.map((opt: string, idx: number) => {
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
                    onClick={() => handleAnswerSelect(opt)}
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
          </CardContent>
        </Card>

        {hasAnswered && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 animate-pulse">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">
                Answer submitted! Waiting for next question...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuestionResult = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Result Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-orbitron font-bold mb-4 text-neon-blue drop-shadow-neon">
              Question {questionIndex + 1} Results
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-400 text-lg px-4 py-2"
              >
                Correct Answer: {questionResult?.correctAnswer}
              </Badge>
            </div>
          </div>

          {/* Answer Distribution */}
          <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-md mb-8">
            <CardHeader>
              <CardTitle className="text-neon-purple">
                Answer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questionResult?.answerStats &&
              questionResult?.correctAnswer &&
              questionResult?.totalPlayers &&
              questionResult?.options ? (
                <AnswerDistributionChart
                  answerStats={questionResult.answerStats}
                  correctAnswer={questionResult.correctAnswer}
                  totalPlayers={questionResult.totalPlayers}
                  options={[...questionResult.options, "No Answer"]}
                  currentUserSelection={selectedAnswer || undefined}
                  totalResponses={questionResult.totalResponses || 0}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Loading answer distribution...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Leaderboard with Rank Change Effects */}
          <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
            <CardHeader>
              <CardTitle className="text-neon-blue">
                Current Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionResult?.leaderboard?.map((player, idx) => {
                  const isCurrentUser =
                    player.walletId === currentUser?.walletId;
                  const isTop3 = idx < 3;

                  return (
                    <motion.div
                      key={player.walletId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`relative p-4 rounded-lg border transition-all duration-300 ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue shadow-neon-glow"
                          : isTop3
                          ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                          : "bg-cyber-darker/50 border-gray-700/50"
                      }`}
                    >
                      {/* Rank Change Indicator */}
                      <motion.div
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                      >
                        {(player.rankChange ?? 0) > 0 ? (
                          <div className="bg-green-500 text-white animate-bounce">
                            ↑{player.rankChange}
                          </div>
                        ) : (player.rankChange ?? 0) < 0 ? (
                          <div className="bg-red-500 text-white animate-bounce">
                            ↓{Math.abs(player.rankChange ?? 0)}
                          </div>
                        ) : (
                          <div className="bg-gray-500 text-white">–</div>
                        )}
                      </motion.div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isTop3
                                ? idx === 0
                                  ? "bg-yellow-500 text-black"
                                  : idx === 1
                                  ? "bg-gray-400 text-black"
                                  : "bg-orange-500 text-black"
                                : isCurrentUser
                                ? "bg-neon-purple text-white"
                                : "bg-neon-blue text-white"
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.1 + 0.2,
                            }}
                          >
                            {player.rank}
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-100 flex items-center gap-2">
                              {player.username}
                              {isCurrentUser && (
                                <span className="text-neon-blue text-sm font-bold">
                                  (You)
                                </span>
                              )}
                              {isTop3 && (
                                <span className="text-yellow-400">
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {player.walletId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.div
                            className={`text-xl font-bold ${
                              isTop3
                                ? "text-yellow-400"
                                : isCurrentUser
                                ? "text-neon-purple"
                                : "text-cyan-400"
                            }`}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.1 + 0.4,
                            }}
                          >
                            {player.score}
                          </motion.div>
                          <div className="text-sm text-gray-400">points</div>
                        </div>
                      </div>

                      {/* Score Change Animation */}
                      {player.scoreChange && (
                        <motion.div
                          className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-bold ${
                            player.scoreChange > 0
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.1 + 0.6 }}
                        >
                          {player.scoreChange > 0 ? "+" : ""}
                          {player.scoreChange}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Next Question Countdown */}
          {gameStatus === "finished" ? (
            <button
              className="mt-8 px-6 py-3 rounded-lg bg-neon-blue text-white font-bold shadow-neon-glow hover:bg-neon-purple transition-all"
              onClick={handleFinished}
            >
              Back to Lobby
            </button>
          ) : (
            <div className="text-center mt-8">
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-neon-purple animate-pulse">
                <Timer className="w-5 h-5" />
                <span className="font-semibold">
                  Next question in 3 seconds...
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  const renderGameResults = () => {
    // Sort results by score for proper ranking
    const sortedResults = [...gameResults].sort((a, b) => b.score - a.score);

    // Find current player's position
    const currentPlayerRank =
      sortedResults.findIndex(
        (player) =>
          player.walletId === currentUser?.walletId ||
          player.wallet === currentUser?.walletId
      ) + 1;

    const getRankIcon = (rank: number) => {
      if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
      if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
      if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
      if (rank <= 10) return <Star className="w-4 h-4 text-purple-400" />;
      return <Target className="w-4 h-4 text-blue-400" />;
    };

    const getPodiumStyling = (rank: number) => {
      switch (rank) {
        case 1:
          return {
            bgGradient: "bg-gradient-to-r from-yellow-600/40 to-yellow-500/40",
            border: "border-l-4 border-yellow-400",
            rankColor: "text-yellow-300",
            rankIcon: "🥇",
            glow: "shadow-lg shadow-yellow-500/20",
          };
        case 2:
          return {
            bgGradient: "bg-gradient-to-r from-gray-400/40 to-gray-300/40",
            border: "border-l-4 border-gray-300",
            rankColor: "text-gray-300",
            rankIcon: "🥈",
            glow: "shadow-lg shadow-gray-400/20",
          };
        case 3:
          return {
            bgGradient: "bg-gradient-to-r from-amber-600/40 to-amber-500/40",
            border: "border-l-4 border-amber-400",
            rankColor: "text-amber-300",
            rankIcon: "🥉",
            glow: "shadow-lg shadow-amber-500/20",
          };
        default:
          return {
            bgGradient: "",
            border: "",
            rankColor: "text-cyan-300",
            rankIcon: "",
            glow: "",
          };
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Game Results Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-orbitron font-bold mb-6 text-neon-blue drop-shadow-neon">
                🎮 Game Complete! 🎮
              </h2>
              {winnerWallet && (
                <motion.div
                  className="mb-6 px-8 py-6 rounded-xl bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 text-white font-bold text-3xl shadow-neon-glow flex items-center justify-center gap-4 animate-pulse"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Trophy className="w-10 h-10 text-yellow-300 drop-shadow" />
                  <span className="text-yellow-300">
                    🏆 Champion:{" "}
                    {sortedResults[0]?.username ||
                      sortedResults[0]?.oath ||
                      winnerWallet}
                  </span>
                  <Trophy className="w-10 h-10 text-yellow-300 drop-shadow" />

                  {/* Confetti effect for winner */}
                  {winnerWallet === currentUser?.walletId && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <div
                        className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="absolute top-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="absolute top-0 left-3/4 w-2 h-2 bg-red-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                      <div
                        className="absolute top-4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.6s" }}
                      ></div>
                      <div
                        className="absolute top-4 left-2/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.8s" }}
                      ></div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Current Player Position */}
              {currentPlayerRank > 0 && (
                <motion.div
                  className="mb-6 px-6 py-4 rounded-xl bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 border border-neon-blue/50 text-white font-bold text-xl shadow-neon-glow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Target className="w-6 h-6 text-neon-blue" />
                    <span>Your Position: </span>
                    <span className="text-neon-purple font-orbitron text-2xl">
                      #{currentPlayerRank}
                    </span>
                    {currentPlayerRank === 1 && (
                      <span className="text-yellow-300 ml-2">🎉 You Won!</span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Game Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-md">
                <CardHeader>
                  <CardTitle className="text-neon-purple text-xl">
                    📊 Game Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                      <div className="text-2xl font-orbitron font-bold text-neon-blue">
                        {sortedResults.length}
                      </div>
                      <div className="text-sm text-gray-400">Players</div>
                    </div>
                    <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                      <div className="text-2xl font-orbitron font-bold text-neon-purple">
                        {totalQuestions}
                      </div>
                      <div className="text-sm text-gray-400">Questions</div>
                    </div>
                    <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                      <div className="text-2xl font-orbitron font-bold text-green-400">
                        {Math.round(
                          sortedResults.reduce((sum, p) => sum + p.score, 0) /
                            sortedResults.length
                        )}
                      </div>
                      <div className="text-sm text-gray-400">Avg Score</div>
                    </div>
                    <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                      <div className="text-2xl font-orbitron font-bold text-yellow-400">
                        {sortedResults[0]?.score || 0}
                      </div>
                      <div className="text-sm text-gray-400">Top Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Podium Display for Top 3 */}
            {sortedResults.length >= 3 && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
                  <CardHeader>
                    <CardTitle className="text-center text-neon-blue text-2xl">
                      🏆 Podium Winners 🏆
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      {/* 2nd Place */}
                      <motion.div
                        className="order-1 md:order-1 text-center"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        <Card className="bg-black/30 backdrop-blur-xl border border-gray-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-gray-500/20 transition-all duration-300">
                          <CardContent className="p-0">
                            <div className="text-6xl mb-4">🥈</div>
                            <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <span className="text-xl font-bold text-white">
                                {sortedResults[1]?.username?.substring(0, 4) ||
                                  "N/A"}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">
                              {sortedResults[1]?.username ||
                                sortedResults[1]?.oath ||
                                "Unknown"}
                            </h3>
                            <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                              {sortedResults[1]?.score || 0}
                            </div>
                            <div className="text-sm text-gray-400">
                              2nd Place
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* 1st Place - Enhanced */}
                      <motion.div
                        className="order-2 md:order-2 text-center"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <Card className="bg-black/30 backdrop-blur-xl border-2 border-yellow-400/70 rounded-lg p-8 mb-4 shadow-2xl shadow-yellow-500/30 animate-pulse">
                          <CardContent className="p-0">
                            <div className="text-8xl mb-4 animate-bounce">
                              🥇
                            </div>
                            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
                              <span className="text-xl font-bold text-white">
                                {sortedResults[0]?.username?.substring(0, 4) ||
                                  "N/A"}
                              </span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-2 text-white">
                              {sortedResults[0]?.username ||
                                sortedResults[0]?.oath ||
                                "Unknown"}
                            </h3>
                            <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                              {sortedResults[0]?.score || 0}
                            </div>
                            <div className="text-sm text-yellow-300 font-bold">
                              🏆 Champion
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* 3rd Place */}
                      <motion.div
                        className="order-3 md:order-3 text-center"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Card className="bg-black/30 backdrop-blur-xl border border-orange-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
                          <CardContent className="p-0">
                            <div className="text-6xl mb-4">🥉</div>
                            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <span className="text-xl font-bold text-white">
                                {sortedResults[2]?.username?.substring(0, 4) ||
                                  "N/A"}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">
                              {sortedResults[2]?.username ||
                                sortedResults[2]?.oath ||
                                "Unknown"}
                            </h3>
                            <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                              {sortedResults[2]?.score || 0}
                            </div>
                            <div className="text-sm text-gray-400">
                              3rd Place
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Full Results Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
                <CardHeader>
                  <CardTitle className="text-neon-blue text-xl">
                    Final Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr className="bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 text-white">
                          <th className="px-6 py-3 rounded-tl-xl text-left">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left">Player</th>
                          <th className="px-6 py-3 text-center">Score</th>
                          <th className="px-6 py-3 rounded-tr-xl text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {sortedResults.map((player, idx) => {
                            const rank = idx + 1;
                            const isPodium = rank <= 3;
                            const isCurrentUser =
                              player.walletId === currentUser?.walletId ||
                              player.wallet === currentUser?.walletId;
                            const isWinner =
                              winnerWallet === player.walletId ||
                              winnerWallet === player.wallet;
                            const styling = getPodiumStyling(rank);

                            return (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                className={`transition-all duration-200 text-center ${
                                  isWinner
                                    ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400 shadow-neon-glow font-bold scale-105"
                                    : isCurrentUser
                                    ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-2 border-neon-blue shadow-neon-glow font-bold"
                                    : "bg-cyber-darker/80 hover:bg-neon-blue/10 border border-neon-blue/20"
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        isPodium
                                          ? "bg-yellow-500 text-black"
                                          : isCurrentUser
                                          ? "bg-neon-purple text-white"
                                          : "bg-neon-blue text-white"
                                      }`}
                                    >
                                      {rank}
                                    </div>
                                    {getRankIcon(rank)}
                                    {isCurrentUser && (
                                      <span className="text-neon-blue text-xs font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-left">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">
                                        {(player.username || player.oath || "U")
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-100">
                                        {player.username ||
                                          player.oath ||
                                          "Unknown"}
                                        {isCurrentUser && (
                                          <span className="ml-2 text-neon-blue text-sm font-bold">
                                            (You)
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-400 font-mono">
                                        {player.walletId ||
                                          player.wallet ||
                                          "Unknown"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div
                                    className={`font-bold text-shadow-cyber ${
                                      isWinner
                                        ? "text-3xl text-yellow-200"
                                        : isPodium
                                        ? rank === 2
                                          ? "text-xl text-gray-200"
                                          : "text-xl text-amber-200"
                                        : isCurrentUser
                                        ? "text-xl text-neon-purple"
                                        : "text-xl text-cyan-200"
                                    }`}
                                  >
                                    {player.score}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {isWinner ? (
                                    <span className="flex items-center gap-1 text-yellow-300 font-bold">
                                      <Crown className="w-5 h-5" /> Champion
                                    </span>
                                  ) : isCurrentUser ? (
                                    <span className="flex items-center gap-1 text-neon-blue font-bold">
                                      <Target className="w-4 h-4" /> You
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">
                                      Player
                                    </span>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleFinished}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 px-8 py-4 text-xl font-bold shadow-lg hover:shadow-xl"
                >
                  <ArrowLeft className="w-6 h-6 mr-3" />
                  Back to Home
                </Button>

                <Button
                  onClick={() => {
                    // Copy results to clipboard
                    const resultsText = `🎮 Quiz Game Results 🎮\n\n🏆 Champion: ${
                      sortedResults[0]?.username || sortedResults[0]?.oath
                    }\n📊 Your Position: #${currentPlayerRank}\n\n${sortedResults
                      .map(
                        (p, idx) =>
                          `${idx + 1}. ${p.username || p.oath}: ${p.score} pts`
                      )
                      .join("\n")}`;
                    navigator.clipboard.writeText(resultsText);
                    toast({
                      title: "Results Copied!",
                      description: "Game results copied to clipboard",
                      variant: "default",
                    });
                  }}
                  variant="outline"
                  className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 transition-all duration-200 px-6 py-4 text-lg font-bold"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Results
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );

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
                    gameStatus === "finished" ? handleFinished : handleLeaveRoom
                  }
                  className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                      Room #{currentRoom?.roomCode}
                    </h1>
                    <p className="text-sm text-gray-400 capitalize">
                      {gameStatus.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center space-x-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Connection Status */}
                <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isWsConnected ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span className="font-orbitron text-sm text-gray-300">
                    {isWsConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {/* Game Status Indicators */}
                {gameStatus === "waiting" && (
                  <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                    <Zap className="w-5 h-5 text-neon-blue" />
                    <span className="font-orbitron font-bold text-neon-blue">
                      {readyCount}/{players.length} Ready
                    </span>
                  </div>
                )}

                {gameStatus === "in_progress" && (
                  <>
                    <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                      <Clock className="w-5 h-5 text-neon-purple" />
                      <span className="font-orbitron text-lg font-bold text-neon-purple">
                        {questionCountdown}s
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                      <HelpCircle className="w-5 h-5 text-neon-blue" />
                      <span className="font-orbitron font-bold text-neon-blue">
                        {questionIndex + 1}/{totalQuestions}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">{renderContent()}</div>

        {/* Kick Confirmation Dialog */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${
            kickConfirmation.show
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          } transition-opacity duration-200`}
        >
          <Card className="glass-morphism-deep border border-red-500/30 shadow-neon-glow-md max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-lg font-semibold text-red-400">
                  Kick Player
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Are you sure you want to kick {kickConfirmation.playerName}?
              </p>
              <div className="bg-cyber-dark/50 rounded-lg p-3 mb-4">
                <p className="text-gray-300">
                  <span className="text-red-400 font-semibold">
                    {kickConfirmation.playerName}
                  </span>
                  will be removed from the room and won't be able to rejoin.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setKickConfirmation({
                      show: false,
                      playerId: "",
                      playerName: "",
                    })
                  }
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmKickPlayer}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Confirm Kick
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Players List */}
          <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-orbitron font-bold text-neon-purple mb-6 text-center">
                Players
              </h3>
              <div className="space-y-4">
                {players.map((player) => (
                  <PlayerCard key={player.walletId} player={player} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Actions - chỉ hiển thị khi game kết thúc */}
          {gameStatus === RoomStatus.FINISHED && isConnected && (
            <div className="mt-6 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold shadow hover:scale-105 transition-all">
              <h3 className="text-xl font-orbitron font-bold text-neon-purple mb-6 text-center">
                Blockchain Actions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="font-orbitron text-lg text-green-400">
                    Game Ended
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                  <span className="font-orbitron text-lg text-yellow-300">
                    Winner: {winnerWallet ? winnerWallet : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-6 h-6 text-blue-400" />
                  <span className="font-orbitron text-lg text-blue-400">
                    View on Explorer
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Confetti Effect */}
        <ConfettiEffect isActive={showConfetti} color="#fbbf24" />
      </div>
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
                  gameStatus === "finished" ? handleFinished : handleLeaveRoom
                }
                className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                    Room #{currentRoom?.roomCode}
                  </h1>
                  <p className="text-sm text-gray-400 capitalize">
                    {gameStatus.replace("_", " ")}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isWsConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span className="font-orbitron text-sm text-gray-300">
                  {isWsConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Game Status Indicators */}
              {gameStatus === "waiting" && (
                <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                  <Zap className="w-5 h-5 text-neon-blue" />
                  <span className="font-orbitron font-bold text-neon-blue">
                    {readyCount}/{players.length} Ready
                  </span>
                </div>
              )}

              {gameStatus === "in_progress" && (
                <>
                  <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                    <Clock className="w-5 h-5 text-neon-purple" />
                    <span className="font-orbitron text-lg font-bold text-neon-purple">
                      {questionCountdown}s
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                    <HelpCircle className="w-5 h-5 text-neon-blue" />
                    <span className="font-orbitron font-bold text-neon-blue">
                      {questionIndex + 1}/{totalQuestions}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">{renderContent()}</div>

      {/* Kick Confirmation Dialog */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${
          kickConfirmation.show
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        } transition-opacity duration-200`}
      >
        <Card className="glass-morphism-deep border border-red-500/30 shadow-neon-glow-md max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-lg font-semibold text-red-400">
                Kick Player
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to kick {kickConfirmation.playerName}?
            </p>
            <div className="bg-cyber-dark/50 rounded-lg p-3 mb-4">
              <p className="text-gray-300">
                <span className="text-red-400 font-semibold">
                  {kickConfirmation.playerName}
                </span>
                will be removed from the room and won't be able to rejoin.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  setKickConfirmation({
                    show: false,
                    playerId: "",
                    playerName: "",
                  })
                }
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmKickPlayer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              >
                <Ban className="w-4 h-4 mr-2" />
                Confirm Kick
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confetti Effect */}
      <ConfettiEffect isActive={showConfetti} color="#fbbf24" />
    </div>
  );
}
