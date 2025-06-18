'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { HTMLMotionProps } from 'framer-motion';

const MotionComponent = dynamic(() => import('./motion-component'), { ssr: false });

type ClientMotionProps = {
  as?: 'div' | 'button';
  children: React.ReactNode;
} & Partial<HTMLMotionProps<"div"> & HTMLMotionProps<"button">>;

export function ClientMotion({ as = 'div', children, ...props }: ClientMotionProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    const { initial, animate, whileHover, whileTap, transition, style, ...restProps } = props;
    if (as === 'button') {
      return <button {...(restProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
    }
    return <div {...(restProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <MotionComponent as={as} {...props}>
      {children}
    </MotionComponent>
  );
}