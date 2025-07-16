import { useGameState } from "@/lib/game-state";
import { formatTime } from "@/lib/utils";
import { Room } from "@/types/schema";
import {
  Award,
  Calendar,
  Clock,
  Target,
  Timer,
  Users,
  Zap,
} from "lucide-react";

interface OverviewTabProps {
  gameDuration: number;
  gameDetail: Room;
}

export const OverviewTab = ({ gameDuration, gameDetail }: OverviewTabProps) => {
  const { currentUser } = useGameState();
  const total =
    (gameDetail.easyQuestions ?? 0) +
    (gameDetail.mediumQuestions ?? 0) +
    (gameDetail.hardQuestions ?? 0);
  const easyPercent = total > 0 ? (gameDetail.easyQuestions / total) * 100 : 0;
  const mediumPercent =
    total > 0 ? (gameDetail.mediumQuestions / total) * 100 : 0;
  const hardPercent = total > 0 ? (gameDetail.hardQuestions / total) * 100 : 0;

  const difficulty =
    hardPercent > 0.5 ? "hard" : mediumPercent > 0.5 ? "medium" : "easy";

  const currentPlayer = gameDetail.players.find(
    (p) => p.walletId === currentUser?.walletId
  );

  return (
    <div className="space-y-6">
      {/* Game Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#b16cea]/20 to-[#b16cea]/5 border border-[#b16cea]/30 rounded-xl p-4 text-center">
          <Timer
            className="mx-auto mb-2 text-[#b16cea] drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]"
            size={24}
          />
          <div className="text-2xl font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
            {gameDuration}m
          </div>
          <div className="text-sm text-[#b16cea]/80 font-orbitron">
            Duration
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#3beaff]/20 to-[#3beaff]/5 border border-[#3beaff]/30 rounded-xl p-4 text-center">
          <Target
            className="mx-auto mb-2 text-[#3beaff] drop-shadow-[0_0_8px_rgba(59,234,255,0.8)]"
            size={24}
          />
          <div className="text-2xl font-orbitron font-bold text-[#3beaff] drop-shadow-[0_0_8px_rgba(59,234,255,0.8)]">
            {total}
          </div>
          <div className="text-sm text-[#3beaff]/80 font-orbitron">
            Questions
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 border border-yellow-400/30 rounded-xl p-4 text-center">
          <Users
            className="mx-auto mb-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
            size={24}
          />
          <div className="text-2xl font-orbitron font-bold text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
            {gameDetail.players.length}
          </div>
          <div className="text-sm text-yellow-400/80 font-orbitron">
            Players
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400/20 to-green-400/5 border border-green-400/30 rounded-xl p-4 text-center">
          <Award
            className="mx-auto mb-2 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            size={24}
          />
          <div className="text-2xl font-orbitron font-bold text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
            {gameDetail.prize}
          </div>
          <div className="text-sm text-green-400/80 font-orbitron">
            Prize Pool
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="bg-gradient-to-br from-[#b16cea]/10 via-[#3beaff]/5 to-transparent border border-[#b16cea]/30 rounded-xl p-6">
        <h3 className="text-xl font-orbitron font-bold text-[#b16cea] mb-4 drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
          Game Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar
                className="text-[#3beaff] drop-shadow-[0_0_6px_rgba(59,234,255,0.8)]"
                size={20}
              />
              <div>
                <div className="text-sm text-[#3beaff]/80 font-orbitron">
                  Started At
                </div>
                <div className="text-[#3beaff] font-orbitron drop-shadow-[0_0_4px_rgba(59,234,255,0.6)]">
                  {gameDetail.startedAt
                    ? formatTime(gameDetail.startedAt)
                    : "N/A"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap
                className="text-green-400 drop-shadow-[0_0_6px_rgba(177,108,234,0.8)]"
                size={20}
              />
              <div>
                <div className="text-sm text-green-400/80 font-orbitron">
                  Score
                </div>
                <div className="text-green-400 font-orbitron drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]">
                  {currentPlayer?.score}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock
                className="text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]"
                size={20}
              />
              <div>
                <div className="text-sm text-yellow-400/80 font-orbitron">
                  Ended At
                </div>
                <div className="text-yellow-400 font-orbitron drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]">
                  {gameDetail.endedAt ? formatTime(gameDetail.endedAt) : "N/A"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target
                className="text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.8)]"
                size={20}
              />
              <div>
                <div className="text-sm text-red-400/80 font-orbitron">
                  Difficulty
                </div>
                <div
                  className={`font-orbitron ${getDifficultyColor(
                    difficulty
                  )} drop-shadow-[0_0_4px_currentColor]`}
                >
                  {difficulty.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "hard":
      return "text-orange-400";
    case "expert":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};
