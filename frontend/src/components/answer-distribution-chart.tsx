import React from "react";
import { Trophy, Users, Zap } from "lucide-react";

// Định nghĩa type cho dữ liệu
interface LeaderboardPlayer {
  walletId: string;
  username: string;
  score: number;
  rank: number;
}

interface QuestionResultPayload {
  questionIndex: number;
  correctAnswer: string;
  explanation: string | null;
  answerStats: { [key: string]: number };
  totalResponses: number;
  totalPlayers: number;
  options: string[];
  leaderboard: LeaderboardPlayer[];
}

interface AnswerDistributionChartProps {
  answerStats: Record<string, number>;
  correctAnswer: string;
  options: string[];
  totalPlayers: number;
  totalResponses: number;
  currentUserSelection?: string;
}

const AnswerDistributionChart: React.FC<AnswerDistributionChartProps> = ({
  answerStats = {
    "Option A": 25,
    "Option B": 15,
    "Option C": 30,
    "Option D": 10,
  },
  correctAnswer = "Option C",
  options = ["Option A", "Option B", "Option C", "Option D"],
  totalPlayers = 80,
  totalResponses = 80,
  currentUserSelection = "Option B",
}) => {
  const maxCount = Math.max(...Object.values(answerStats));

  const availableHeight =
    typeof window !== "undefined" ? window.innerHeight - 600 : 250;
  const maxHeight = Math.min(Math.max(availableHeight, 150), 200);

  // Neon colors for different answer options
  const colors = [
    {
      bg: "bg-pink-500",
      glow: "shadow-pink-500/50",
      neon: "from-pink-400 to-pink-600",
    },
    {
      bg: "bg-cyan-500",
      glow: "shadow-cyan-500/50",
      neon: "from-cyan-400 to-cyan-600",
    },
    {
      bg: "bg-yellow-500",
      glow: "shadow-yellow-500/50",
      neon: "from-yellow-400 to-yellow-600",
    },
    {
      bg: "bg-green-500",
      glow: "shadow-green-500/50",
      neon: "from-green-400 to-green-600",
    },
    {
      bg: "bg-purple-500",
      glow: "shadow-purple-500/50",
      neon: "from-purple-400 to-purple-600",
    },
  ];

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Loại bỏ 'No Answer' khỏi options khi render biểu đồ
  const filteredOptions = options.filter((opt) => opt !== "No Answer");

  return (
    <div className="max-w-7xl mx-auto p-6 bg-black flex flex-col">
      {/* Header */}
      <div className="text-center mb-8 flex-shrink-0">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 font-mono tracking-wider">
          ANSWER DISTRIBUTION
        </h1>
        <div className="flex justify-center items-center gap-4 md:gap-8 text-gray-400 font-mono text-sm md:text-base">
          <div className="flex items-center gap-2 border border-gray-700 px-3 md:px-4 py-2 rounded-lg">
            <Users
              size={16}
              className="text-cyan-400 md:w-[18px] md:h-[18px]"
            />
            <span>{totalPlayers} PLAYERS</span>
          </div>
          <div className="flex items-center gap-2 border border-gray-700 px-3 md:px-4 py-2 rounded-lg">
            <Zap
              size={16}
              className="text-yellow-400 md:w-[18px] md:h-[18px]"
            />
            <span>{totalResponses} RESPONSES</span>
          </div>
        </div>
      </div>

      {/* Answer Distribution - Column Chart */}
      <div className="mt-15 flex-1 flex items-end justify-center">
        <div
          className="flex items-end justify-center gap-8 md:gap-12 mb-8"
          style={{ height: `${maxHeight + 120}px` }}
        >
          {filteredOptions.map((answer, index) => {
            const count = (answerStats as Record<string, number>)[answer] || 0;
            const isCorrect = answer === correctAnswer;
            const isUserSelection = answer === currentUserSelection;
            const barHeight =
              maxCount > 0 ? Math.max((count / maxCount) * maxHeight, 40) : 40;
            const color = colors[index % colors.length];

            return (
              <div
                key={answer}
                className="flex flex-col items-center group w-20 md:w-24"
              >
                {/* User icon above column - Fixed width container */}
                <div className="h-10 md:h-12 w-full flex items-end justify-center mb-3 md:mb-4">
                  {isUserSelection && (
                    <div
                      className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center
                        animate-pulse
                        ${
                          isCorrect
                            ? "bg-gradient-to-r from-green-400 to-emerald-500 border-green-300 shadow-lg shadow-green-400/50"
                            : "bg-gradient-to-r from-blue-400 to-cyan-500 border-cyan-300 shadow-lg shadow-cyan-400/50"
                        }
                      `}
                    >
                      <div className="text-white text-sm md:text-lg">⚡</div>
                    </div>
                  )}
                </div>

                {/* Column - Centered in fixed width container */}
                <div className="relative flex flex-col items-center w-full">
                  <div
                    className={`
                      w-16 md:w-20 relative overflow-hidden transition-all duration-1000 ease-out mx-auto
                      ${
                        isCorrect
                          ? `bg-gradient-to-t ${color.neon} shadow-2xl ${color.glow} border-t-4 border-white`
                          : `${color.bg} opacity-30 border-t-2 border-gray-600`
                      }
                      group-hover:scale-105 group-hover:brightness-110
                    `}
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Subtle grid pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                                           linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: "10px 10px",
                      }}
                    />

                    {/* Count number inside column */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <span
                        className={`
                          font-bold text-xl md:text-2xl font-mono
                          ${
                            isCorrect
                              ? "text-white drop-shadow-lg"
                              : "text-gray-300"
                          }
                        `}
                      >
                        {count}
                      </span>
                    </div>

                    {/* Neon glow effect for correct answer */}
                    {isCorrect && (
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${color.neon} opacity-20 animate-pulse`}
                      />
                    )}
                  </div>

                  {/* Base line - Centered with column */}
                  <div
                    className={`w-20 md:w-24 h-1 ${
                      isCorrect ? "bg-white shadow-lg" : "bg-gray-600"
                    }`}
                  />
                </div>

                {/* Letter and label below - Centered in fixed width container */}
                <div className="mt-4 md:mt-6 text-center w-full flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold font-mono mb-2 md:mb-3 border-2
                      transition-all duration-300
                      ${
                        isCorrect
                          ? `bg-gradient-to-r ${color.neon} text-white border-white shadow-2xl ${color.glow} animate-pulse`
                          : "bg-gray-800 text-gray-400 border-gray-600"
                      }
                    `}
                  >
                    {letters[index]}
                  </div>
                  <div
                    className={`
                      text-xs font-mono leading-tight uppercase tracking-wide text-center
                      max-w-full px-1 break-words
                      ${isCorrect ? "text-white font-bold" : "text-gray-500"}
                    `}
                  >
                    {answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnswerDistributionChart;
