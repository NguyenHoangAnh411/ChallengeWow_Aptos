"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http, useAccount } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useEffect, useState } from "react";
import { loginUser } from "@/lib/api";
import { useGameState } from "@/lib/game-state";
import { Toaster } from "./ui/toaster";
import { OLYM3_TESTNET, SOLANA_DEVNET, RONIN_SAIGON, LISK_TESTNET, VICTION_TESTNET } from "@/lib/constants";
import UsernameModal from "@/components/username-modal";
import { updateUser } from "@/lib/api";
import { CustomRainbowKitProvider } from "@/components/custom-rainbowkit-provider";
import { usePetraWallet } from "@/hooks/use-petra-wallet";

const config = getDefaultConfig({
  appName: "Challenge Wave",
  projectId: "325fbe143f7ef647abd49c4a299b304a", // Đăng ký free tại https://cloud.walletconnect.com/
  chains: [OLYM3_TESTNET, SOLANA_DEVNET, RONIN_SAIGON, LISK_TESTNET, VICTION_TESTNET, baseSepolia],
  transports: {
    [OLYM3_TESTNET.id]: http(),
    [SOLANA_DEVNET.id]: http(),
    [RONIN_SAIGON.id]: http(),
    [LISK_TESTNET.id]: http(),
    [VICTION_TESTNET.id]: http(),
    [baseSepolia.id]: http(),
  },
});

function UserAutoLogin({ children }: { children: React.ReactNode }) {
  const { isConnected } = usePetraWallet();
  const { currentUser, setCurrentUser } = useGameState();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && currentUser?.walletId) {
      loginUser(currentUser.walletId).then((user) => {
        setCurrentUser(user);
        if (!user?.username) {
          setShowUsernameModal(true);
          setPendingAddress(currentUser.walletId);
        }
      });
    }
  }, [isConnected, currentUser?.walletId, setCurrentUser]);

  const handleSaveUsername = async (username: string) => {
    if (!pendingAddress) return;
    await updateUser(pendingAddress, username);
    const updatedUser = await loginUser(pendingAddress);
    setCurrentUser(updatedUser);
    setShowUsernameModal(false);
    setPendingAddress(null);
  };

  return (
    <>
      {children}
      <UsernameModal
        open={showUsernameModal}
        onOpenChange={() => {}}
        onSubmit={handleSaveUsername}
      />
    </>
  );
}

export default function Providers({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <CustomRainbowKitProvider>
          <TooltipProvider>
            <UserAutoLogin>
              {children}
              <Toaster />
            </UserAutoLogin>
          </TooltipProvider>
        </CustomRainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
