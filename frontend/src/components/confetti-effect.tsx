"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiEffectProps {
  isActive: boolean;
  color?: string;
}

export default function ConfettiEffect({
  isActive,
  color = "#fbbf24",
}: ConfettiEffectProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      rotation: number;
      scale: number;
    }>
  >([]);

  useEffect(() => {
    if (isActive) {
      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
      }));
      setParticles(newParticles);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{
            opacity: 0,
            scale: 0,
            y: -20,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, particle.scale, 0],
            y: [-20, -100],
            x: [0, (Math.random() - 0.5) * 100],
            rotate: [0, particle.rotation],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: particle.id * 0.1,
          }}
        />
      ))}
    </div>
  );
}
