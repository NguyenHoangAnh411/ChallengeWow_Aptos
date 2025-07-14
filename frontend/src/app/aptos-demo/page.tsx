'use client';

import React from 'react';
import { AptosWalletConnect } from '../../components/aptos-wallet-connect';
import { AptosGameActions } from '../../components/aptos-game-actions';
import { AptosAdminPanel } from '../../components/aptos-admin-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { APTOS_CONTRACT_CONFIG } from '../../lib/aptos';
import { ExternalLink, Code, Zap } from 'lucide-react';

export default function AptosDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            ChallengeWave Aptos Integration
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Test your deployed Move contract with this interactive demo
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-sm">
              Contract: {APTOS_CONTRACT_CONFIG.GAME_MODULE.slice(0, 20)}...
            </Badge>
            <a
              href={`https://explorer.aptoslabs.com/account/${APTOS_CONTRACT_CONFIG.GAME_MODULE.split('::')[0]}?network=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </div>
        </div>

        {/* Contract Info */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Code className="h-5 w-5" />
              Contract Information
            </CardTitle>
            <CardDescription className="text-gray-300">
              Details about your deployed Move contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Contract Address</h4>
                <p className="text-sm text-gray-300 font-mono break-all">
                  {APTOS_CONTRACT_CONFIG.GAME_MODULE.split('::')[0]}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Module Name</h4>
                <p className="text-sm text-gray-300 font-mono">
                  {APTOS_CONTRACT_CONFIG.GAME_MODULE.split('::')[1]}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">Available Functions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Badge variant="outline" className="text-xs">init_player</Badge>
                <Badge variant="outline" className="text-xs">submit_score</Badge>
                <Badge variant="outline" className="text-xs">get_score</Badge>
                <Badge variant="outline" className="text-xs">get_games_played</Badge>
                <Badge variant="outline" className="text-xs">init_caps</Badge>
                <Badge variant="outline" className="text-xs">mint_tokens</Badge>
                <Badge variant="outline" className="text-xs">send_reward</Badge>
                <Badge variant="outline" className="text-xs">burn_tokens</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Connect */}
          <div>
            <AptosWalletConnect />
          </div>

          {/* Game Actions */}
          <div>
            <AptosGameActions />
          </div>
        </div>

        {/* Admin Panel */}
        <div>
          <AptosAdminPanel />
        </div>

        {/* Instructions */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5" />
              How to Test
            </CardTitle>
            <CardDescription className="text-gray-300">
              Step-by-step guide to test your Aptos contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">1. Connect Wallet</h4>
                <p className="text-sm text-gray-300">
                  Click "Connect Wallet" to create a demo account. This will generate a new Aptos account for testing.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">2. Initialize Player</h4>
                <p className="text-sm text-gray-300">
                  Click "Initialize Player" to create player data on the blockchain. This is required before submitting scores.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">3. Submit Score</h4>
                <p className="text-sm text-gray-300">
                  Enter a score and click "Submit Score" to update your player's score and games played count.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">4. Initialize Token</h4>
                <p className="text-sm text-gray-300">
                  Click "Initialize Token" to set up token capabilities. This allows you to mint and manage game tokens.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">5. Mint Tokens</h4>
                <p className="text-sm text-gray-300">
                  Enter an amount and optionally a recipient address, then click "Mint Tokens" to create new tokens.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">6. Send Rewards</h4>
                <p className="text-sm text-gray-300">
                  Enter a recipient address and amount, then click "Send Reward" to transfer tokens to another address.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">7. Burn Tokens</h4>
                <p className="text-sm text-gray-300">
                  Enter an amount and click "Burn Tokens" to permanently remove tokens from your account.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-2">Important Notes</h4>
              <ul className="text-sm text-yellow-200 space-y-1">
                <li>• This demo uses Aptos Devnet - transactions are free but not permanent</li>
                <li>• Demo accounts are stored in localStorage - clear browser data to reset</li>
                <li>• All transactions will open in the Aptos Explorer for verification</li>
                <li>• In production, integrate with real wallets like Petra, Martian, etc.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>
            ChallengeWave Aptos Integration Demo | 
            <a 
              href="https://aptos.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              Learn more about Aptos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 