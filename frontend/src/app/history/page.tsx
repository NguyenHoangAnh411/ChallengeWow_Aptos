"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/types/GameStatus";
import {
  ArrowLeft,
  Crown,
  Loader,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { useGameState } from "@/lib/game-state";
import { useInfiniteHistoryQuery } from "@/hooks/use-history-query";
import GameHistoryItemSkeleton from "@/components/history/game-history-item-skeleton";
import { GameHistoryItem } from "@/components/history/game-history-item";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Main GameHistoryPage Component
const GameHistoryPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useGameState();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteHistoryQuery(currentUser?.walletId);

  const flattenedRooms = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] text-white p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Bạn cũng có thể tạo skeleton cho Header và Stats */}
          <div className="mb-8 text-center h-28"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 h-24"></div>
          <div className="space-y-6">
            {/* Hiển thị 3 skeleton items */}
            <GameHistoryItemSkeleton />
            <GameHistoryItemSkeleton />
            <GameHistoryItemSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        ❌ Error loading game history. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] text-white p-4 lg:p-8 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#b16cea]/10 rounded-full blur-3xl animate-pulse -top-48 -left-48"></div>
        <div className="absolute w-96 h-96 bg-[#3beaff]/10 rounded-full blur-3xl animate-pulse -bottom-48 -right-48 animation-delay-2000"></div>
        <div className="absolute w-64 h-64 bg-[#b16cea]/5 rounded-full blur-2xl animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-1000"></div>
      </div>

      <header className="relative z-10 bg-cyber-darker/80 backdrop-blur-xl border-b border-neon-blue/30 px-4 pb-6">
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
              {/* {currentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/history")}
                  className="text-gray-400 hover:text-neon-blue transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
                >
                  <ScrollText className="w-5 h-5" />
                </Button>
              )} */}
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-orbitron font-bold bg-gradient-to-r from-[#b16cea] via-[#3beaff] to-[#b16cea] bg-clip-text text-transparent mb-4 drop-shadow-[0_0_20px_rgba(177,108,234,0.8)] animate-pulse">
            Game History
          </h1>
          <p className="text-[#3beaff] font-orbitron text-lg drop-shadow-[0_0_10px_rgba(59,234,255,0.8)]">
            Track your gaming sessions and performance
          </p>
        </div>

        {/* Tối ưu hóa 4: Tính toán stats từ flattenedRooms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Victories */}
          <div className="bg-gradient-to-br from-[#b16cea]/20 via-[#b16cea]/10 to-transparent backdrop-blur-md border-2 border-[#b16cea]/50 rounded-xl p-6 text-center hover:border-[#b16cea] hover:shadow-2xl hover:shadow-[#b16cea]/50 transition-all duration-500 relative overflow-hidden group">
            <div className="text-3xl font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_15px_rgba(177,108,234,1)] relative z-10">
              {
                flattenedRooms.filter(
                  (r) =>
                    r.status === GameStatus.FINISHED &&
                    r.winnerWalletId === currentUser?.walletId
                ).length
              }
            </div>
            <div className="text-sm text-[#b16cea]/80 font-orbitron relative z-10">
              Victories
            </div>
          </div>
          {/* Total Games */}
          <div className="bg-gradient-to-br from-[#3beaff]/20 via-[#3beaff]/10 to-transparent backdrop-blur-md border-2 border-[#3beaff]/50 rounded-xl p-6 text-center hover:border-[#3beaff] hover:shadow-2xl hover:shadow-[#3beaff]/50 transition-all duration-500 relative overflow-hidden group">
            <div className="text-3xl font-orbitron font-bold text-[#3beaff] drop-shadow-[0_0_15px_rgba(59,234,255,1)] relative z-10">
              {
                flattenedRooms.filter((r) => r.status === GameStatus.FINISHED)
                  .length
              }
            </div>
            <div className="text-sm text-[#3beaff]/80 font-orbitron relative z-10">
              Total Games
            </div>
          </div>
          {/* Active Games */}
          <div className="bg-gradient-to-br from-yellow-400/20 via-yellow-400/10 to-transparent backdrop-blur-md border-2 border-yellow-400/50 rounded-xl p-6 text-center hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-400/50 transition-all duration-500 relative overflow-hidden group">
            <div className="text-3xl font-orbitron font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,1)] relative z-10">
              {
                flattenedRooms.filter(
                  (r) =>
                    r.status === GameStatus.IN_PROGRESS ||
                    r.status === GameStatus.QUESTION_RESULT
                ).length
              }
            </div>
            <div className="text-sm text-yellow-400/80 font-orbitron relative z-10">
              Active Games
            </div>
          </div>
        </div>

        {/* Game History List */}
        <div className="space-y-6">
          {flattenedRooms.length > 0 ? (
            flattenedRooms.map((room) => (
              <GameHistoryItem key={room.id} room={room} />
            ))
          ) : (
            <div className="text-center py-16">
              <div className="text-[#3beaff] font-orbitron text-xl mb-6 drop-shadow-[0_0_10px_rgba(59,234,255,0.8)]">
                No game history found
              </div>
              <button
                onClick={() => router.push("/play")}
                className="px-8 py-4 bg-gradient-to-r from-[#b16cea] to-[#3beaff] text-white font-orbitron text-lg rounded-lg hover:scale-110 hover:shadow-2xl hover:shadow-[#b16cea]/60 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#3beaff] to-[#b16cea] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
                  Start Your First Game
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Tối ưu hóa 5: Nút "Tải thêm" và trạng thái tải */}
        <div className="flex justify-center mt-10">
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#3beaff]/80 to-[#b16cea]/80 text-white font-orbitron text-base rounded-lg hover:scale-105 hover:shadow-2xl hover:shadow-[#3beaff]/60 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Loading More...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHistoryPage;
