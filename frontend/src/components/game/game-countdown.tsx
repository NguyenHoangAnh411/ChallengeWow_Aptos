import { motion } from "framer-motion";
import TimerCircle from "../timer-circle";
import { useGameState } from "@/lib/game-state";

interface GameCountdownProps {
  countdown: number;
  handleTimeUp: () => void;
}

export const GameCountdown = ({
  countdown,
  handleTimeUp,
}: GameCountdownProps) => {
  const { totalQuestions } = useGameState();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8">
          <TimerCircle
            duration={3}
            className="mx-auto"
            onTimeUp={handleTimeUp}
            isPaused={false}
          />
        </div>
        <h2 className="text-4xl font-orbitron font-bold mb-4 text-neon-blue drop-shadow-neon">
          Game Starting in...
        </h2>
        <div className="text-6xl font-orbitron font-bold text-neon-purple animate-pulse">
          {countdown}
        </div>
        <p className="text-xl text-gray-400 mt-4">
          Get ready for {totalQuestions} questions!
        </p>
      </motion.div>
    </div>
  );
};
