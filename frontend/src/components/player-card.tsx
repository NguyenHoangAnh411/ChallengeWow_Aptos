"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { User } from "@/types/schema";

interface PlayerCardProps {
  player: User & {
    status?: string;
    responseTime?: number;
    isCurrentUser?: boolean;
  };
  rank?: number;
  showMedal?: boolean;
}

export default function PlayerCard({
  player,
  rank,
  showMedal = false,
}: PlayerCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "answered":
        return "text-orange-400";
      case "thinking":
        return "text-green-400";
      case "timeout":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getMedal = (rank?: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank ? `${rank}️⃣` : null;
    }
  };

  const getGradient = (rank?: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-orange-500";
      case 2:
        return "from-gray-400 to-gray-600";
      case 3:
        return "from-orange-400 to-orange-600";
      default:
        return "from-neon-blue to-neon-purple";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`glass-morphism rounded-lg p-4 hologram-border relative overflow-hidden group transition-all duration-300 ${
          player.isCurrentUser
            ? "border-2 border-neon-purple neon-glow-purple"
            : ""
        }`}
      >
        {/* Background glow for current user */}
        {player.isCurrentUser && (
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-purple-500/10 animate-pulse"></div>
        )}

        {/* Status indicator line */}
        <div
          className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 ${
            player.status === "answered"
              ? "bg-green-400"
              : player.status === "thinking"
              ? "bg-orange-400"
              : player.status === "timeout"
              ? "bg-red-400"
              : "bg-gray-600"
          }`}
        ></div>

        <CardContent className="p-0 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showMedal && rank && (
                <motion.div
                  className="text-3xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {getMedal(rank)}
                </motion.div>
              )}
              {rank && !showMedal && (
                <div className="w-8 h-8 flex items-center justify-center bg-neon-blue/20 rounded-lg">
                  <span className="text-sm font-bold text-neon-blue">
                    {rank}
                  </span>
                </div>
              )}

              <div className="relative">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${getGradient(
                    rank
                  )} rounded-full flex items-center justify-center animate-glow-pulse`}
                >
                  <span className="text-sm font-bold text-white">
                    {player.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                {player.status === "answered" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-cyber-dark animate-pulse"></div>
                )}
              </div>

              <div className="flex-1">
                <div
                  className={`font-medium text-sm flex items-center space-x-2 ${
                    player.isCurrentUser ? "text-neon-purple" : "text-white"
                  }`}
                >
                  <span>{player.username}</span>
                  {player.isCurrentUser && (
                    <Badge className="px-2 py-0 text-xs bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                      You
                    </Badge>
                  )}
                </div>

                {player.walletId && (
                  <div className="text-xs text-gray-400 font-mono">
                    {player.walletId.substring(0, 6)}...
                    {player.walletId.slice(-4)}
                  </div>
                )}

                {player.status && (
                  <motion.div
                    className={`text-xs flex items-center space-x-1 ${getStatusColor(
                      player.status
                    )}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        player.status === "answered"
                          ? "bg-green-400"
                          : player.status === "thinking"
                          ? "bg-orange-400 animate-pulse"
                          : player.status === "timeout"
                          ? "bg-red-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="capitalize">{player.status}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div
                className={`text-lg font-bold font-orbitron ${
                  player.isCurrentUser ? "text-neon-purple" : "text-neon-blue"
                }`}
              >
                {player.totalScore || 0}
              </div>

              {player.responseTime !== undefined && (
                <div className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>⏱</span>
                  <span>
                    {player.responseTime === -1
                      ? "---"
                      : `${player.responseTime}s`}
                  </span>
                </div>
              )}

              {player.gamesWon !== undefined && (
                <div className="text-xs text-green-400 flex items-center space-x-1">
                  <span>🏆</span>
                  <span>{player.gamesWon || 0}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
