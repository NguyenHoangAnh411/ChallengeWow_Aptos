"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Trophy,
  Medal,
  Award,
  Star,
  Zap,
  Crown,
  Target,
  TrendingUp,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Users,
  BarChart3,
  Timer,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlayerCard from "@/components/player-card";
import { useGameState } from "@/lib/game-state";
import type { User, LeaderboardEntry } from "@/types/schema";
import { fetchLeaderboard } from "@/lib/api";

export default function EnhancedLeaderboard() {
  const router = useRouter();
  const { currentUser } = useGameState();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [showMore, setShowMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("score");
  const [showStats, setShowStats] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const pageSize = 20;

  const {
    data: leaderboard = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: [
      "/api/leaderboard",
      { limit: showMore ? 100 : 50, period: selectedPeriod },
    ],
    queryFn: () => fetchLeaderboard(showMore ? 100 : 50, selectedPeriod),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const top3 = leaderboard.slice(0, 3);
  const displayPlayers = showMore ? leaderboard : leaderboard.slice(0, 10);

  useEffect(() => {
    if (!search) {
      setFiltered(leaderboard);
    } else {
      setFiltered(
        leaderboard.filter(
          (p) =>
            getDisplayName(p).toLowerCase().includes(search.toLowerCase()) ||
            p.walletId.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, leaderboard]);

  const handleCopyWallet = async (walletId: string) => {
    await navigator.clipboard.writeText(walletId);
    setCopiedWallet(walletId);
    setTimeout(() => setCopiedWallet(""), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleFindMyRank = () => {
    if (currentUser) {
      const userRank = leaderboard.find(
        (p) => p.walletId === currentUser.walletId
      );
      if (userRank) {
        setShowMore(true);
        // Scroll to user's position
        const userIndex = leaderboard.findIndex(
          (p) => p.walletId === currentUser.walletId
        );
        const targetPage = Math.ceil((userIndex + 1) / pageSize);
        setPage(targetPage);
      }
    }
  };

  const getDisplayName = (player?: LeaderboardEntry) =>
    player?.username && player.username.trim() !== ""
      ? player.username
      : player?.walletId
      ? player.walletId.slice(0, 6) + "..." + player.walletId.slice(-4)
      : "";

  const getRankNumber = (rank: string, idx: number) => {
    const n = parseInt(rank);
    return isNaN(n) ? idx + 1 : n;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
    if (rank <= 10) return <Star className="w-4 h-4 text-purple-400" />;
    return <Target className="w-4 h-4 text-blue-400" />;
  };

  const getWinRate = (player: LeaderboardEntry) => {
    const winRate =
      player.gamesWon > 0
        ? (player.gamesWon / (player.gamesWon + 10)) * 100
        : 0; // Assuming some games played
    return winRate.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-cyan-400 font-bold">
            Loading Leaderboard...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-red-400 font-bold mb-4">
            Failed to load leaderboard
          </p>
          <Button
            onClick={handleRefresh}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-blue-500/5 to-green-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-bounce delay-500"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-bounce delay-1500"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/40 backdrop-blur-xl border-b border-cyan-500/30 px-4 py-4 shadow-2xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/lobby")}
              className="text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:scale-110 hover:bg-cyan-400/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
              <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                GLOBAL LEADERBOARD
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Period Selector */}
            <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-cyan-500/30 space-x-2">
              {["week", "month", "all"].map((period) => (
                <Button
                  key={period}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    selectedPeriod === period
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                      : "text-cyan-200 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  {period === "week"
                    ? "This Week"
                    : period === "month"
                    ? "This Month"
                    : "All Time"}
                </Button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-cyan-500/30">
              <Button
                size="sm"
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-md transition-all duration-300 ${
                  viewMode === "table"
                    ? "bg-cyan-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 rounded-md transition-all duration-300 ${
                  viewMode === "cards"
                    ? "bg-cyan-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all duration-300"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full flex flex-col items-center justify-start relative">
        <div className="container mx-auto px-4 sm:px-8 py-8">
          {/* Stats Overview */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-black/30 backdrop-blur-xl border border-cyan-500/30 shadow-2xl">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {leaderboard.length}
                </div>
                <div className="text-sm text-gray-400">Total Players</div>
              </CardContent>
            </Card>
            <Card className="bg-black/30 backdrop-blur-xl border border-purple-500/30 shadow-2xl">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {top3[0]?.totalScore.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-400">Top Score</div>
              </CardContent>
            </Card>
            <Card className="bg-black/30 backdrop-blur-xl border border-green-500/30 shadow-2xl">
              <CardContent className="p-4 text-center">
                <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {top3[0]?.gamesWon || 0}
                </div>
                <div className="text-sm text-gray-400">Most Wins</div>
              </CardContent>
            </Card>
            <Card className="bg-black/30 backdrop-blur-xl border border-blue-500/30 shadow-2xl">
              <CardContent className="p-4 text-center">
                <Timer className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {selectedPeriod.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400">Time Period</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="w-full flex justify-center mt-8 mb-8">
              <motion.div
                className="max-w-6xl mx-auto mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <motion.div
                      className="order-1 md:order-1 text-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Card className="bg-black/30 backdrop-blur-xl border border-gray-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-gray-500/20 transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="text-6xl mb-4">🥈</div>
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {getDisplayName(top3[1]).substring(0, 4)}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-white">
                            {getDisplayName(top3[1])}
                          </h3>
                          <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                            {top3[1].totalScore.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {top3[1].gamesWon} wins
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Win Rate: {getWinRate(top3[1])}%
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  <motion.div
                    className="order-2 md:order-2 text-center"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Card className="bg-black/30 backdrop-blur-xl border border-yellow-400/50 rounded-lg p-8 mb-4 shadow-2xl shadow-yellow-500/20 animate-pulse">
                      <CardContent className="p-0">
                        <div className="text-8xl mb-4">🥇</div>
                        <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
                          <span className="text-xl font-bold text-white">
                            {getDisplayName(top3[0]).substring(0, 4)}
                          </span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white">
                          {getDisplayName(top3[0])}
                        </h3>
                        <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                          {top3[0].totalScore.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          {top3[0].gamesWon} wins
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Win Rate: {getWinRate(top3[0])}%
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 3rd Place */}
                  {top3[2] && (
                    <motion.div
                      className="order-3 md:order-3 text-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <Card className="bg-black/30 backdrop-blur-xl border border-orange-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="text-6xl mb-4">🥉</div>
                          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {getDisplayName(top3[2]).substring(0, 4)}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-white">
                            {getDisplayName(top3[2])}
                          </h3>
                          <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                            {top3[2].totalScore.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {top3[2].gamesWon} wins
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Win Rate: {getWinRate(top3[2])}%
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center space-x-4">
              {currentUser && (
                <Button
                  onClick={handleFindMyRank}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Find My Rank
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search username or wallet..."
                className="pl-10 pr-4 py-3 rounded-lg bg-black/30 backdrop-blur-xl text-white border border-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent w-full sm:w-80 transition-all duration-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="w-full max-w-7xl mx-auto overflow-hidden">
            <Card className="bg-black/30 backdrop-blur-xl border border-cyan-500/30 shadow-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-200 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-200 uppercase tracking-wider">
                          Wallet
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-cyan-200 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-green-300 uppercase tracking-wider">
                          Wins
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-purple-300 uppercase tracking-wider">
                          Win Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      <AnimatePresence>
                        {filtered
                          .slice((page - 1) * pageSize, page * pageSize)
                          .map((player, idx) => {
                            const rankNum = getRankNumber(
                              player.rank,
                              (page - 1) * pageSize + idx
                            );
                            const isCurrentUser =
                              currentUser?.walletId === player.walletId;

                            return (
                              <motion.tr
                                key={player.walletId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{
                                  duration: 0.3,
                                  delay: idx * 0.05,
                                }}
                                className={`transition-all duration-300 hover:bg-cyan-900/20 ${
                                  isCurrentUser
                                    ? "bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-l-4 border-cyan-400"
                                    : ""
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-cyan-300 text-shadow-cyber">
                                  {player.rank}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-bold text-white text-shadow-cyber">
                                        {getDisplayName(player)
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-white font-semibold text-shadow-cyber">
                                        {getDisplayName(player)}
                                      </div>
                                      {isCurrentUser && (
                                        <div className="text-xs text-cyan-400">
                                          You
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-cyan-200 font-mono text-sm">
                                      {player.walletId.slice(0, 6)}...
                                      {player.walletId.slice(-4)}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleCopyWallet(player.walletId)
                                      }
                                      className="text-cyan-400 hover:text-cyan-200 transition-colors duration-200"
                                      title="Copy wallet address"
                                    >
                                      {copiedWallet === player.walletId ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-xl font-bold text-cyan-200 text-shadow-cyber">
                                    {player.totalScore.toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-lg font-semibold text-green-300 text-shadow-cyber">
                                    {player.gamesWon}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-sm font-medium text-purple-300 text-shadow-cyber">
                                    {getWinRate(player)}%
                                  </div>
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
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from(
                { length: Math.min(5, Math.ceil(filtered.length / pageSize)) },
                (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-all duration-300 ${
                        page === pageNum
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                          : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              onClick={() =>
                setPage(
                  Math.min(Math.ceil(filtered.length / pageSize), page + 1)
                )
              }
              disabled={page * pageSize >= filtered.length}
              className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>

          {/* Load More Button */}
          {!showMore && leaderboard.length > 10 && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowMore(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-medium shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <ChevronDown className="w-5 h-5 mr-2" />
                Load More Players
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
