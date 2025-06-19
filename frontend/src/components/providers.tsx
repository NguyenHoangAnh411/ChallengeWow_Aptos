'use client';

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http, useAccount } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useEffect } from 'react';
import { loginUser } from '@/lib/api';
import { useGameState } from '@/lib/game-state';

const config = getDefaultConfig({
  appName: 'Challenge Wave',
  projectId: '325fbe143f7ef647abd49c4a299b304a', // Đăng ký free tại https://cloud.walletconnect.com/
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

function UserAutoLogin({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { setCurrentUser } = useGameState();

  useEffect(() => {
    if (isConnected && address) {
      loginUser(address).then(user => {
        setCurrentUser(user);
      });
    }
  }, [isConnected, address, setCurrentUser]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <TooltipProvider>
            <UserAutoLogin>{children}</UserAutoLogin>
          </TooltipProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 