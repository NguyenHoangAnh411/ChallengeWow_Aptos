import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { 
  contractHelpers, 
  blockchainUtils, 
  networkHelpers,
  CONTRACT_ADDRESSES 
} from '../lib/blockchain';

export const useBlockchain = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NFT Functions
  const mintNFT = useCallback(async () => {
    if (!walletClient || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const hash = await contractHelpers.mintNFT(walletClient);
      const receipt = await blockchainUtils.waitForTransaction(hash);
      return { hash, receipt };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint NFT';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, isConnected]);

  const transferNFT = useCallback(async (to: string, tokenId: number) => {
    if (!walletClient || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const hash = await contractHelpers.transferNFT(walletClient, to, tokenId);
      const receipt = await blockchainUtils.waitForTransaction(hash);
      return { hash, receipt };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer NFT';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, isConnected]);

  // Balance Functions
  const getNFTBalance = useCallback(async (address?: string) => {
    const targetAddress = address || (isConnected ? address : null);
    if (!targetAddress) return "0";

    try {
      const balance = await contractHelpers.getNFTBalance(targetAddress);
      return balance;
    } catch (err) {
      console.error('Failed to get NFT balance:', err);
      return "0";
    }
  }, [isConnected, address]);

  const getOLYMBalance = useCallback(async (address?: string) => {
    const targetAddress = address || (isConnected ? address : null);
    if (!targetAddress) return "0";

    try {
      const balance = await contractHelpers.getOLYMBalance(targetAddress);
      return balance;
    } catch (err) {
      console.error('Failed to get OLYM balance:', err);
      return "0";
    }
  }, [isConnected, address]);

  const getNativeBalance = useCallback(async (address?: string) => {
    const targetAddress = address || (isConnected ? address : null);
    if (!targetAddress) return "0";

    try {
      const balance = await contractHelpers.getNativeBalance(targetAddress);
      return balance;
    } catch (err) {
      console.error('Failed to get native balance:', err);
      return "0";
    }
  }, [isConnected, address]);

  // Utility Functions
  const getExplorerUrl = useCallback((hash: string) => {
    return networkHelpers.getExplorerUrl(hash);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    isConnected,
    
    // NFT Functions
    mintNFT,
    transferNFT,
    getNFTBalance,
    
    // Balance Functions
    getOLYMBalance,
    getNativeBalance,
    
    // Utility Functions
    getExplorerUrl,
    clearError,
  };
}; 