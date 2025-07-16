import { Room } from "@/types/schema";
import { Crown, Medal, User } from "lucide-react";

interface PlayersTabProps {
  gameDetail: Room;
  currentUserWallet: string;
}

export const PlayersTab = ({
  gameDetail,
  currentUserWallet,
}: PlayersTabProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-orbitron font-bold text-[#b16cea] mb-4 drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
        Leaderboard
      </h3>
      {gameDetail.players
        .sort((a, b) => b.score - a.score)
        .map((player, index) => {
          const correctAnswers = player.answers.filter(
            (a) => a.isCorrect
          ).length;
          const totalAnswers = player.answers.length;
          const accuracy =
            totalAnswers > 0
              ? Math.round((correctAnswers / totalAnswers) * 100)
              : 0;

          return (
            <div
              key={player.walletId}
              className={`bg-gradient-to-r from-[#b16cea]/10 via-[#3beaff]/5 to-transparent border rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${
                player.walletId === currentUserWallet
                  ? "border-[#b16cea]/60 shadow-[#b16cea]/30"
                  : "border-[#3beaff]/30 hover:border-[#3beaff]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Crown
                        className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                        size={20}
                      />
                    )}
                    {index === 1 && (
                      <Medal
                        className="text-gray-300 drop-shadow-[0_0_8px_rgba(156,163,175,0.8)]"
                        size={20}
                      />
                    )}
                    {index === 2 && (
                      <Medal
                        className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]"
                        size={20}
                      />
                    )}
                    <span className="text-2xl font-orbitron font-bold text-[#3beaff] drop-shadow-[0_0_8px_rgba(59,234,255,0.8)]">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#b16cea] to-[#3beaff] flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div>
                      <div className="font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_4px_rgba(177,108,234,0.6)]">
                        {player.username}
                        {player.walletId === currentUserWallet && (
                          <span className="ml-2 text-xs bg-[#3beaff]/20 text-[#3beaff] px-2 py-1 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#3beaff]/80 font-orbitron">
                        {player.walletId.slice(0, 6)}...
                        {player.walletId.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
                    {player.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#3beaff]/80 font-orbitron">
                    {correctAnswers}/{totalAnswers} correct
                  </div>
                  <div className="text-xs text-yellow-400/80 font-orbitron">
                    {Math.round((correctAnswers / totalAnswers) * 100)}%
                    accuracy
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
