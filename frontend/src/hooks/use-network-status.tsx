"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { OLYM3_TESTNET } from "@/lib/constants";

export function useNetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setIsCorrectNetwork(false);
      setIsLoading(false);
      return;
    }

    // Check if connected to Olym3 Testnet
    const isOnOlym3 = chainId === OLYM3_TESTNET.id;
    setIsCorrectNetwork(isOnOlym3);
    setIsLoading(false);
  }, [isConnected, chainId]);

  return {
    isConnected,
    isCorrectNetwork,
    isLoading,
    currentChainId: chainId,
    targetChainId: OLYM3_TESTNET.id,
    networkName: OLYM3_TESTNET.name,
  };
} 