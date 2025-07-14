import { useState, useCallback, useEffect } from 'react';
import { AptosAccount } from 'aptos';
import { 
  aptosClient, 
  aptosUtils, 
  APTOS_NETWORKS,
  APTOS_CONTRACT_CONFIG,
  getBalanceWithSdk
} from '../lib/aptos';

export interface AptosAccountInfo {
  address: string;
  publicKey: string;
  privateKey: string;
}

export const useAptos = () => {
  const [account, setAccount] = useState<AptosAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AptosAccountInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<keyof typeof APTOS_NETWORKS>('devnet');

  // Initialize account from localStorage or create new one
  useEffect(() => {
    const savedAccount = localStorage.getItem('aptos_account');
    if (savedAccount) {
      try {
        const accountData = JSON.parse(savedAccount);
        const aptosAccount = aptosUtils.createAccountFromPrivateKey(accountData.privateKey);
        setAccount(aptosAccount);
        setAccountInfo(accountData);
        setIsConnected(true);
        aptosClient.setAccount(aptosAccount);
      } catch (error) {
        console.error('Failed to load saved account:', error);
        localStorage.removeItem('aptos_account');
      }
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll create a new account
      // In production, you'd integrate with wallet adapters like Petra, Martian, etc.
      const newAccount = aptosUtils.generateAccount();
      const accountData: AptosAccountInfo = {
        address: newAccount.address().toString(),
        publicKey: newAccount.pubKey().toString(),
        privateKey: '0x' + Buffer.from(newAccount.signingKey.secretKey).toString('hex'),
      };
      
      setAccount(newAccount);
      setAccountInfo(accountData);
      setIsConnected(true);
      aptosClient.setAccount(newAccount);
      
      // Save to localStorage
      localStorage.setItem('aptos_account', JSON.stringify(accountData));
      
      return accountData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setAccountInfo(null);
    setIsConnected(false);
    aptosClient.setAccount(null);
    localStorage.removeItem('aptos_account');
  }, []);

  // Initialize player
  const initPlayer = useCallback(async () => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.initPlayer();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize player';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Submit score
  const submitScore = useCallback(async (score: number) => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.submitScore(score);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit score';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Get player score
  const getScore = useCallback(async (address?: string) => {
    const targetAddress = address || (account?.address().toString() || '');
    if (!targetAddress) return 0;

    try {
      return await aptosClient.getScore(targetAddress);
    } catch (err) {
      console.error('Failed to get score:', err);
      return 0;
    }
  }, [account]);

  // Get games played
  const getGamesPlayed = useCallback(async (address?: string) => {
    const targetAddress = address || (account?.address().toString() || '');
    if (!targetAddress) return 0;

    try {
      return await aptosClient.getGamesPlayed(targetAddress);
    } catch (err) {
      console.error('Failed to get games played:', err);
      return 0;
    }
  }, [account]);

  // Initialize token
  const initToken = useCallback(async () => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.initToken();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize token';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Mint tokens
  const mintTokens = useCallback(async (to: string, amount: number) => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.mintTokens(to, amount);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint tokens';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Send reward
  const sendReward = useCallback(async (receiver: string, amount: number) => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.sendReward(receiver, amount);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reward';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Burn tokens
  const burnTokens = useCallback(async (amount: number) => {
    if (!account || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aptosClient.burnTokens(amount);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to burn tokens';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected]);

  // Get token balance
  const getTokenBalance = useCallback(async (address?: string) => {
    const targetAddress = address || (account?.address().toString() || '');
    if (!targetAddress) return 0;

    try {
      return await aptosClient.getTokenBalance(targetAddress);
    } catch (err) {
      console.error('Failed to get token balance:', err);
      return 0;
    }
  }, [account]);

  // Get account balance (APT)
  const getAccountBalance = useCallback(async (address?: string) => {
    const targetAddress = address || (account?.address().toString() || '');
    if (!targetAddress) return 0;
    try {
      const balance = await getBalanceWithSdk(targetAddress);
      return balance ?? 0;
    } catch (err) {
      console.error('Failed to get account balance:', err);
      return 0;
    }
  }, [account]);

  // Get transaction details
  const getTransaction = useCallback(async (hash: string) => {
    try {
      return await aptosClient.getTransaction(hash);
    } catch (err) {
      console.error('Failed to get transaction:', err);
      return null;
    }
  }, []);

  // Get explorer URL
  const getExplorerUrl = useCallback((hash: string) => {
    return aptosClient.getExplorerUrl(hash, network);
  }, [network]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback((newNetwork: keyof typeof APTOS_NETWORKS) => {
    setNetwork(newNetwork);
    // Reinitialize client with new network
    // Note: In a real app, you'd need to handle network switching properly
  }, []);

  return {
    // State
    account,
    accountInfo,
    isConnected,
    isLoading,
    error,
    network,
    
    // Wallet functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    
    // Game functions
    initPlayer,
    submitScore,
    getScore,
    getGamesPlayed,
    
    // Token functions
    initToken,
    mintTokens,
    sendReward,
    burnTokens,
    getTokenBalance,
    
    // Utility functions
    getAccountBalance,
    getTransaction,
    getExplorerUrl,
    clearError,
  };
}; 