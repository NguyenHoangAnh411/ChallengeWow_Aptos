"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Player, Room, User } from "@/types/schema";
import { fetchRoomById, leaveRoom } from "@/lib/api";
import {
  KICK_PLAYER_TYPE,
  LEAVE_ROOM_TYPE,
  PLAYER_JOINED_TYPE,
  PLAYER_LEFT_TYPE,
} from "@/lib/constants";

// interface GameSettings {
//   map: string;
//   mode: string;
//   timeLimit: number;
//   difficulty: string;
//   maxPlayers: number;
// }

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

const TIME_COUNT_DONW = 30000; // in seconds
export default function WaitingRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;
  const { toast } = useToast();
  const { currentUser, currentRoom, setCurrentRoom } = useGameState();

  const [players, setPlayers] = useState<Player[]>([]);

  // const [gameSettings, setGameSettings] = useState<GameSettings>({
  //   map: "cyberpunk_city",
  //   mode: "classic",
  //   timeLimit: 15,
  //   difficulty: "medium",
  //   maxPlayers: 4,
  // });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [newMessage, setNewMessage] = useState("");
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [countdown, setCountdown] = useState(TIME_COUNT_DONW); // 5 minutes in seconds
  const [isHost, setIsHost] = useState(false);
  const [kickConfirmation, setKickConfirmation] = useState<{
    show: boolean;
    playerId: string;
    playerName: string;
  }>({ show: false, playerId: "", playerName: "" });

  const { sendMessage, isWsConnected } = useWebSocket({
    url: currentUser?.walletId
      ? `/${roomId}?wallet_id=${currentUser?.walletId}`
      : undefined,
    baseUrl: "localhost:9000",
    onMessage: (data) => {
      switch (data.type) {
        case PLAYER_JOINED_TYPE:
          setPlayers((prev) => [...prev, data.player]);
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
          setPlayers((prev) => prev.filter((p) => p.walletId !== walletId));
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              playerId: "0",
              playerName: "System",
              message: data.action === "kick" 
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
          router.push("/lobby");
          break;
        case "error":
          toast({
            title: "Error",
            description: data.message || data.payload?.message,
            variant: "destructive",
          });
          break;
        case "player_ready":
          setPlayers((prev) =>
            prev.map((p) =>
              p.walletId === data.playerId ? { ...p, isReady: data.isReady } : p
            )
          );
          break;
        case "game_started":
          router.push(`/room/${roomId}`);
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
      }
    },
  });

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Auto-start game when countdown reaches 0
      if (isHost) {
        // handleStartGame();
        alert("COUNTIN DOWN TIME IS OVER");
      }
    }
  }, [countdown, isHost]);

  // Set players
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data: Room = await fetchRoomById(roomId);
        setPlayers(data.players || []);
        // setGameSettings(data.settings || defaultGameSettings);

        // set host check
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
        router.push("/lobby");
      }
    };

    fetchRoom();
  }, [roomId, currentUser]);

  const handleReadyToggle = () => {
    const updatedPlayers = players.map((p) =>
      p.walletId === currentUser?.walletId ? { ...p, isReady: !p.isReady } : p
    );
    setPlayers(updatedPlayers);
    sendMessage({
      type: "toggle_ready",
      roomId: roomId,
      playerId: currentUser?.walletId,
      isReady: !players.find((p) => p.walletId === currentUser?.walletId)
        ?.isReady,
    });
  };

  const handleStartGame = () => {
    const readyPlayers = players.filter((p) => p.isReady);
    if (readyPlayers.length < 2) {
      toast({
        title: "Not enough players ready",
        description: "At least 2 players must be ready to start",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "start_game",
      roomId: roomId,
    });
  };

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
        description: "Please copy manually: " + inviteLink,
        variant: "destructive",
      });
    }
  };

  const handleKickPlayer = (walletId: string, playerName: string) => {
    setKickConfirmation({
      show: true,
      playerId: walletId,
      playerName: playerName,
    });
  };

  const confirmKickPlayer = () => {
    const kickMessage = {
      type: KICK_PLAYER_TYPE,
      payload: {
        wallet_id: kickConfirmation.playerId,
        room_id: roomId,
      },
    };
    console.log("[KICK] Sending kick message:", kickMessage);
    sendMessage(kickMessage);
    setKickConfirmation({ show: false, playerId: "", playerName: "" });
  };

  const testWebSocket = () => {
    console.log("[TEST] Testing WebSocket connection...");
    sendMessage({
      type: "ping",
      data: "test message"
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentUser?.walletId || "0",
      playerName: currentUser?.username || "Unknown",
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");

    sendMessage({
      type: "chat",
      payload: {
        sender: currentUser?.username || "Unknown",
        message: newMessage,
      },
    });
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({
        walletId: currentUser?.walletId,
        roomId: roomId,
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

  const readyCount = players.filter((p) => p.isReady).length;
  const readyPercentage = (readyCount / players.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid-fast relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 neural-network opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-neon-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-neon-purple/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 hexagon bg-neon-blue/20 animate-float"></div>
      <div
        className="absolute top-60 right-16 w-12 h-12 hexagon bg-neon-purple/20 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Header */}
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
                    Room #{roomId.slice(-4)}
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
              {/* Countdown Timer */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Clock className="w-5 h-5 text-neon-purple" />
                <span className="font-orbitron text-lg font-bold text-neon-purple">
                  {formatTime(countdown)}
                </span>
              </div>

              {/* Ready Status */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Zap className="w-5 h-5 text-neon-blue" />
                <span className="font-orbitron font-bold text-neon-blue">
                  {readyCount}/{players.length} Ready
                </span>
              </div>

              {/* WebSocket Status */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <div className={`w-3 h-3 rounded-full ${isWsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="font-orbitron text-sm text-gray-300">
                  {isWsConnected ? 'Connected' : 'Disconnected'}
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
          {/* Player List */}
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
                  {players.map((player) => (
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
                                className="bg-green-500/20 text-green-400"
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
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleKickPlayer(player.walletId, player.username)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 group"
                              title="Kick player"
                            >
                              <Ban className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </Button>
                          </>
                        )}
                        {player.walletId === currentUser?.walletId &&
                          !player.isHost && (
                            <Button
                              variant={player.isReady ? "default" : "outline"}
                              size="sm"
                              onClick={handleReadyToggle}
                              className={
                                player.isReady
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
                            >
                              {player.isReady ? "Unready" : "Ready"}
                            </Button>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Settings (Host Only) */}
            {/* {isHost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-neon-purple">
                      <Settings className="w-5 h-5" />
                      <span>Game Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Map
                        </label>
                        <Select
                          value={gameSettings.map}
                          onValueChange={(value) =>
                            setGameSettings((prev) => ({ ...prev, map: value }))
                          }
                        >
                          <SelectTrigger className="bg-cyber-darker border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cyberpunk_city">
                              Cyberpunk City
                            </SelectItem>
                            <SelectItem value="neon_forest">
                              Neon Forest
                            </SelectItem>
                            <SelectItem value="digital_void">
                              Digital Void
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Mode
                        </label>
                        <Select
                          value={gameSettings.mode}
                          onValueChange={(value) =>
                            setGameSettings((prev) => ({
                              ...prev,
                              mode: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-cyber-darker border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="speed">Speed Run</SelectItem>
                            <SelectItem value="survival">Survival</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Time Limit
                        </label>
                        <Select
                          value={gameSettings.timeLimit.toString()}
                          onValueChange={(value) =>
                            setGameSettings((prev) => ({
                              ...prev,
                              timeLimit: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger className="bg-cyber-darker border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 seconds</SelectItem>
                            <SelectItem value="15">15 seconds</SelectItem>
                            <SelectItem value="20">20 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Difficulty
                        </label>
                        <Select
                          value={gameSettings.difficulty}
                          onValueChange={(value) =>
                            setGameSettings((prev) => ({
                              ...prev,
                              difficulty: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-cyber-darker border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )} */}
          </div>

          {/* Chat and Controls */}
          <div className="space-y-6">
            {/* Chat Box */}
            <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm flex flex-col flex-grow min-h-[300px] max-h-[400px]">
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
                {/* Message list */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages.map((msg) => (
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
                  ))}
                </div>

                {/* Input area */}
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-cyber-darker border-gray-700"
                    onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>Send</Button>
                </div>
              </CardContent>
            </Card>

            {/* Host Controls */}
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
                    className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80"
                    disabled={readyCount < 2}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleInviteFriends}
                    className="w-full border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Friends
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Room Info */}
            <Card className="glass-morphism-deep border border-gray-700/50 shadow-neon-glow-sm">
              <CardHeader>
                <CardTitle className="text-gray-300">Room Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Room Code:</span>
                  <span className="text-neon-blue font-mono">
                    #{roomId.slice(-4)}
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

      {/* Kick Confirmation Dialog */}
      {kickConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cyber-darker border border-red-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-neon-glow-md"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400">Kick Player</h3>
                <p className="text-sm text-gray-400">Are you sure you want to kick this player?</p>
              </div>
            </div>
            
            <div className="bg-cyber-dark/50 rounded-lg p-3 mb-4">
              <p className="text-gray-300">
                <span className="text-red-400 font-semibold">{kickConfirmation.playerName}</span> will be removed from the room.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setKickConfirmation({ show: false, playerId: "", playerName: "" })}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmKickPlayer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Ban className="w-4 h-4 mr-2" />
                Kick Player
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
