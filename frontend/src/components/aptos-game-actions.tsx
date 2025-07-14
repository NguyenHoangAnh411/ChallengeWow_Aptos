import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAptos } from '../hooks/use-aptos';
import { aptosUtils } from '../lib/aptos';
import { 
  Play, 
  Trophy, 
  Coins, 
  Send, 
  Flame, 
  UserPlus,
  Zap,
  Target
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const AptosGameActions: React.FC = () => {
  const {
    isConnected,
    isLoading,
    accountInfo,
    initPlayer,
    submitScore,
    initToken,
    mintTokens,
    sendReward,
    burnTokens,
    getExplorerUrl,
    getAccountBalance,
  } = useAptos();

  const [score, setScore] = useState<string>('100');
  const [tokenAmount, setTokenAmount] = useState<string>('1000');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [burnAmount, setBurnAmount] = useState<string>('100');

  const handleInitPlayer = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    // Check balance first
    const balance = await getAccountBalance();
    if (balance < 1000000) { // Less than 0.01 APT
      toast({
        title: "Insufficient Balance",
        description: "You need at least 0.01 APT for transaction fees. Click 'Get APT' button.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await initPlayer();
      toast({
        title: "Player Initialized",
        description: `Transaction: ${result.hash}`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to initialize player:', error);
      if (error instanceof Error && error.message.includes('INSUFFICIENT_BALANCE')) {
        toast({
          title: "Insufficient Balance",
          description: "You need more APT for transaction fees. Click 'Get APT' button.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitScore = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    const scoreValue = parseInt(score);
    if (isNaN(scoreValue) || scoreValue < 0) {
      toast({
        title: "Invalid Score",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await submitScore(scoreValue);
      toast({
        title: "Score Submitted",
        description: `Score: ${scoreValue}, Transaction: ${result.hash}`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const handleInitToken = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await initToken();
      toast({
        title: "Token Initialized",
        description: `Transaction: ${result.hash}`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to initialize token:', error);
    }
  };

  const handleMintTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    const targetAddress = recipientAddress || accountInfo?.address;
    if (!targetAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await mintTokens(targetAddress, amount);
      toast({
        title: "Tokens Minted",
        description: `${amount} tokens minted to ${targetAddress.slice(0, 8)}...${targetAddress.slice(-6)}`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to mint tokens:', error);
    }
  };

  const handleSendReward = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return;
    }

    if (!aptosUtils.isValidAddress(recipientAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Aptos address",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await sendReward(recipientAddress, amount);
      toast({
        title: "Reward Sent",
        description: `${amount} tokens sent to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to send reward:', error);
    }
  };

  const handleBurnTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Aptos wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(burnAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await burnTokens(amount);
      toast({
        title: "Tokens Burned",
        description: `${amount} tokens burned successfully`,
      });
      
      // Open explorer
      const explorerUrl = getExplorerUrl(result.hash);
      window.open(explorerUrl, '_blank');
    } catch (error) {
      console.error('Failed to burn tokens:', error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Game Actions
          </CardTitle>
          <CardDescription>
            Connect your wallet to access game actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please connect your Aptos wallet to start playing and managing tokens.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {/* Player Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Player Actions
          </CardTitle>
          <CardDescription>
            Initialize player and submit game scores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleInitPlayer} 
              disabled={isLoading}
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Initialize Player
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="score">Score to Submit</Label>
            <div className="flex gap-2">
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter score"
                min="0"
              />
              <Button 
                onClick={handleSubmitScore} 
                disabled={isLoading}
              >
                <Target className="h-4 w-4 mr-2" />
                Submit Score
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Actions
          </CardTitle>
          <CardDescription>
            Manage game tokens and rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleInitToken} 
              disabled={isLoading}
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              Initialize Token
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tokenAmount">Token Amount</Label>
            <Input
              id="tokenAmount"
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientAddress">Recipient Address (optional)</Label>
            <Input
              id="recipientAddress"
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleMintTokens} 
              disabled={isLoading}
              variant="outline"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Mint Tokens
            </Button>
            <Button 
              onClick={handleSendReward} 
              disabled={isLoading}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reward
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="burnAmount">Burn Amount</Label>
            <div className="flex gap-2">
              <Input
                id="burnAmount"
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                placeholder="Enter amount to burn"
                min="1"
              />
              <Button 
                onClick={handleBurnTokens} 
                disabled={isLoading}
                variant="destructive"
              >
                <Flame className="h-4 w-4 mr-2" />
                Burn Tokens
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 