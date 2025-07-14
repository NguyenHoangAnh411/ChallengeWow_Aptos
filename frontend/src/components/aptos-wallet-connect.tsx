import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAptos } from '../hooks/use-aptos';
import { aptosUtils } from '../lib/aptos';
import { Copy, ExternalLink, Wallet, Coins, Trophy, Gamepad2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const AptosWalletConnect: React.FC = () => {
  const {
    account,
    accountInfo,
    isConnected,
    isLoading,
    error,
    network,
    connectWallet,
    disconnectWallet,
    getScore,
    getGamesPlayed,
    getTokenBalance,
    getAccountBalance,
    getExplorerUrl,
    clearError,
  } = useAptos();

  const [score, setScore] = useState<number>(0);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [aptBalance, setAptBalance] = useState<number>(0);

  // Load account data when connected
  useEffect(() => {
    if (isConnected && accountInfo) {
      loadAccountData();
    }
  }, [isConnected, accountInfo]);

  // Load error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, clearError]);

  const loadAccountData = async () => {
    if (!accountInfo) return;

    try {
      const [scoreData, gamesData, tokenData, aptData] = await Promise.all([
        getScore(accountInfo.address),
        getGamesPlayed(accountInfo.address),
        getTokenBalance(accountInfo.address),
        getAccountBalance(accountInfo.address),
      ]);

      setScore(scoreData);
      setGamesPlayed(gamesData);
      setTokenBalance(tokenData);
      setAptBalance(aptData);
    } catch (error) {
      console.error('Failed to load account data:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      
      // Fund account with test APT
      try {
        const response = await fetch('https://faucet.devnet.aptoslabs.com/mint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: accountInfo?.address,
            amount: 100000000, // 1 APT
          }),
        });
        
        if (response.ok) {
          toast({
            title: "Account Funded",
            description: "Received 1 APT from faucet for testing!",
          });
        }
      } catch (faucetError) {
        console.log('Faucet funding failed, but wallet connected:', faucetError);
      }
      
      toast({
        title: "Wallet Connected",
        description: "Aptos wallet connected successfully!",
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setScore(0);
    setGamesPlayed(0);
    setTokenBalance(0);
    setAptBalance(0);
    toast({
      title: "Wallet Disconnected",
      description: "Aptos wallet disconnected successfully!",
    });
  };

  const copyAddress = () => {
    if (accountInfo) {
      navigator.clipboard.writeText(accountInfo.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard!",
      });
    }
  };

  const viewOnExplorer = () => {
    if (accountInfo) {
      const explorerUrl = getExplorerUrl(accountInfo.address);
      window.open(explorerUrl, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Aptos Wallet
          </CardTitle>
          <CardDescription>
            Connect your Aptos wallet to start playing ChallengeWave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will create a new demo account for testing purposes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Aptos Wallet
        </CardTitle>
        <CardDescription>
          Connected to {network} network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Address:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">
                {accountInfo?.address.slice(0, 8)}...{accountInfo?.address.slice(-6)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={viewOnExplorer}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">APT Balance</span>
            </div>
            <p className="text-lg font-bold">
              {aptosUtils.formatAPT(aptBalance)} APT
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">Game Tokens</span>
            </div>
            <p className="text-lg font-bold">
              {tokenBalance} MTK
            </p>
          </div>
        </div>

        {/* Game Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span className="text-sm font-medium">Game Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-lg font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Games Played</p>
              <p className="text-lg font-bold">{gamesPlayed}</p>
            </div>
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {network.toUpperCase()}
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (accountInfo?.address) {
                  try {
                    const response = await fetch('https://faucet.devnet.aptoslabs.com/mint', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        address: accountInfo.address,
                        amount: 100000000,
                      }),
                    });
                    if (response.ok) {
                      toast({
                        title: "Funded!",
                        description: "Received 1 APT from faucet",
                      });
                      loadAccountData();
                    }
                  } catch (error) {
                    toast({
                      title: "Funding Failed",
                      description: "Could not get test APT",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              Get APT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 