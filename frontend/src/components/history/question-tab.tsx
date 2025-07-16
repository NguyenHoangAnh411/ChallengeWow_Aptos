import { useGameState } from "@/lib/game-state";
import { Room } from "@/types/schema";

interface QuestionsTabProps {
  gameDetail: Room;
}

export const QuestionsTab = ({ gameDetail }: QuestionsTabProps) => {
  const { currentUser } = useGameState();

  const currentPlayer = gameDetail.players.find(
    (p) => p.walletId === currentUser?.walletId
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-orbitron font-bold text-[#b16cea] mb-4 drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
        Questions Review
      </h3>
      {gameDetail.currentQuestions.map((question, index) => {
        const userAnswer = currentPlayer?.answers.find(
          (a) => a.questionId === question.id
        );

        return (
          <div
            key={question.id}
            className="bg-gradient-to-r from-[#b16cea]/10 via-[#3beaff]/5 to-transparent border border-[#3beaff]/30 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_8px_rgba(177,108,234,0.8)]">
                  Q{index + 1}
                </span>
                <div className="text-[#3beaff] font-orbitron drop-shadow-[0_0_4px_rgba(59,234,255,0.6)]">
                  {question.content}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.options.map((option, optIndex) => {
                const isCorrect = option === question.correctAnswer;
                const isUserAnswer = userAnswer?.answer === option;

                return (
                  <div
                    key={optIndex}
                    className={`p-3 rounded-lg border font-orbitron text-sm transition-all duration-300
                        ${
                          isCorrect
                            ? "bg-green-400/20 border-green-400/50 text-green-400"
                            : ""
                        }
                        ${isUserAnswer ? "ring-2 ring-yellow-400" : ""}
                    `}
                  >
                    <span className="font-bold">
                      {String.fromCharCode(65 + optIndex)}.
                    </span>{" "}
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
