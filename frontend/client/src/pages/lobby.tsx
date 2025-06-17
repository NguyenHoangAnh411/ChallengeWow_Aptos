'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Settings, Crown, Plus, Users } from "lucide-react";
import { motion } from "framer-motion";
import RoomCard from "@/components/room-card";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@/types/schema";

export default function Lobby() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, setCurrentUser } = useGameState();
  const [onlineStats, setOnlineStats] = useState({
    activeRooms: 8,
    playersOnline: 127,
    avgResponseTime: "3.2s"
  });

  // Mock current user if not set
  useEffect(() => {
    if (!currentUser) {
      setCurrentUser({
        id: 1,
        username: "Player_7834",
        walletAddress: "0x1234...5678",
        totalScore: 2847,
        gamesWon: 23,
        rank: 142,
        createdAt: new Date()
      });
    }
  }, [currentUser, setCurrentUser]);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rooms", {
        hostId: currentUser?.id,
        maxPlayers: 4,
        prize: 150,
        duration: 180
      });
      return response.json();
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Room Created",
        description: `Room #${room.roomCode} has been created!`,
      });
      router.push(`/room/${room.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    }
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/join`, {
        playerId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Room Joined",
        description: "Successfully joined the room!",
      });
      router.push(`/room/${roomId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join room. It might be full or unavailable.",
        variant: "destructive",
      });
    }
  });

  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "room_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      }
    }
  });

  const handleCreateRoom = () => {
    createRoomMutation.mutate();
  };

  const handleJoinRoom = (roomId: number) => {
    joinRoomMutation.mutate(roomId);
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
                onClick={() => router.push("/")}
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

      <div className="container mx-auto px-4 py-8">
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
                    <h3 className="text-xl font-semibold text-neon-blue">Player Info</h3>
                  </div>
                  {currentUser && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-cyber-accent/30 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center animate-glow-pulse">
                          <span className="text-white font-bold text-lg">
                            {currentUser.username.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{currentUser.username}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {currentUser.walletAddress || "No wallet connected"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center p-2 bg-neon-blue/10 rounded">
                          <span className="text-gray-300 text-sm">Total Score:</span>
                          <span className="text-neon-blue font-bold text-lg">{currentUser.totalScore}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-400/10 rounded">
                          <span className="text-gray-300 text-sm">Games Won:</span>
                          <span className="text-green-400 font-bold">{currentUser.gamesWon}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-neon-purple/10 rounded">
                          <span className="text-gray-300 text-sm">Global Rank:</span>
                          <span className="text-neon-purple font-bold">#{currentUser.rank}</span>
                        </div>
                      </div>
                    </div>
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
                    <h3 className="text-lg font-semibold text-neon-purple">Live Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-neon-blue/10 rounded">
                      <span className="text-gray-300 text-sm">Active Rooms:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-neon-blue">{onlineStats.activeRooms}</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-neon-purple/10 rounded">
                      <span className="text-gray-300 text-sm">Players Online:</span>
                      <span className="font-bold text-neon-purple">{onlineStats.playersOnline}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-400/10 rounded">
                      <span className="text-gray-300 text-sm">Avg. Response:</span>
                      <span className="font-bold text-orange-400">{onlineStats.avgResponseTime}</span>
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
              <h2 className="text-2xl font-orbitron font-bold mb-6">Available Rooms</h2>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <Card className="glass-morphism rounded-lg p-12 text-center">
                  <CardContent className="p-0">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Rooms</h3>
                    <p className="text-gray-400 mb-6">Be the first to create a room and start a challenge!</p>
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
    </div>
  );
}
