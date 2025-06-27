"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CyberLoadingScreen from "@/components/cyber-loading";
import GameSettingsView from "@/components/room-settings-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  Crown,
  Play,
  Share2,
  Settings,
  MessageCircle,
  Mic,
  MicOff,
  Ban,
  Copy,
  Clock,
  Trophy,
  Zap,
  Shield,
  Target,
  LogOut,
  Loader,
} from "lucide-react";
import EnhancedGameSettings from "@/components/room-game-settings";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Player, QuestionPayload, Room, User } from "@/types/schema";
import {
  changePlayerStatus,
  fetchRoomById,
  leaveRoom,
  updateGameSettings,
} from "@/lib/api";
import {
  KICK_PLAYER_TYPE,
  LEAVE_ROOM_TYPE,
  PLAYER_JOINED_TYPE,
  PLAYER_LEFT_TYPE,
  RECONNECT_WS,
  ROOM_CONFIG_UPDATE,
} from "@/lib/constants";
import { DEFAULT_GAME_SETTINGS, GameSettings } from "@/app/config/GameSettings";
import { useMutation } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

const TIME_COUNT_DOWN = 30000;
const MIN_PLAYERS = 2;

export default function WaitingRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;
  const { toast } = useToast();
  const { currentUser, currentRoom, setCurrentRoom, setQuestions, setStartAt } =
    useGameState();

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    DEFAULT_GAME_SETTINGS
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [countdown, setCountdown] = useState(TIME_COUNT_DOWN);
  const [isHost, setIsHost] = useState(false);
  const [kickConfirmation, setKickConfirmation] = useState<{
    show: boolean;
    playerId: string;
    playerName: string;
  }>({ show: false, playerId: "", playerName: "" });
  const [isRefreshingPlayers, setIsRefreshingPlayers] = useState(false);

  const fetchRoom = useCallback(async () => {
    setIsRefreshingPlayers(true);
    try {
      const data: Room = await fetchRoomById(roomId);
      setCurrentRoom(data);
      setPlayers(data.players || []);
      setGameSettings({
        questions: {
          easy: data.easyQuestions,
          medium: data.mediumQuestions,
          hard: data.hardQuestions,
        },
        timePerQuestion: data.countdownDuration,
      });

      if (currentUser) {
        const me = data.players.find(
          (p: Player) => p.walletId === currentUser.walletId
        );
        setIsHost(Boolean(me?.isHost));
        if (me?.isHost && !me.isReady) {
          me.isReady = true;
        }
      }
    } catch (error) {
      console.error("Failed to fetch room:", error);
      toast({
        title: "Failed to join room",
        description: "Room not found or network error",
        variant: "destructive",
      });
      router.replace("/lobby");
    } finally {
      setIsRefreshingPlayers(false);
    }
  }, [roomId, currentUser, setCurrentRoom, router, toast]);

  const { sendMessage, isWsConnected, closeConnection } = useWebSocket({
    url: currentUser?.walletId
      ? `/${roomId}?wallet_id=${currentUser?.walletId}`
      : undefined,
    baseUrl: "localhost:9000",
    onMessage: (data) => {
      try {
        switch (data.type) {
          case PLAYER_JOINED_TYPE:
            setPlayers((prev) => {
              const existingPlayerIndex = prev.findIndex(
                (p) => p.walletId === data.player.walletId
              );
              const playerWithDerivedIsReady = {
                ...data.player,
                playerStatus: data.player.playerStatus || "active",
                isReady: data.player.isReady,
              };

              if (existingPlayerIndex >= 0) {
                const newPlayers = [...prev];
                newPlayers[existingPlayerIndex] = {
                  ...newPlayers[existingPlayerIndex],
                  ...playerWithDerivedIsReady,
                };
                return newPlayers;
              }
              return [...prev, playerWithDerivedIsReady];
            });
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                playerId: "0",
                playerName: "System",
                message: `${data.player.username} joined the room`,
                timestamp: new Date(),
                isSystem: true,
              },
            ]);
            break;

          case PLAYER_LEFT_TYPE:
            const { walletId, username } = data.payload;
            setPlayers((prev) => {
              const isHostLeft = prev.find(
                (p) => p.walletId === walletId
              )?.isHost;
              const updated = prev.filter((p) => p.walletId !== walletId);

              if (isHostLeft) {
                fetchRoom().then(() => {
                  if (isHostLeft && isHost) {
                    toast({
                      title: "You are now the host",
                      description: "The previous host has left the room",
                      variant: "default",
                    });
                  }
                });
              }
              return updated;
            });
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                playerId: "0",
                playerName: "System",
                message:
                  data.action === "kick"
                    ? `${username} was kicked from the room`
                    : `${username} left the room`,
                timestamp: new Date(),
                isSystem: true,
              },
            ]);
            break;

          case "kicked":
            toast({
              title: "You were kicked",
              description: data.payload.reason,
              variant: "destructive",
            });
            router.replace("/lobby");
            break;

          case "error":
            toast({
              title: "Error",
              description:
                data.message || data.payload?.message || "An error occurred",
              variant: "destructive",
            });
            break;

          case "player_ready":
            if (!data.player?.wallet_id) return;
            setPlayers((prev) =>
              prev.map((p) =>
                p.walletId === data.player.wallet_id
                  ? { ...p, isReady: data.player.isReady }
                  : p
              )
            );
            break;

          case "game_started":
            const gameData = data.payload;
            setStartAt(gameData.startAt);
            setCountdown(gameData.countdownDuration);
            setCanStart(true);
            toast({
              title: "Game Starting!",
              description: "Get ready for the first question...",
              variant: "default",
            });

            break;

          case "chat":
            setChatMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                playerId: data.payload.sender,
                playerName: data.payload.sender,
                message: data.payload.message,
                timestamp: new Date(),
              },
            ]);
            break;

          case ROOM_CONFIG_UPDATE:
            setGameSettings(data.payload);
            break;
        }
      } catch (error) {
        console.error("WebSocket message handling error:", error);
        toast({
          title: "WebSocket Error",
          description: "Failed to process server message",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isWsConnected) {
        sendMessage({ type: "ping" });
      }
    }, RECONNECT_WS);

    return () => clearInterval(interval);
  }, [isWsConnected, sendMessage]);

  const readyCount = players.filter((p) => p.isReady).length;
  const readyPercentage =
    players.length > 0 ? (readyCount / players.length) * 100 : 0;
  const [canStart, setCanStart] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setCanStart(readyCount >= MIN_PLAYERS && readyCount === players.length);
  }, [readyCount, players.length]);

  const updateRoomSettingsMutation = useMutation({
    mutationFn: async () => {
      return updateGameSettings(roomId, gameSettings);
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Updated",
        description: "Game settings have been saved successfully",
        variant: "default",
      });
    },
    onError: (err) => {
      console.error("Update failed", err);
      toast({
        title: "Update Failed",
        description: "Failed to save game settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateRoomSettingsMutation.mutate();
  };

  const handleReadyToggle = useCallback(() => {
    if (!currentUser?.walletId || !currentRoom.id) return;

    const currentPlayer = players.find(
      (p) => p.walletId === currentUser.walletId
    );
    if (!currentPlayer) return;

    const newIsReady = !currentPlayer.isReady;

    setPlayers((prev) =>
      prev.map((p) =>
        p.walletId === currentUser.walletId ? { ...p, isReady: newIsReady } : p
      )
    );

    changePlayerStatus(
      currentRoom.id,
      currentUser.walletId,
      newIsReady ? "ready" : "active"
    ).catch((error) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.walletId === currentUser.walletId
            ? { ...p, isReady: !newIsReady }
            : p
        )
      );
      toast({
        title: "Status Update Failed",
        description: "Failed to update ready status",
        variant: "destructive",
      });
    });
  }, [currentUser, currentRoom, players, toast]);

  const handleStartGame = useCallback(() => {
    const readyPlayers = players.filter((p) => p.isReady);
    if (readyPlayers.length < MIN_PLAYERS) {
      toast({
        title: "Not enough players ready",
        description: `At least ${MIN_PLAYERS} players must be ready to start`,
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "start_game",
      roomId,
      settings: gameSettings,
    });
  }, [players, gameSettings, sendMessage, toast]);

  useEffect(() => {
    if (countdown <= 0 && canStart) {
      router.replace(`/room/${roomId}`);
      return;
    } else if (countdown <= 0 && !canStart) {
      handleStartGame();
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, canStart, isHost, handleStartGame]);

  const handleInviteFriends = async () => {
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite link copied!",
        description: "Share this link with your friends",
      });
    } catch (err) {
      toast({
        title: "Failed to copy link",
        description: `Please copy manually: ${inviteLink}`,
        variant: "destructive",
      });
    }
  };

  const handleKickPlayer = (walletId: string, playerName: string) => {
    setKickConfirmation({ show: true, playerId: walletId, playerName });
  };

  const confirmKickPlayer = () => {
    sendMessage({
      type: KICK_PLAYER_TYPE,
      payload: {
        wallet_id: kickConfirmation.playerId,
        room_id: roomId,
      },
    });
    setKickConfirmation({ show: false, playerId: "", playerName: "" });
  };

  const testWebSocket = () => {
    sendMessage({ type: "ping", data: "test message" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser?.walletId) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentUser.walletId,
      playerName: currentUser.username || "Unknown",
      message: newMessage,
      timestamp: new Date(),
    };

    setNewMessage("");

    sendMessage({
      type: "chat",
      payload: {
        sender: currentUser.username || "Unknown",
        message: newMessage,
      },
    });
  };

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

  if (!currentRoom || !currentUser) return <CyberLoadingScreen />;

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid-fast relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 neural-network opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-neon-blue/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-neon-purple/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 hexagon bg-neon-blue/20 animate-float" />
      <div
        className="absolute top-60 right-16 w-12 h-12 hexagon bg-neon-purple/20 animate-float"
        style={{ animationDelay: "2s" }}
      />

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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                    Room #{currentRoom.roomCode}
                  </h1>
                  <p className="text-sm text-gray-400">Waiting Room</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Clock className="w-5 h-5 text-neon-purple" />
                <span className="font-orbitron text-lg font-bold text-neon-purple">
                  {formatTime(countdown)}
                </span>
              </div>

              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Zap className="w-5 h-5 text-neon-blue" />
                <span className="font-orbitron font-bold text-neon-blue">
                  {readyCount}/{players.length} Ready
                </span>
              </div>

              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isWsConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span className="font-orbitron text-sm text-gray-300">
                  {isWsConnected ? "Connected" : "Disconnected"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testWebSocket}
                  className="text-xs text-gray-400 hover:text-neon-blue"
                >
                  Test
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-neon-blue">
                  <Users className="w-5 h-5" />
                  <span>Players ({players.length}/4)</span>
                </CardTitle>
                <Progress
                  value={readyPercentage}
                  className="h-2 bg-cyber-darker"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isRefreshingPlayers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-8 h-8 text-neon-blue animate-spin" />
                      <span className="ml-2 text-gray-400">
                        Loading players...
                      </span>
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
                                {getCharacterIcon(
                                  player.character || "default"
                                )}
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
                          {isHost && !player.isHost && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleKickPlayer(
                                  player.walletId,
                                  player.username
                                )
                              }
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 group"
                              title="Kick player"
                            >
                              <Ban className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </Button>
                          )}
                          {player.walletId === currentUser?.walletId &&
                            !player.isHost && (
                              <Button
                                variant={player.isReady ? "default" : "outline"}
                                size="sm"
                                onClick={handleReadyToggle}
                                className={
                                  player.isReady
                                    ? "bg-green-600 hover:bg-green-700 animate-glow-pulse"
                                    : "border-neon-blue text-neon-blue hover:bg-neon-blue/20"
                                }
                              >
                                {player.isReady ? "Unready" : "Ready"}
                              </Button>
                            )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {isHost ? (
              <EnhancedGameSettings
                isHost={isHost}
                gameSettings={gameSettings}
                setGameSettings={setGameSettings}
                onSave={handleSaveSettings}
              />
            ) : (
              <GameSettingsView gameSettings={gameSettings} />
            )}
          </div>

          <div className="space-y-6">
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
                    disabled={!canStart}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleInviteFriends}
                    className="w-full border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Friends
                  </Button>
                </CardContent>
              </Card>
            )}

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
                  <span className="text-gray-400">Auto-start:</span>
                  <span className="text-orange-400">
                    {formatTime(countdown)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={kickConfirmation.show}
        onOpenChange={(open) =>
          setKickConfirmation({ ...kickConfirmation, show: open })
        }
      >
        <DialogContent className="bg-cyber-darker border border-red-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-neon-glow-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-lg font-semibold text-red-400">
                Kick Player
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Are you sure you want to kick {kickConfirmation.playerName}?
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </div>
  );
}
