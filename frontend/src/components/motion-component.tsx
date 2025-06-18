'use client';

import { motion } from 'framer-motion';
import { HTMLMotionProps } from 'framer-motion';

type MotionComponentProps = {
  as: 'div' | 'button';
  children: React.ReactNode;
} & (
  | ({ as: 'div' } & HTMLMotionProps<"div">)
  | ({ as: 'button' } & HTMLMotionProps<"button">)
);

export default function MotionComponent({ as, children, ...props }: MotionComponentProps) {
  if (as === 'button') {
    return <motion.button {...(props as HTMLMotionProps<"button">)}>{children}</motion.button>;
  }
  return <motion.div {...(props as HTMLMotionProps<"div">)}>{children}</motion.div>;
} 