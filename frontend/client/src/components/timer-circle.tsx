'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimerCircleProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  className?: string;
}

export default function TimerCircle({ duration, onTimeUp, className = "" }: TimerCircleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const progress = (duration - timeLeft) / duration;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const getStrokeColor = () => {
    if (timeLeft <= 5) return "#EF4444"; // Red
    if (timeLeft <= 10) return "#F59E0B"; // Yellow
    return "#00D4FF"; // Blue
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 blur-xl animate-pulse"></div>
      
      {/* Main timer circle */}
      <div className="relative w-32 h-32 rounded-full glass-morphism border-2 border-neon-blue/30 flex items-center justify-center">
        <svg className="absolute w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgba(0, 212, 255, 0.2)"
            strokeWidth="6"
            fill="transparent"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke={getStrokeColor()}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 drop-shadow-[0_0_10px_currentColor]"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress }}
          />
          
          {/* Inner decorative circles */}
          <circle
            cx="50"
            cy="50"
            r="25"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth="1"
            fill="transparent"
            className="animate-spin"
            style={{ animationDuration: '20s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            stroke="rgba(138, 43, 226, 0.1)"
            strokeWidth="1"
            fill="transparent"
            className="animate-spin"
            style={{ animationDuration: '15s', animationDirection: 'reverse' }}
          />
        </svg>
        
        {/* Timer display */}
        <motion.div
          className="relative z-10 flex flex-col items-center"
          animate={{ 
            scale: timeLeft <= 5 ? [1, 1.1, 1] : 1,
            rotate: timeLeft <= 3 ? [0, 2, -2, 0] : 0
          }}
          transition={{ 
            duration: 0.5, 
            repeat: timeLeft <= 5 ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <span
            className="text-3xl font-orbitron font-bold drop-shadow-[0_0_10px_currentColor]"
            style={{ color: getStrokeColor() }}
          >
            {timeLeft}
          </span>
          <span className="text-xs text-gray-400 font-medium">seconds</span>
        </motion.div>

        {/* Warning pulse for low time */}
        {timeLeft <= 5 && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </div>
  );
}
