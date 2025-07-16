"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

interface CustomRainbowKitProviderProps {
  children: React.ReactNode;
}

export function CustomRainbowKitProvider({ children }: CustomRainbowKitProviderProps) {
  return (
    <RainbowKitProvider>
      {children}
    </RainbowKitProvider>
  );
} 