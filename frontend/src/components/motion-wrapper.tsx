'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  whileHover?: any;
  whileTap?: any;
}

export function MotionWrapper({ children, className, whileHover, whileTap }: MotionWrapperProps) {
  return (
    <motion.div
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
} 