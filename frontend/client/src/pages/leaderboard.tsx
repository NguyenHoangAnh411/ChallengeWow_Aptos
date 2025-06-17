import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import PlayerCard from "@/components/player-card";
import { useGameState } from "@/lib/game-state";
import type { User } from "@shared/schema";

export default function Leaderboard() {
  const router = useRouter();
  const { currentUser } = useGameState();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [showMore, setShowMore] = useState(false);

  const { data: topPlayers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard", { limit: showMore ? 20 : 10 }],
  });

  // Mock leaderboard data for demonstration
  const mockLeaderboard: (User & { isCurrentUser?: boolean })[] = [
    {
      id: 2,
      username: "CyberNinja",
      walletAddress: "0xABCD...1234",
      totalScore: 18920,
      gamesWon: 67,
      rank: 1,
      createdAt: new Date()
    },
    {
      id: 3,
      username: "QuizKing",
      walletAddress: "0x2468...9753",
      totalScore: 15847,
      gamesWon: 42,
      rank: 2,
      createdAt: new Date()
    },
    {
      id: 4,
      username: "BrainGamer",
      walletAddress: "0x1357...8642",
      totalScore: 14235,
      gamesWon: 38,
      rank: 3,
      createdAt: new Date()
    },
    {
      id: 5,
      username: "TechMaster",
      walletAddress: "0x2468...9753",
      totalScore: 12890,
      gamesWon: 29,
      rank: 4,
      createdAt: new Date()
    },
    {
      id: 6,
      username: "SmartWiz",
      walletAddress: "0x1357...8642",
      totalScore: 11750,
      gamesWon: 25,
      rank: 5,
      createdAt: new Date()
    },
    {
      id: 7,
      username: "KnowledgeQueen",
      walletAddress: "0x9876...1234",
      totalScore: 10920,
      gamesWon: 22,
      rank: 6,
      createdAt: new Date()
    }
  ];

  // Add current user to mock data if available
  if (currentUser && !mockLeaderboard.find(p => p.id === currentUser.id)) {
    mockLeaderboard.push({
      ...currentUser,
      isCurrentUser: true
    });
  }

  const displayPlayers = showMore ? mockLeaderboard : mockLeaderboard.slice(0, 6);
  const top3 = mockLeaderboard.slice(0, 3);

  const handleFindMyRank = () => {
    if (currentUser) {
      const userRank = mockLeaderboard.find(p => p.id === currentUser.id);
      if (userRank) {
        // Scroll to user's position or show in highlighted section
        setShowMore(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="bg-cyber-darker border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/lobby")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-orbitron font-bold text-neon-blue">Global Leaderboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Filter Buttons */}
            <Button
              size="sm"
              onClick={() => setSelectedPeriod("week")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "week" 
                  ? "bg-neon-blue text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              This Week
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedPeriod("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "month" 
                  ? "bg-neon-blue text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedPeriod("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "all" 
                  ? "bg-neon-blue text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All Time
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Top 3 Podium */}
        <motion.div 
          className="max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 2nd Place */}
            <motion.div 
              className="order-1 md:order-1 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-morphism rounded-lg p-6 mb-4">
                <CardContent className="p-0">
                  <div className="text-6xl mb-4">🥈</div>
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-white">
                      {top3[1]?.username.substring(0, 2)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{top3[1]?.username}</h3>
                  <div className="text-2xl font-orbitron font-bold text-neon-blue mb-2">
                    {top3[1]?.totalScore.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{top3[1]?.gamesWon} wins</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 1st Place */}
            <motion.div 
              className="order-2 md:order-2 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="glass-morphism rounded-lg p-8 mb-4 animate-winner-glow">
                <CardContent className="p-0">
                  <div className="text-8xl mb-4">🥇</div>
                  <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-white">
                      {top3[0]?.username.substring(0, 2)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">{top3[0]?.username}</h3>
                  <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                    {top3[0]?.totalScore.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{top3[0]?.gamesWon} wins</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3rd Place */}
            <motion.div 
              className="order-3 md:order-3 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-morphism rounded-lg p-6 mb-4">
                <CardContent className="p-0">
                  <div className="text-6xl mb-4">🥉</div>
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-white">
                      {top3[2]?.username.substring(0, 2)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{top3[2]?.username}</h3>
                  <div className="text-2xl font-orbitron font-bold text-neon-blue mb-2">
                    {top3[2]?.totalScore.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{top3[2]?.gamesWon} wins</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Full Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Top Players</h3>
            <Button
              onClick={handleFindMyRank}
              className="bg-neon-purple hover:bg-purple-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <Search className="w-4 h-4 mr-2" />
              Find My Rank
            </Button>
          </div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {displayPlayers.slice(3).map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PlayerCard
                  player={player}
                  rank={player.rank || (index + 4)}
                />
              </motion.div>
            ))}

            {/* Current User Highlight */}
            {currentUser && currentUser.rank > 10 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <PlayerCard
                  player={{
                    ...currentUser,
                    isCurrentUser: true
                  }}
                  rank={currentUser.rank}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Load More Button */}
          {!showMore && mockLeaderboard.length > 6 && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowMore(true)}
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More Players
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
