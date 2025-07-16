import { useGameState } from "@/lib/game-state";
import { formatTime } from "@/lib/utils";
import { GameStatus } from "@/types/GameStatus";
import { Room } from "@/types/schema";
import { Clock, Eye, Play, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";

export const GameHistoryItem: React.FC<{ room: Room }> = ({ room }) => {
  const router = useRouter();
  const { currentUser } = useGameState();

  const getStatusInfo = (status: GameStatus) => {
    switch (status) {
      case GameStatus.WAITING:
      case GameStatus.COUNTING_DOWN:
        return { label: "Waiting", color: "text-gray-400" };
      case GameStatus.IN_PROGRESS:
      case GameStatus.QUESTION_RESULT:
        return { label: "In Progress", color: "text-yellow-400" };
      case GameStatus.FINISHED:
        return { label: "Finished", color: "text-green-400" };
      case GameStatus.CANCELLED:
        return { label: "Cancelled", color: "text-red-400" };
      default:
        return { label: "Unknown", color: "text-gray-400" };
    }
  };

  const getPlayerResult = () => {
    if (room.status === GameStatus.FINISHED) {
      if (room.winnerWalletId === currentUser?.walletId) {
        return { label: "Victory", color: "text-green-400", icon: Trophy };
      } else {
        return { label: "Defeat", color: "text-red-400", icon: X };
      }
    }
    return null;
  };

  const getActionButton = () => {
    if (
      room.status === GameStatus.IN_PROGRESS ||
      room.status === GameStatus.QUESTION_RESULT
    ) {
      return (
        <button
          onClick={handleRejoin}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#b16cea] to-[#3beaff] text-white font-orbitron text-sm rounded-lg hover:scale-110 hover:shadow-2xl hover:shadow-[#b16cea]/60 transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#3beaff] to-[#b16cea] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Play
            size={16}
            className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          />
          <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
            Continue Playing
          </span>
        </button>
      );
    } else if (
      room.status === GameStatus.FINISHED ||
      room.status === GameStatus.CANCELLED
    ) {
      return (
        <button
          onClick={handleRoomDetail}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3beaff]/20 to-[#b16cea]/20 border-2 border-[#3beaff] text-[#3beaff] font-orbitron text-sm rounded-lg hover:scale-110 hover:shadow-2xl hover:shadow-[#3beaff]/60 hover:bg-gradient-to-r hover:from-[#3beaff]/30 hover:to-[#b16cea]/30 transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#b16cea]/10 to-[#3beaff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Eye
            size={16}
            className="relative z-10 drop-shadow-[0_0_4px_rgba(59,234,255,0.8)]"
          />
          <span className="relative z-10 drop-shadow-[0_0_4px_rgba(59,234,255,0.8)]">
            View Details
          </span>
        </button>
      );
    }
    return null;
  };

  const statusInfo = getStatusInfo(room.status);
  const playerResult = getPlayerResult();
  const timeRange = room.startedAt
    ? `${formatTime(room.startedAt)} ${
        room.endedAt ? `→ ${formatTime(room.endedAt)}` : ""
      }`
    : "No start time";

  if (!currentUser) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const handleRoomDetail = async () => {
    router.push(`/history/${room.id}`);
  };

  const handleRejoin = async () => {
    
  };

  return (
    <div className="bg-gradient-to-br from-[#b16cea]/5 via-[#3beaff]/5 to-[#b16cea]/5 backdrop-blur-md border border-[#b16cea]/40 rounded-xl p-6 hover:border-[#b16cea]/80 hover:shadow-2xl hover:shadow-[#b16cea]/50 transition-all duration-500 relative overflow-hidden">
      {/* Neon glow background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#b16cea]/10 via-transparent to-[#3beaff]/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex-1 space-y-3">
          {/* Room Code */}
          <div className="flex items-center gap-2">
            <span className="text-[#b16cea] font-orbitron text-lg font-bold drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
              #{room.roomCode}
            </span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-orbitron ${statusInfo.color} bg-black/40 backdrop-blur-sm border border-current/30 shadow-[0_0_10px_currentColor] animate-pulse`}
            >
              {statusInfo.label}
            </div>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2 text-[#3beaff]">
            <Clock
              size={16}
              className="text-[#3beaff] drop-shadow-[0_0_6px_rgba(59,234,255,0.8)]"
            />
            <span className="font-orbitron text-sm drop-shadow-[0_0_4px_rgba(59,234,255,0.6)]">
              {timeRange}
            </span>
          </div>

          {/* Player Result */}
          {playerResult && (
            <div className="flex items-center gap-2">
              <playerResult.icon
                size={16}
                className={`${playerResult.color} drop-shadow-[0_0_6px_currentColor]`}
              />
              <span
                className={`font-orbitron text-sm font-bold ${playerResult.color} drop-shadow-[0_0_4px_currentColor]`}
              >
                {playerResult.label}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">{getActionButton()}</div>
      </div>
    </div>
  );
};
