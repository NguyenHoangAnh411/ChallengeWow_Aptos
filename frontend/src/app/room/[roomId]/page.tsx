"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Trophy,
  Zap,
  Loader,
  ExternalLink,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiEffect from "@/components/confetti-effect";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Room, User, Player } from "@/types/schema";
import { GameStatus } from "@/types/GameStatus";
import {
  awardNFT,
  fetchRoomById,
  leaveRoom,
  changePlayerStatus,
  fetchRoomResults,
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
  ROOM_CONFIG_UPDATE_TYPE,
  PLAYER_JOINED_TYPE,
  PLAYER_READY_TYPE,
  PLAYER_LEFT_TYPE,
  HOST_TRANSFER_TYPE,
  PLAYER_DISCONNECTED_TYPE,
  GAME_SYNC_TYPE,
  PLAYER_RECONNECTED_TYPE,
} from "@/lib/constants";
import { DEFAULT_GAME_SETTINGS } from "@/app/config/GameSettings";
import { useAccount } from "wagmi";
import PlayerCard from "@/components/player-card";
import type { ChatMessage as ChatMsg, Sender } from "@/types/chat-message";
import { GameResults } from "@/components/game/game-result";
import { QuestionResult } from "@/components/game/question_result";
import { GameWaiting } from "@/components/game/game-waiting";
import { GameCountdown } from "@/components/game/game-countdown";
import { GameQuestion } from "@/components/game/game-question";

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
    setQuestionCountdown,
    hasAnswered,
    setHasAnswered,
    selectedAnswer,
    setSelectedAnswer,
    currentQuestion,
    setCurrentQuestion,
    questionResult,
    setQuestionResult,
    setGameResults,
    winnerWallet,
    setWinnerWallet,
    resetGameState,
    setGameSettings,
    currentPlayer,
    setCurrentPlayer,
    readyCount,
    setReadyCount,
  } = useGameState();

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isRefreshingPlayers, setIsRefreshingPlayers] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // WebSocket connection
  const { sendMessage, isWsConnected, closeConnection } = useWebSocket({
    url: currentUser?.walletId
      ? `/${roomId}?wallet_id=${currentUser?.walletId}`
      : undefined,
    onMessage: handleWebSocketMessage,
    onClose: () => {
      sendMessage({
        type: PLAYER_DISCONNECTED_TYPE,
        data: {
          walletId: currentUser?.walletId,
          roomId: roomId,
        },
      });
    },
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
      case PLAYER_LEFT_TYPE:
        handlePlayerLeft(data);
        break;
      case KICKED_TYPE:
        handleKicked(data.payload);
        break;
      case ROOM_CONFIG_UPDATE_TYPE:
        setGameSettings(data.payload);
        break;
      case PLAYER_READY_TYPE:
        handlePlayerReady(data.payload);
        break;
      case PLAYER_RECONNECTED_TYPE:
        handlePlayerReconnected(data.payload);
        break;
      case PLAYER_DISCONNECTED_TYPE:
        handlePlayerDisconnected(data.payload);
        break;
      case GAME_SYNC_TYPE:
        handleSyncGame(data.payload);
        break;
      case HOST_TRANSFER_TYPE:
        handleHostTransfer(data.payload);
        break;
      default:
        console.log("[WS] Unknown message type:", data.type);
    }
  }

  function handleGameStarted(payload: any) {
    console.log("[GAME] Game started:", payload);
    setGameStatus(GameStatus.COUNTING_DOWN);
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
        setGameStatus(GameStatus.IN_PROGRESS);
      }
    }, 1000);
  }

  function handlePlayerDisconnected({ walletId }: { walletId: string }) {
    const { players, setPlayers } = useGameState.getState();

    const inactivePlayer = players.find((p) => p.walletId === walletId);
    if (!inactivePlayer) return;

    // Thay vì xóa, hãy cập nhật trạng thái của họ
    const updatedPlayers = players.map((player) =>
      player.walletId === walletId
        ? { ...player, status: "disconnected", isReady: false }
        : player
    );

    setPlayers(updatedPlayers);
    // -----------------------

    // Tạo system message (giữ nguyên)
    const sysMsg: ChatMsg = {
      sender: {
        id: Date.now().toString(),
        walletId: "system",
        username: "System",
        timestamp: new Date(),
        isSystem: true,
      },
      message: `🔴 ${inactivePlayer.username} has disconnected.`,
    };

    setChatMessages((prev) => [...prev, sysMsg]);
  }

  function handlePlayerReconnected(payload: {
    walletId: string;
    username: string;
    status: string;
  }) {
    console.log(
      `[RECONNECT] Player ${payload.username} has reconnected with ${payload.status} status.`
    );

    // Tìm và cập nhật trạng thái của người chơi trong danh sách
    const updatedPlayers = players.map((player) =>
      player.walletId === payload.walletId
        ? {
            ...player,
            status: payload.status,
            isReady: payload.status === "ready",
          } // Cập nhật lại status thành 'active'
        : player
    );

    setPlayers(updatedPlayers);
    const readyCount = updatedPlayers.filter((p) => p.isReady).length;
    setReadyCount(readyCount);
    setCurrentPlayer(
      updatedPlayers.find((p) => p.walletId === currentUser?.walletId) ?? null
    );

    const sysMsg: ChatMsg = {
      sender: {
        id: Date.now().toString(),
        walletId: "system",
        username: "System",
        timestamp: new Date(),
        isSystem: true,
      },
      message: `🟢 ${payload.username} has reconnected.`,
    };

    setChatMessages((prev) => [...prev, sysMsg]);
  }

  function handleSyncGame(data: any) {
    // Lấy ra các action từ store Zustand
    const {
      setGameStatus,
      setPlayers,
      setCurrentPlayer,
      setGameSettings,
      setTotalQuestions,
      setQuestionIndex,
      setCurrentQuestion,
      setQuestionStartAt,
      setQuestionEndAt,
      setGameResults,
      setWinnerWallet,
      setIsGameActive,
      setQuestionResult,
      // Lấy state hiện tại để tìm ra người chơi hiện tại
      currentUser,
    } = useGameState.getState();

    console.log("[SYNC] Received game_sync payload:", data);

    // 1. Cập nhật trạng thái chung của game
    if (data.status) {
      const gameStatus = data.status as GameStatus;
      setGameStatus(gameStatus);
      // Game được coi là active nếu nó đang chạy hoặc đã kết thúc
      setIsGameActive(
        gameStatus === GameStatus.IN_PROGRESS ||
          gameStatus === GameStatus.FINISHED
      );
    }

    // 2. Cập nhật danh sách người chơi và người chơi hiện tại
    if (data.players && Array.isArray(data.players)) {
      const players: Player[] = data.players;
      setPlayers(players);
      // Sau khi cập nhật danh sách, tìm và đặt người chơi hiện tại
      if (currentUser?.walletId) {
        const playerForCurrentUser = players.find(
          (p) => p.walletId === currentUser.walletId
        );
        setCurrentPlayer(playerForCurrentUser || null);
      }
    }

    // 3. Cập nhật cài đặt phòng
    if (data.roomSettings) {
      setGameSettings(data.roomSettings);
      const { easy, medium, hard } = data.roomSettings.questions;
      setTotalQuestions((easy || 0) + (medium || 0) + (hard || 0));
    }

    // 4. Cập nhật tiến trình game
    if (data.progress) {
      if (typeof data.progress.current === "number") {
        //   Lưu ý: questionIndex trong state của bạn là 0-based, còn server gửi là 1-based
        setQuestionIndex(data.progress.current - 1);
      }
      if (typeof data.progress.total === "number") {
        setTotalQuestions(data.progress.total);
      }
    }

    // 5. Cập nhật câu hỏi hiện tại (nếu có)
    // Reset trạng thái câu hỏi cũ trước khi đặt câu hỏi mới
    setHasAnswered(false);
    setSelectedAnswer(null);
    setQuestionResult(null);

    if (data.currentQuestion) {
      const { question, timing, questionIndex } = data.currentQuestion;

      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      if (timing) {
        setQuestionStartAt(timing.questionStartAt);
        setQuestionEndAt(timing.questionEndAt);
      }
    } else {
      // Nếu không có câu hỏi hiện tại, đảm bảo state được dọn dẹp
      setCurrentQuestion(null);
      setQuestionStartAt(null);
      setQuestionEndAt(null);
    }

    // 6. Cập nhật kết quả game (nếu game đã kết thúc)
    if (data.gameResult) {
      const { leaderboard, winner } = data.gameResult;
      if (leaderboard) {
        setGameResults(leaderboard);
      }
      if (winner && winner.walletId) {
        setWinnerWallet(winner.walletId);
      }
    }
  }

  function handlePlayerLeft(data: any) {
    const { walletId, username } = data.payload;
    const action = data.action;
    const updatedPlayers = players.filter((p) => p.walletId !== walletId);
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> fd9a8f2 (feat(ui): game result when game end for disconnected user)
=======

>>>>>>> c272a52 (feat(ui): host change logic)
    setPlayers(updatedPlayers);

    const sysSender: Sender = {
      id: Date.now().toString(),
      walletId: "system",
      username: "System",
      timestamp: new Date(),
      isSystem: true,
    };

    const sysMsg: ChatMsg = {
      sender: sysSender,
      message: `${username} ${
        action === "kick" ? "was kicked" : "left"
      } the room`,
    };

    setChatMessages((prev) => [...prev, sysMsg]);
  }

  function handleNextQuestion(payload: any) {
    console.log("[GAME] Next question:", payload);
    setGameStatus(GameStatus.IN_PROGRESS);
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
    setGameStatus(GameStatus.QUESTION_RESULT);

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
    setGameStatus(GameStatus.FINISHED);

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

  function handleChatMessage(payload: any) {
    const rawSender = payload.sender || {};
    const sender: Sender = {
      id: rawSender.id || Date.now().toString(),
      walletId:
        rawSender.walletId || (typeof rawSender === "string" ? rawSender : ""),
      username: rawSender.username || rawSender.walletId || "Unknown",
      timestamp: rawSender.timestamp
        ? new Date(rawSender.timestamp)
        : new Date(),
      isSystem: rawSender.isSystem,
    } as Sender;

    const chat: ChatMsg = {
      sender,
      message: payload.message ?? "",
    };

    setChatMessages((prev) => [...prev, chat]);
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

    const sysSender: Sender = {
      id: Date.now().toString(),
      walletId: "system",
      username: "System",
      timestamp: new Date(),
      isSystem: true,
    };

    const sysMsg: ChatMsg = {
      sender: sysSender,
      message: `${payload.player.username} joined the room`,
    };

    setChatMessages((prev) => [...prev, sysMsg]);
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

  function handleHostTransfer(payload: any) {
    console.log("[HOST_TRANSFER] New host:", payload);

    if (!payload.new_host_wallet_id || !payload.new_host_username) {
      console.error("[HOST_TRANSFER] Invalid payload:", payload);
      return;
    }

    // Update players list to reflect new host
    const updatedPlayers = players.map((player) => ({
      ...player,
      isHost: player.walletId === payload.new_host_wallet_id,
      isReady: player.walletId === payload.new_host_wallet_id,
    }));

    setPlayers(updatedPlayers);

    // Update current player if it's the new host
    if (currentUser?.walletId === payload.new_host_wallet_id) {
      const updatedCurrentPlayer = updatedPlayers.find(
        (p) => p.walletId === currentUser?.walletId
      );
      setCurrentPlayer(updatedCurrentPlayer || null);

      // Show special toast for current user becoming host
      toast({
        title: "👑 You are now the host!",
        description: "You can now start the game and manage the room",
        variant: "default",
      });
    } else {
      // Show toast notification for other players
      toast({
        title: "👑 Host Transferred",
        description: `${payload.new_host_username} is now the new host`,
        variant: "default",
      });
    }

    // Add system message to chat
    const sysSender: Sender = {
      id: Date.now().toString(),
      walletId: "system",
      username: "System",
      timestamp: new Date(),
      isSystem: true,
    };

    const sysMsg: ChatMsg = {
      sender: sysSender,
      message: `👑 ${payload.new_host_username} is now the new host`,
    };

    setChatMessages((prev) => [...prev, sysMsg]);
  }

  // Load room data
  useEffect(() => {
    async function loadRoomData() {
      try {
        setIsRefreshingPlayers(true);
        const room: Room = await fetchRoomById(roomId);

        if (!room) {
          throw new Error("Room data is null or undefined");
        }

        if (room.status === GameStatus.FINISHED) {
          const results = await fetchRoomResults(roomId);
          setGameResults(results.leaderboard || []);
          setWinnerWallet(results.winner?.walletId || null);
          setTotalQuestions(results.gameStats.totalQuestions);
        }

        console.log("ROOMM: ", room.players);

        setCurrentRoom(room);
        setPlayers(room.players || []);
<<<<<<< HEAD
        setTotalQuestions(room.totalQuestions);
        setCurrentPlayer(
          room.players.find((p) => p.walletId === currentUser?.walletId) ?? null
        );
=======
>>>>>>> c272a52 (feat(ui): host change logic)
        setGameStatus(room.status);
        setGameSettings({
          questions: {
            easy: room.easyQuestions,
            medium: room.mediumQuestions,
            hard: room.hardQuestions,
          },
          timePerQuestion: room.timePerQuestion,
        });
        setReadyCount(players.filter((p) => p.isReady).length);

        if (room.winnerWalletId) {
          setWinnerWallet(room.winnerWalletId);
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

  useEffect(() => {
    if (players.length && currentUser?.walletId) {
      const foundPlayer = players.find(
        (p) => p.walletId.toLowerCase() === currentUser.walletId.toLowerCase()
      );
      setCurrentPlayer(foundPlayer ?? null);
    }
    setReadyCount(players.filter((p) => p.isReady).length);
  }, [players, currentUser]);

  useEffect(() => {
    console.log("[ROOM] Entering new room:", roomId);

    // Reset all game-related state immediately
    resetGameState();

    // Reset local state
    setChatMessages([]);
    setIsRefreshingPlayers(false);
    setCountdown(0);
    setStartAt(null);
    setGameSettings(DEFAULT_GAME_SETTINGS);
    setIsLoadingRoom(true); // ✅ Set loading state to true when entering new room

    console.log("[ROOM] Game state reset for room:", roomId);
  }, [roomId, resetGameState]);

  // Question countdown timer
  useEffect(() => {
    if (!questionEndAt || gameStatus !== GameStatus.IN_PROGRESS) return;

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
          },
        });
      }
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || gameStatus !== GameStatus.IN_PROGRESS) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    // Send answer to server
    sendMessage({
      type: SUBMIT_ANSWER_TYPE,
      data: {
        answer: answer,
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
    if (!currentPlayer?.isHost) return;
    sendMessage({
      type: START_GAME_TYPE,
      roomId,
    });
  };

  // Handle chat
  const handleSendMessage = (message: string) => {
    if (!message.trim() || !currentUser?.walletId) return;

    sendMessage({
      type: CHAT_TYPE,
      payload: {
        sender: currentUser,
        message: message.trim(),
      },
    });
  };

  // Sau khi setWinnerWallet trong game_ended hoặc khi gameStatus === 'finished' và winnerWallet có giá trị:
  useEffect(() => {
    if (gameStatus === GameStatus.FINISHED && winnerWallet) {
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
  const handleFinished = async () => {
    setIsLoadingRoom(true);
    await handleLeaveRoom();
    resetGameState();
    setIsLoadingRoom(false);
  };

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
      case GameStatus.WAITING:
        return renderGameWaiting();
      case GameStatus.COUNTING_DOWN:
        return (
          <GameCountdown countdown={countdown} handleTimeUp={handleTimeUp} />
        );
      case GameStatus.IN_PROGRESS:
        return <GameQuestion onAnswerSelect={handleAnswerSelect} />;
      case GameStatus.QUESTION_RESULT:
        return <QuestionResult handleFinished={handleFinished} />;
      case GameStatus.FINISHED:
        return <GameResults handleFinished={handleFinished} />;
      default:
        return renderGameWaiting();
    }
  };

  const renderGameWaiting = () => {
    return (
      <GameWaiting
        chatMessages={chatMessages}
        handleStartGame={handleStartGame}
        handleToggleReady={handleToggleReady}
        handleSendMessage={handleSendMessage}
        isRefreshingPlayers={isRefreshingPlayers}
        setIsRefreshingPlayers={setIsRefreshingPlayers}
        roomId={roomId}
        sendMessage={sendMessage}
      />
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
                onClick={async () => {
                  if (gameStatus === GameStatus.FINISHED) {
                    await handleFinished();
                  } else {
                    await handleLeaveRoom();
                  }
                }}
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
              {gameStatus === GameStatus.WAITING && (
                <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                  <Zap className="w-5 h-5 text-neon-blue" />
                  <span className="font-orbitron font-bold text-neon-blue">
                    {readyCount}/{players.length} Ready
                  </span>
                </div>
              )}

              {gameStatus === GameStatus.IN_PROGRESS && (
                <>
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

      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-6">
        {/* Blockchain Actions - chỉ hiển thị khi game kết thúc */}
        {gameStatus === GameStatus.FINISHED && isConnected && (
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
}
