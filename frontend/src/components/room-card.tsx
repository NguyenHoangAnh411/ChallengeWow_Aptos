"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy } from "lucide-react";
import type { Room } from "@/types/schema";
import { ClientMotion } from "./client-motion";
import { MAX_PLAYERS_PER_ROOM } from "@/lib/constants";
import { GameStatus } from "@/types/GameStatus";

interface RoomCardProps {
  index: number;
  room: Room;
  onJoin: (roomId: string) => void;
}

export default function RoomCard({ index, room, onJoin }: RoomCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case GameStatus.WAITING:
        return "bg-green-500 bg-opacity-20 text-green-400";
      case GameStatus.COUNTING_DOWN:
        return "bg-yellow-500 bg-opacity-20 text-yellow-400";
      case GameStatus.IN_PROGRESS:
        return "bg-orange-500 bg-opacity-20 text-orange-400";
      case GameStatus.FINISHED:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case GameStatus.WAITING:
        return "Waiting";
      case GameStatus.COUNTING_DOWN:
        return "Counting Down";
      case GameStatus.IN_PROGRESS:
        return "In Progress";
      case GameStatus.FINISHED:
        return "Finished";
    }
  };

  const currentPlayers = room.players.length;
  const isFull = currentPlayers >= MAX_PLAYERS_PER_ROOM;
  const canJoin = room.status === GameStatus.WAITING && !isFull;

  return (
    <ClientMotion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism rounded-lg p-6 hologram-border relative overflow-hidden group">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Data stream effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <CardContent className="p-0 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <ClientMotion
                  className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-blue-400 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                >
                  Room #{index + 1}
                </ClientMotion>
                <ClientMotion whileHover={{ scale: 1.1 }}>
                  <Badge
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      room.status
                    )} border border-current/30`}
                  >
                    {getStatusText(room.status)}
                  </Badge>
                </ClientMotion>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 p-2 bg-cyber-accent/20 rounded-lg">
                  <Users className="w-4 h-4 text-neon-blue" />
                  <span className="text-gray-300">
                    {currentPlayers}/{MAX_PLAYERS_PER_ROOM} Players
                  </span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-cyber-accent/20 rounded-lg">
                  <Clock className="w-4 h-4 text-neon-purple" />
                  <span className="text-gray-300">
                    {Math.floor((room.timePerQuestion || 0) / 60)} min rounds
                  </span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-cyber-accent/20 rounded-lg">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">
                    {room.prize || 0} tokens
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 md:ml-4 cursor-pointer">
              <ClientMotion
                onClick={() => onJoin(room.id)}
                disabled={!canJoin}
                className={`relative overflow-hidden px-8 py-3 rounded-lg font-bold transition-all duration-300 ${
                  canJoin
                    ? "bg-gradient-to-r from-neon-purple to-purple-500 hover:from-purple-500 hover:to-neon-purple neon-glow-purple hover:scale-105"
                    : "bg-gray-600 cursor-not-allowed opacity-50"
                }`}
                whileHover={canJoin ? { scale: 1.05 } : {}}
                whileTap={canJoin ? { scale: 0.95 } : {}}
              >
                <div className="relative z-10 flex justify-center items-center">
                  {isFull ? "Room Full" : canJoin ? "Join Room" : "Unavailable"}
                </div>
                {canJoin && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}
              </ClientMotion>
            </div>
          </div>
        </CardContent>
      </Card>
    </ClientMotion>
  );
}
