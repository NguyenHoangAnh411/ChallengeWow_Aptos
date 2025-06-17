'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MotionComponent = dynamic(() => import('./motion-component'), { ssr: false });

interface ClientMotionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'button';
  initial?: any;
  animate?: any;
  whileHover?: any;
  whileTap?: any;
  transition?: any;
  children: React.ReactNode;
}

export function ClientMotion({ as = 'div', children, ...props }: ClientMotionProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    const { initial, animate, whileHover, whileTap, transition, ...restProps } = props;
    if (as === 'button') {
      return <button {...restProps}>{children}</button>;
    }
    return <div {...restProps}>{children}</div>;
  }

  return (
    <MotionComponent as={as} {...props}>
      {children}
    </MotionComponent>
  );
} 