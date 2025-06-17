'use client';

import { TooltipProvider } from "@radix-ui/react-tooltip";

export default function Providers({ children }: { children: JSX.Element | JSX.Element[] }) {
  return <TooltipProvider>{children}</TooltipProvider>;
} 