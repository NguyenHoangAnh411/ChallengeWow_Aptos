'use client';

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Providers({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
} 