import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameState } from "@/lib/game-state";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import AnswerDistributionChart from "../answer-distribution-chart";
import { Timer } from "lucide-react";

interface QuestionResultProps {
  handleFinished: () => void;
}

export const QuestionResult = ({ handleFinished }: QuestionResultProps) => {
  const {
    gameStatus,
    questionIndex,
    selectedAnswer,
    questionResult,
    currentUser,
  } = useGameState();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Result Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-orbitron font-bold mb-4 text-neon-blue drop-shadow-neon">
              Question {questionIndex + 1} Results
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-400 text-lg px-4 py-2"
              >
                Correct Answer: {questionResult?.correctAnswer}
              </Badge>
            </div>
          </div>

          {/* Answer Distribution */}
          <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-md mb-8">
            <CardHeader>
              <CardTitle className="text-neon-purple">
                Answer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questionResult?.answerStats &&
              questionResult?.correctAnswer &&
              questionResult?.totalPlayers &&
              questionResult?.options ? (
                <AnswerDistributionChart
                  answerStats={questionResult.answerStats}
                  correctAnswer={questionResult.correctAnswer}
                  totalPlayers={questionResult.totalPlayers}
                  options={[...questionResult.options, "No Answer"]}
                  currentUserSelection={selectedAnswer || undefined}
                  totalResponses={questionResult.totalResponses || 0}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Loading answer distribution...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Leaderboard with Rank Change Effects */}
          <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
            <CardHeader>
              <CardTitle className="text-neon-blue">
                Current Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionResult?.leaderboard?.map((player, idx) => {
                  const isCurrentUser =
                    player.walletId === currentUser?.walletId;
                  const isTop3 = idx < 3;

                  return (
                    <motion.div
                      key={player.walletId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`relative p-4 rounded-lg border transition-all duration-300 ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue shadow-neon-glow"
                          : isTop3
                          ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                          : "bg-cyber-darker/50 border-gray-700/50"
                      }`}
                    >
                      {/* Rank Change Indicator */}
                      <motion.div
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                      >
                        {(player.rankChange ?? 0) > 0 ? (
                          <div className="bg-green-500 text-white animate-bounce">
                            ↑{player.rankChange}
                          </div>
                        ) : (player.rankChange ?? 0) < 0 ? (
                          <div className="bg-red-500 text-white animate-bounce">
                            ↓{Math.abs(player.rankChange ?? 0)}
                          </div>
                        ) : (
                          <div className="bg-gray-500 text-white">–</div>
                        )}
                      </motion.div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isTop3
                                ? idx === 0
                                  ? "bg-yellow-500 text-black"
                                  : idx === 1
                                  ? "bg-gray-400 text-black"
                                  : "bg-orange-500 text-black"
                                : isCurrentUser
                                ? "bg-neon-purple text-white"
                                : "bg-neon-blue text-white"
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.1 + 0.2,
                            }}
                          >
                            {player.rank}
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-100 flex items-center gap-2">
                              {player.username}
                              {isCurrentUser && (
                                <span className="text-neon-blue text-sm font-bold">
                                  (You)
                                </span>
                              )}
                              {isTop3 && (
                                <span className="text-yellow-400">
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {player.walletId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.div
                            className={`text-xl font-bold ${
                              isTop3
                                ? "text-yellow-400"
                                : isCurrentUser
                                ? "text-neon-purple"
                                : "text-cyan-400"
                            }`}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.1 + 0.4,
                            }}
                          >
                            {player.score}
                          </motion.div>
                          <div className="text-sm text-gray-400">points</div>
                        </div>
                      </div>

                      {/* Score Change Animation */}
                      {player.scoreChange && (
                        <motion.div
                          className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-bold ${
                            player.scoreChange > 0
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.1 + 0.6 }}
                        >
                          {player.scoreChange > 0 ? "+" : ""}
                          {player.scoreChange}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Next Question Countdown */}
          {gameStatus === "finished" ? (
            <button
              className="mt-8 px-6 py-3 rounded-lg bg-neon-blue text-white font-bold shadow-neon-glow hover:bg-neon-purple transition-all"
              onClick={handleFinished}
            >
              Back to Lobby
            </button>
          ) : (
            <div className="text-center mt-8">
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-neon-purple animate-pulse">
                <Timer className="w-5 h-5" />
                <span className="font-semibold">
                  Next question in 3 seconds...
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
