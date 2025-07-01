"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Settings,
  Crown,
  Plus,
  Users,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import RoomCard from "@/components/room-card";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@/types/schema";
import {
  fetchRooms,
  createRoom,
  joinRoom,
  fetchUserByWallet,
  updateUser,
  fetchCurrentRoom,
} from "@/lib/api";

import { useAccount } from "wagmi";
import ConnectWalletModal from "@/components/connect-wallet-modal";
import { RoomStatus } from "@/types/RoomStatus";
import { RECONNECT_WS } from "@/lib/constants";

export default function Lobby() {
  const router = useRouter();
  const { toast } = useToast();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const { currentUser, setCurrentUser } = useGameState();
  const { isConnected, address } = useAccount();
  const [onlineStats, setOnlineStats] = useState({
    activeRooms: 0,
    playersOnline: 0,
    avgResponseTime: "0.0s",
  });

  const [inviteCode, setInviteCode] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [hasNewRoom, setHasNewRoom] = useState(false);

  // Tham gia phòng hiện tại đang tham gia
  useEffect(() => {
    if (!currentUser) return;

    fetchCurrentRoom(currentUser.walletId)
      .then((data) => {
        if (data?.roomId) {
          router.push(`/room/${data.roomId}`);
        }
      })
      .catch((err) => {
        if (err.message.includes("404")) {
          return;
        }
        console.error(err);
      });
  }, [currentUser]);

  // Connect Wallet Modal
  const requireWallet = (callback: () => void) => {
    if (!isConnected) {
      setPendingAction(() => callback);
      setShowConnectModal(true);
    } else {
      callback();
    }
  };

  useEffect(() => {
    if (isConnected && pendingAction) {
      pendingAction();
      setPendingAction(null);
      setShowConnectModal(false);
    }
  }, [isConnected, pendingAction]);

  useEffect(() => {
    if (!currentUser && isConnected && address) {
      fetchUserByWallet(address).then((user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
    }
  }, [currentUser, isConnected, address, setCurrentUser]);

  const {
    data: rooms = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    staleTime: 1000, // 1s stale time để tránh spam
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!rooms || rooms.length === 0) return;

    const activeRooms = rooms.length;

    const playersOnline = rooms.reduce((total, room) => {
      return total + (room.players?.length || 0);
    }, 0);

    // Fake avg response time
    const avgResponseTime = `${(Math.random() * 2 + 1).toFixed(1)}s`;

    setOnlineStats({
      activeRooms,
      playersOnline,
      avgResponseTime,
    });
  }, [rooms]);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      return createRoom({
        username: currentUser?.username,
        walletId: currentUser?.walletId,
      });
    },
    onSuccess: (room: Room) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Room Created",
        description: `Room #${onlineStats.activeRooms + 1} has been created!`,
      });

      if (room.status === RoomStatus.WAITING) {
        router.push(`/room/${room.id}/waiting`);
      } else {
        router.push(`/room/${room.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (variables: { roomId: string; roomCode?: string }) => {
      return joinRoom({
        ...variables,
        username: currentUser?.username,
        walletId: currentUser?.walletId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Room Joined",
        description: "Successfully joined the room!",
      });

      router.push(`/room/${variables.roomId}/waiting`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join room. It might be full or unavailable.",
        variant: "destructive",
      });
      return;
    },
  });

  const { isWsConnected, sendMessage } = useWebSocket({
    url: "/lobby",
    onMessage: (data) => {
      if (data.type === "room_update") {
        setHasNewRoom(true);
        queryClient.refetchQueries({
          queryKey: ["rooms"],
          type: "active",
        });
      }
    },
  });

  // Keep connection
  useEffect(() => {
    const interval = setInterval(() => {
      if (isWsConnected) {
        sendMessage({ type: "ping" });
      }
    }, RECONNECT_WS);

    return () => clearInterval(interval);
  }, [isWsConnected]);

  const handleCreateRoom = () => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!currentUser?.username || !currentUser?.walletId) {
      toast({
        title: "Missing info",
        description: "Please set your username before creating a room.",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate();
  };

  const handleJoinRoom = (idOrCode: string) => {
    const code = idOrCode.trim();
    if (!code) {
      toast({
        title: "Room ID or Code is required",
        description: "Please select a room or enter an invite code to join.",
        variant: "destructive",
      });
      return;
    }
    requireWallet(() => {
      if (!currentUser?.username || !currentUser?.walletId) {
        toast({
          title: "Missing info",
          description: "Please set your username before joining a room.",
          variant: "destructive",
        });
        return;
      }
      // We assume the code is a roomId. If it's a roomCode, the backend should handle it.
      // Or we find the room in the list to get the ID.
      const room = rooms.find((r) => r.id === code || r.roomCode === code);
      if (!room) {
        // As a fallback, we can try to join with the code, assuming it's a roomCode.
        // This depends on the backend implementation. For now, we'll try with what we have.
        // A better approach would be to have a dedicated API endpoint for joining with a code.
        // For now, we will assume the code is the roomID.
        toast({
          title: "Room not found",
          description: "Could not find a room with that ID or code.",
          variant: "destructive",
        });
        return;
      }

      joinRoomMutation.mutate({ roomId: room.id, roomCode: room.roomCode });
    });
  };

  const handleSaveUsername = async () => {
    if (!currentUser?.walletId || !usernameInput.trim()) return;
    if (usernameInput.length < 2) return;
    setIsSavingUsername(true);
    try {
      const finalUsername = `${usernameInput.trim()}#${currentUser.walletId.slice(
        -4
      )}`;
      await updateUser(currentUser.walletId, finalUsername);
      setCurrentUser({ ...currentUser, username: finalUsername });
      setUsernameInput("");
      toast({
        title: "Username updated!",
        description: "You can now create a room.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update username.",
        variant: "destructive",
      });
    }
    setIsSavingUsername(false);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid-fast relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 neural-network opacity-10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-neon-blue/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-neon-purple/5 to-transparent rounded-full blur-3xl"></div>

      {/* Enhanced Header */}
      <header className="relative z-10 bg-cyber-darker/80 backdrop-blur-xl border-b border-neon-blue/30 px-4 py-4">
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
                onClick={() => router.replace("/")}
                className="text-gray-400 hover:text-neon-blue transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  Game Lobby
                </h1>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/settings")}
                className="text-gray-400 hover:text-neon-blue transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/leaderboard")}
                className="text-neon-purple hover:text-purple-300 transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism neon-glow-purple"
              >
                <Crown className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="glass-morphism rounded-lg p-6 hologram-border relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 opacity-50"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-neon-blue">
                      Player Info
                    </h3>
                  </div>
                  {currentUser ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-cyber-accent/30 rounded-lg">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center animate-glow-pulse">
                          <span className="text-white font-bold text-lg truncate">
                            {currentUser?.username
                              ?.substring(0, 2)
                              .toUpperCase() ||
                              (currentUser?.walletId
                                ? currentUser.walletId
                                    .substring(2, 4)
                                    .toUpperCase()
                                : "--")}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {currentUser?.username || "Username not set"}
                          </div>
                          <div
                            className="text-xs text-gray-400 font-mono truncate"
                            title={
                              currentUser?.walletId || "No wallet connected"
                            }
                          >
                            {currentUser?.walletId || "No wallet connected"}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center p-2 bg-neon-blue/10 rounded">
                          <span className="text-gray-300 text-sm">
                            Total Score:
                          </span>
                          <span className="text-neon-blue font-bold text-lg">
                            {currentUser?.totalScore ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-400/10 rounded">
                          <span className="text-gray-300 text-sm">
                            Games Won:
                          </span>
                          <span className="text-green-400 font-bold">
                            {currentUser?.gamesWon ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-neon-purple/10 rounded">
                          <span className="text-gray-300 text-sm">
                            Global Rank:
                          </span>
                          <span className="text-neon-purple font-bold">
                            #{currentUser?.rank ?? "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Update Username Form */}
                      <div className="pt-4 mt-4 border-t border-neon-blue/20">
                        <h4 className="font-semibold text-neon-blue text-sm mb-2">
                          {currentUser.username ? "Update" : "Set"} your
                          username
                        </h4>
                        <div className="flex space-x-2">
                          <input
                            className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white w-full"
                            placeholder={
                              currentUser.username || "Enter username"
                            }
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                          />
                          <Button
                            onClick={handleSaveUsername}
                            disabled={isSavingUsername || !usernameInput.trim()}
                            className="bg-neon-blue hover:bg-blue-600 px-4 py-2 text-white"
                          >
                            {isSavingUsername ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      Connect your wallet to see player info.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-morphism rounded-lg p-6 hologram-border relative overflow-hidden data-stream">
                <CardContent className="p-0 relative z-10">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-neon-purple to-purple-500 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-neon-purple">
                      Live Stats
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-neon-blue/10 rounded">
                      <span className="text-gray-300 text-sm">
                        Active Rooms:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-neon-blue">
                          {onlineStats.activeRooms}
                        </span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-neon-purple/10 rounded">
                      <span className="text-gray-300 text-sm">
                        Players Online:
                      </span>
                      <span className="font-bold text-neon-purple">
                        {onlineStats.playersOnline}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-400/10 rounded">
                      <span className="text-gray-300 text-sm">
                        Avg. Response:
                      </span>
                      <span className="font-bold text-orange-400">
                        {onlineStats.avgResponseTime}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Enhanced Create Room Button */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="w-full relative overflow-hidden bg-gradient-to-r from-neon-blue to-blue-500 hover:from-blue-500 hover:to-neon-blue px-8 py-6 rounded-lg font-bold text-xl transition-all duration-300 neon-glow-blue hover:scale-105 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {createRoomMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6 mr-3" />
                      Create New Room
                    </>
                  )}
                </div>
              </Button>
            </motion.div>

            {/* Room List */}
            <div className="space-y-4">
              {/* Loading indicator nhỏ góc màn hình */}
              <Button
                onClick={async () => {
                  await refetch();
                  setHasNewRoom(false);
                }}
                disabled={isFetching}
                className="relative bg-neon-blue hover:bg-blue-600 text-white font-bold px-4 py-2 transition-all duration-300 rounded-lg flex items-center space-x-2"
              >
                {isFetching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Refresh</span>

                {/* 🔔 Badge thông báo dữ liệu mới */}
                {hasNewRoom && !isFetching && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce shadow-md">
                    New
                  </span>
                )}
              </Button>

              <div className="flex justify-between items-center mb-6 flex-wrap gap-4 relative z-30">
                <h2 className="text-2xl font-orbitron font-bold">
                  Available Rooms
                </h2>
                <div className="flex items-center space-x-2 relative z-50">
                  <input
                    className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white w-48 focus:ring-2 focus:ring-neon-purple focus:border-neon-purple transition-all relative z-50"
                    placeholder="Enter invite code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  <Button
                    onClick={() => handleJoinRoom(inviteCode)}
                    disabled={joinRoomMutation.isPending || !inviteCode.trim()}
                    className="bg-neon-purple hover:bg-purple-600 text-white font-bold transition-all duration-300 neon-glow-purple px-4 py-2 relative z-50"
                  >
                    {joinRoomMutation.isPending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      "Join"
                    )}
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <Card className="glass-morphism rounded-lg p-12 text-center">
                  <CardContent className="p-0">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No Active Rooms
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Be the first to create a room and start a challenge!
                    </p>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={createRoomMutation.isPending}
                      className="bg-neon-purple hover:bg-purple-600 px-6 py-2 rounded-lg font-medium transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Room
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <RoomCard
                        index={index}
                        room={room}
                        onJoin={handleJoinRoom}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* If user has not connected wallet yet */}
      <ConnectWalletModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />
    </div>
  );
}
