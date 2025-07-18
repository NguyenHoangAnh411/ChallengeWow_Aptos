import { useState, useEffect } from 'react';
import { isPetraInstalled, connectPetraWallet, disconnectPetraWallet, getPetraAccount } from '@/lib/petra-connector';
import { useGameState } from '@/lib/game-state';

export function usePetraWallet() {
  const [isConnected, setIsConnected] = useState(false);
  // const [account, setAccount] = useState<string | null>(null);
  const { currentUser, setCurrentUser } = useGameState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Petra is installed
  const installed = isPetraInstalled();

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (installed) {
        try {
          const currentAccount = await getPetraAccount();
          if (currentAccount) {
            // setAccount(currentAccount.address);
            setCurrentUser({
              ...currentUser,
              walletId: currentAccount.address,
              totalScore: currentUser?.totalScore ?? 0,
              gamesWon: currentUser?.gamesWon ?? 0,
              rank: currentUser?.rank ?? 0,
              createdAt: currentUser?.createdAt ?? "",
              username: currentUser?.username ?? null,
            });
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Failed to check Petra connection:', error);
        }
      }
    };

    checkConnection();
  }, [installed]);

  // Auto-connect function that can be called externally
  const autoConnect = async (expectedAddress?: string) => {
    if (!installed || isConnected || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await connectPetraWallet();
      // setAccount(result.address);
      setCurrentUser({
        ...currentUser,
        walletId: result.address,
        totalScore: currentUser?.totalScore ?? 0,
        gamesWon: currentUser?.gamesWon ?? 0,
        rank: currentUser?.rank ?? 0,
        createdAt: currentUser?.createdAt ?? "",
        username: currentUser?.username ?? null,
      });
      setIsConnected(true);
      
      // If we have an expected address, verify it matches
      if (expectedAddress && result.address !== expectedAddress) {
        console.warn('Connected Petra address does not match expected address');
        await disconnectPetraWallet();
        // setAccount(null);
        setCurrentUser({
          ...currentUser,
          walletId: "",
          totalScore: 0,
          gamesWon: 0,
          rank: 0,
          createdAt: "",
          username: null,
        });
        setIsConnected(false);
        setError('Connected wallet address does not match your profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-connect to Petra wallet';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Petra wallet
  const connect = async () => {
    if (!installed) {
      setError('Petra wallet is not installed');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await connectPetraWallet();
      // setAccount(result.address);
      setCurrentUser({
        ...currentUser,
        walletId: result.address,
        totalScore: currentUser?.totalScore ?? 0,
        gamesWon: currentUser?.gamesWon ?? 0,
        rank: currentUser?.rank ?? 0,
        createdAt: currentUser?.createdAt ?? "",
        username: currentUser?.username ?? null,
      });
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Petra wallet';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Petra wallet
  const disconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectPetraWallet();
      // setAccount(null);
      setCurrentUser({
        ...currentUser,
        walletId: "",
        totalScore: 0,
        gamesWon: 0,
        rank: 0,
        createdAt: "",
        username: null,
      });
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect from Petra wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    installed,
    isConnected,
    // account,
    // currentUser,
    isLoading,
    error,
    connect,
    disconnect,
    autoConnect,
  };
} 