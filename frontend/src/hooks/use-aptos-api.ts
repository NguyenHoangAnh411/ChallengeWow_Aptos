import { useState, useCallback } from 'react';
import { aptosApi } from '../lib/api';

export interface AptosAccountData {
  address: string;
  balance: number;
  balance_apt: number;
  token_balance: number;
  score: number;
  games_played: number;
  explorer_url: string;
}

export interface AptosNetworkInfo {
  network: string;
  base_url: string;
  explorer_url: string;
  game_module_address: string;
}

export const useAptosApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNetworkInfo = useCallback(async (): Promise<AptosNetworkInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getNetworkInfo();
      if (response.success) {
        return response.data;
      } else {
        setError('Failed to get network info');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountBalance = useCallback(async (address: string): Promise<number | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getAccountBalance(address);
      if (response.success && response.data.success) {
        return response.data.balance;
      } else {
        setError(response.data?.error || 'Failed to get account balance');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTokenBalance = useCallback(async (address: string): Promise<number | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getTokenBalance(address);
      if (response.success && response.data.success) {
        return response.data.balance;
      } else {
        setError(response.data?.error || 'Failed to get token balance');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlayerData = useCallback(async (address: string): Promise<{ score: number; games_played: number } | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getPlayerData(address);
      if (response.success && response.data.success) {
        return {
          score: response.data.score,
          games_played: response.data.games_played
        };
      } else {
        setError(response.data?.error || 'Failed to get player data');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fundAccount = useCallback(async (address: string, amount?: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.fundAccount(address, amount);
      if (response.success && response.data.success) {
        return true;
      } else {
        setError(response.data?.error || 'Failed to fund account');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountSummary = useCallback(async (address: string): Promise<AptosAccountData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getAccountSummary(address);
      if (response.success) {
        const data = response.data;
        return {
          address: data.address,
          balance: data.balance.success ? data.balance.balance : 0,
          balance_apt: data.balance.success ? data.balance.balance_apt : 0,
          token_balance: data.token_balance.success ? data.token_balance.balance : 0,
          score: data.player_data.success ? data.player_data.score : 0,
          games_played: data.player_data.success ? data.player_data.games_played : 0,
          explorer_url: data.explorer_url
        };
      } else {
        setError('Failed to get account summary');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransaction = useCallback(async (hash: string): Promise<any | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.getTransaction(hash);
      if (response.success && response.data.success) {
        return response.data.transaction;
      } else {
        setError(response.data?.error || 'Failed to get transaction');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAddress = useCallback(async (address: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await aptosApi.validateAddress(address);
      if (response.success && response.data.valid) {
        return true;
      } else {
        setError(response.data?.error || 'Invalid address format');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    getNetworkInfo,
    getAccountBalance,
    getTokenBalance,
    getPlayerData,
    fundAccount,
    getAccountSummary,
    getTransaction,
    validateAddress
  };
}; 