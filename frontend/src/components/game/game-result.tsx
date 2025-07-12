import {
  ArrowLeft,
  Award,
  Crown,
  Medal,
  Share2,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/lib/game-state";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";

interface GameResultsProps {
  handleFinished: () => void;
}

export const GameResults = ({ handleFinished }: GameResultsProps) => {
  const { gameResults, currentUser, winnerWallet, totalQuestions, players } =
    useGameState();
  // Sort results by score for proper ranking
  const sortedResults = [...gameResults].sort((a, b) => b.score - a.score);

  // Find current player's position
  const currentPlayerRank =
    sortedResults.findIndex(
      (player) =>
        player.walletId === currentUser?.walletId ||
        player.wallet === currentUser?.walletId
    ) + 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
    if (rank <= 10) return <Star className="w-4 h-4 text-purple-400" />;
    return <Target className="w-4 h-4 text-blue-400" />;
  };

  const getPodiumStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bgGradient: "bg-gradient-to-r from-yellow-600/40 to-yellow-500/40",
          border: "border-l-4 border-yellow-400",
          rankColor: "text-yellow-300",
          rankIcon: "🥇",
          glow: "shadow-lg shadow-yellow-500/20",
        };
      case 2:
        return {
          bgGradient: "bg-gradient-to-r from-gray-400/40 to-gray-300/40",
          border: "border-l-4 border-gray-300",
          rankColor: "text-gray-300",
          rankIcon: "🥈",
          glow: "shadow-lg shadow-gray-400/20",
        };
      case 3:
        return {
          bgGradient: "bg-gradient-to-r from-amber-600/40 to-amber-500/40",
          border: "border-l-4 border-amber-400",
          rankColor: "text-amber-300",
          rankIcon: "🥉",
          glow: "shadow-lg shadow-amber-500/20",
        };
      default:
        return {
          bgGradient: "",
          border: "",
          rankColor: "text-cyan-300",
          rankIcon: "",
          glow: "",
        };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Game Results Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-orbitron font-bold mb-6 text-neon-blue drop-shadow-neon">
              🎮 Game Complete! 🎮
            </h2>
            {winnerWallet && (
              <motion.div
                className="mb-6 px-8 py-6 rounded-xl bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 text-white font-bold text-3xl shadow-neon-glow flex items-center justify-center gap-4 animate-pulse"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Trophy className="w-10 h-10 text-yellow-300 drop-shadow" />
                <span className="text-yellow-300">
                  🏆 Champion:{" "}
                  {sortedResults[0]?.username ||
                    sortedResults[0]?.oath ||
                    winnerWallet}
                </span>
                <Trophy className="w-10 h-10 text-yellow-300 drop-shadow" />

                {/* Confetti effect for winner */}
                {winnerWallet === currentUser?.walletId && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <div
                      className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="absolute top-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="absolute top-0 left-3/4 w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                    <div
                      className="absolute top-4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.6s" }}
                    ></div>
                    <div
                      className="absolute top-4 left-2/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.8s" }}
                    ></div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Current Player Position */}
            {currentPlayerRank > 0 && (
              <motion.div
                className="mb-6 px-6 py-4 rounded-xl bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 border border-neon-blue/50 text-white font-bold text-xl shadow-neon-glow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <Target className="w-6 h-6 text-neon-blue" />
                  <span>Your Position: </span>
                  <span className="text-neon-purple font-orbitron text-2xl">
                    #{currentPlayerRank}
                  </span>
                  {currentPlayerRank === 1 && (
                    <span className="text-yellow-300 ml-2">🎉 You Won!</span>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Game Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-md">
              <CardHeader>
                <CardTitle className="text-neon-purple text-xl">
                  📊 Game Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                    <div className="text-2xl font-orbitron font-bold text-neon-blue">
                      {players.length}
                    </div>
                    <div className="text-sm text-gray-400">Players</div>
                  </div>
                  <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                    <div className="text-2xl font-orbitron font-bold text-neon-purple">
                      {totalQuestions}
                    </div>
                    <div className="text-sm text-gray-400">Questions</div>
                  </div>
                  <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                    <div className="text-2xl font-orbitron font-bold text-green-400">
                      {Math.round(
                        sortedResults.reduce((sum, p) => sum + p.score, 0) /
                          sortedResults.length
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Avg Score</div>
                  </div>
                  <div className="text-center p-4 bg-cyber-darker/50 rounded-lg">
                    <div className="text-2xl font-orbitron font-bold text-yellow-400">
                      {sortedResults[0]?.score || 0}
                    </div>
                    <div className="text-sm text-gray-400">Top Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Podium Display for Top 3 */}
          {sortedResults.length >= 3 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
                <CardHeader>
                  <CardTitle className="text-center text-neon-blue text-2xl">
                    🏆 Podium Winners 🏆
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* 2nd Place */}
                    <motion.div
                      className="order-1 md:order-1 text-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <Card className="bg-black/30 backdrop-blur-xl border border-gray-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-gray-500/20 transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="text-6xl mb-4">🥈</div>
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {sortedResults[1]?.username?.substring(0, 4) ||
                                "N/A"}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-white">
                            {sortedResults[1]?.username ||
                              sortedResults[1]?.oath ||
                              "Unknown"}
                          </h3>
                          <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                            {sortedResults[1]?.score || 0}
                          </div>
                          <div className="text-sm text-gray-400">2nd Place</div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* 1st Place - Enhanced */}
                    <motion.div
                      className="order-2 md:order-2 text-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <Card className="bg-black/30 backdrop-blur-xl border-2 border-yellow-400/70 rounded-lg p-8 mb-4 shadow-2xl shadow-yellow-500/30 animate-pulse">
                        <CardContent className="p-0">
                          <div className="text-8xl mb-4 animate-bounce">🥇</div>
                          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
                            <span className="text-xl font-bold text-white">
                              {sortedResults[0]?.username?.substring(0, 4) ||
                                "N/A"}
                            </span>
                          </div>
                          <h3 className="text-2xl font-semibold mb-2 text-white">
                            {sortedResults[0]?.username ||
                              sortedResults[0]?.oath ||
                              "Unknown"}
                          </h3>
                          <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                            {sortedResults[0]?.score || 0}
                          </div>
                          <div className="text-sm text-yellow-300 font-bold">
                            🏆 Champion
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                      className="order-3 md:order-3 text-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <Card className="bg-black/30 backdrop-blur-xl border border-orange-400/30 rounded-lg p-6 mb-4 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="text-6xl mb-4">🥉</div>
                          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {sortedResults[2]?.username?.substring(0, 4) ||
                                "N/A"}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-white">
                            {sortedResults[2]?.username ||
                              sortedResults[2]?.oath ||
                              "Unknown"}
                          </h3>
                          <div className="text-2xl font-orbitron font-bold text-cyan-400 mb-2">
                            {sortedResults[2]?.score || 0}
                          </div>
                          <div className="text-sm text-gray-400">3rd Place</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Full Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
              <CardHeader>
                <CardTitle className="text-neon-blue text-xl">
                  Final Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 text-white">
                        <th className="px-6 py-3 rounded-tl-xl text-left">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left">Player</th>
                        <th className="px-6 py-3 text-center">Score</th>
                        <th className="px-6 py-3 rounded-tr-xl text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {sortedResults.map((player, idx) => {
                          const rank = idx + 1;
                          const isPodium = rank <= 3;
                          const isCurrentUser =
                            player.walletId === currentUser?.walletId ||
                            player.wallet === currentUser?.walletId;
                          const isWinner =
                            winnerWallet === player.walletId ||
                            winnerWallet === player.wallet;
                          const styling = getPodiumStyling(rank);

                          return (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className={`transition-all duration-200 text-center ${
                                isWinner
                                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400 shadow-neon-glow font-bold scale-105"
                                  : isCurrentUser
                                  ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-2 border-neon-blue shadow-neon-glow font-bold"
                                  : "bg-cyber-darker/80 hover:bg-neon-blue/10 border border-neon-blue/20"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                      isPodium
                                        ? "bg-yellow-500 text-black"
                                        : isCurrentUser
                                        ? "bg-neon-purple text-white"
                                        : "bg-neon-blue text-white"
                                    }`}
                                  >
                                    {rank}
                                  </div>
                                  {getRankIcon(rank)}
                                  {isCurrentUser && (
                                    <span className="text-neon-blue text-xs font-bold">
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-left">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {(player.username || player.oath || "U")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-100">
                                      {player.username ||
                                        player.oath ||
                                        "Unknown"}
                                      {isCurrentUser && (
                                        <span className="ml-2 text-neon-blue text-sm font-bold">
                                          (You)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-400 font-mono">
                                      {player.walletId ||
                                        player.wallet ||
                                        "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div
                                  className={`font-bold text-shadow-cyber ${
                                    isWinner
                                      ? "text-3xl text-yellow-200"
                                      : isPodium
                                      ? rank === 2
                                        ? "text-xl text-gray-200"
                                        : "text-xl text-amber-200"
                                      : isCurrentUser
                                      ? "text-xl text-neon-purple"
                                      : "text-xl text-cyan-200"
                                  }`}
                                >
                                  {player.score}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {isWinner ? (
                                  <span className="flex items-center gap-1 text-yellow-300 font-bold">
                                    <Crown className="w-5 h-5" /> Champion
                                  </span>
                                ) : isCurrentUser ? (
                                  <span className="flex items-center gap-1 text-neon-blue font-bold">
                                    <Target className="w-4 h-4" /> You
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Player</span>
                                )}
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
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleFinished}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 px-4 py-4 text-sm font-bold shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-6 h-6 mr-3" />
                Back to Home
              </Button>

              <Button
                onClick={() => {
                  // Copy results to clipboard
                  const resultsText = `🎮 Quiz Game Results 🎮\n\n🏆 Champion: ${
                    sortedResults[0]?.username || sortedResults[0]?.oath
                  }\n📊 Your Position: #${currentPlayerRank}\n\n${sortedResults
                    .map(
                      (p, idx) =>
                        `${idx + 1}. ${p.username || p.oath}: ${p.score} pts`
                    )
                    .join("\n")}`;
                  navigator.clipboard.writeText(resultsText);
                  toast({
                    title: "Results Copied!",
                    description: "Game results copied to clipboard",
                    variant: "default",
                  });
                }}
                variant="outline"
                className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 transition-all duration-200 px-4 py-4 text-md font-bold"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Results
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
