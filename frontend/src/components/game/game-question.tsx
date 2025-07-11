import { useGameState } from "@/lib/game-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle } from "lucide-react";

interface GameQuestionProps {
  onAnswerSelect: (option: string) => void;
}

export const GameQuestion = ({ onAnswerSelect }: GameQuestionProps) => {
  const {
    questionCountdown,
    questionIndex,
    totalQuestions,
    currentQuestion,
    selectedAnswer,
    hasAnswered,
  } = useGameState();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl">
        {/* Question Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Badge
              variant="secondary"
              className="bg-neon-blue/20 text-neon-blue text-lg px-4 py-2"
            >
              Question {questionIndex + 1} of {totalQuestions}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-neon-purple/20 text-neon-purple text-lg px-4 py-2"
            >
              {questionCountdown}s remaining
            </Badge>
          </div>
        </div>

        {/* Question Content */}
        <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-neon-blue text-center drop-shadow-lg">
              {currentQuestion?.content}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
              {currentQuestion?.options?.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === opt;
                const isDisabled = hasAnswered;
                return (
                  <button
                    key={idx}
                    className={`
                    w-full py-5 px-6 rounded-2xl border-2 font-orbitron text-lg md:text-xl transition-all duration-200
                    flex items-center gap-3 shadow-lg
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-neon-blue to-neon-purple border-neon-blue text-white scale-105 ring-2 ring-neon-purple"
                        : "bg-gray-900 border-gray-700 text-white hover:bg-neon-purple/20 hover:border-neon-purple"
                    }
                    ${
                      isDisabled && !isSelected
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                    onClick={() => onAnswerSelect(opt)}
                    disabled={isDisabled}
                  >
                    <span className="mr-2 font-bold text-neon-purple text-xl">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="flex-1 text-left">{opt}</span>
                    {isSelected && (
                      <span className="ml-2 text-neon-blue text-2xl animate-bounce">
                        ✔
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {hasAnswered && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 animate-pulse">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">
                Answer submitted! Waiting for next question...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
