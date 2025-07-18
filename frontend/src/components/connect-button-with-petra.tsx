"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Download, ExternalLink, Coins, ChevronDown, CheckCircle, X } from "lucide-react";
import { usePetraWallet } from "@/hooks/use-petra-wallet";
import { useAptosBalanceApi } from "@/hooks/use-aptos-balance-api";
import { useGameState } from "@/lib/game-state";
import { updateUser, loginUser } from "@/lib/api";

interface ConnectButtonWithPetraProps {
  className?: string;
}

export function ConnectButtonWithPetra({ className }: ConnectButtonWithPetraProps) {
  const [showPetraModal, setShowPetraModal] = useState(false);
  const { installed, isConnected, isLoading, connect, disconnect, autoConnect } = usePetraWallet();
  const { currentUser, setCurrentUser } = useGameState();
  const { balance, loading: loadingBalance } = useAptosBalanceApi(isConnected ? currentUser?.walletId : undefined);


  // Debug logging
  useEffect(() => {
    console.log('ConnectButtonWithPetra - currentUser:', currentUser);
    console.log('ConnectButtonWithPetra - isConnected:', isConnected);
    console.log('ConnectButtonWithPetra - walletId:', currentUser?.walletId);
  }, [currentUser, isConnected]);

  useEffect(() => {
    const autoConnectPetra = async () => {
      if (currentUser?.walletId && installed && !isConnected && !isLoading) {
        try {
          await autoConnect(currentUser.walletId);
        } catch (error) {
          console.error('Failed to auto-connect Petra:', error);
        }
      }
    };

    autoConnectPetra();
  }, [currentUser?.walletId, installed, isConnected, isLoading, autoConnect]);

  // useEffect(() => {
  //   const saveAptosWallet = async () => {
  //     if (currentUser?.walletId && account && isConnected) {
  //       try {
  //         const result = await updateUser(account, undefined);

  //         const updatedUser = await loginUser(currentUser.walletId);
  //         setCurrentUser(updatedUser);
  //       } catch (error) {
  //         console.error('Failed to auto-save aptos_wallet:', error);
  //       }
  //     }
  //   };

  //   saveAptosWallet();
  // }, [currentUser?.walletId, account, isConnected, setCurrentUser]);

  const handlePetraConnect = async () => {
    if (!installed) {
      setShowPetraModal(true);
      return;
    }

    try {
      await connect();
      
      // Save aptos_wallet to database if user is logged in
      // if (currentUser?.walletId) {
      //   try {
      //     const result = await updateUser(currentUser.walletId, undefined);
      //     const updatedUser = await loginUser(currentUser.walletId);
      //     setCurrentUser(updatedUser);
      //   } catch (error) {
      //     console.error('Failed to save aptos_wallet to database:', error);
      //   }
      // } else {
      //   console.log('Cannot save aptos_wallet - missing walletId or account:', {
      //     walletId: currentUser?.walletId,
      //     // account,
      //     currentUser
      //   });
      // }
      
      setShowPetraModal(false);
    } catch (error) {
      console.error('Failed to connect Petra:', error);
    }
  };

  const handlePetraDisconnect = async () => {
    await disconnect();
  };

  const installPetra = () => {
    window.open('https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinncaoajkhkmocdnaabaieajji', '_blank');
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Original RainbowKit ConnectButton */}
        {/* <ConnectButton /> */}

        {/* Aptos Wallet Button */}
        {isConnected ? (
          <div className="flex items-center gap-2">
            {/* Aptos Balance Display */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 group">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">Aptos Balance</span>
                <span className="text-sm font-semibold text-white">
                  {loadingBalance ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    `${balance ?? "0"} APT`
                  )}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* Disconnect Button */}
            <Button
              onClick={handlePetraDisconnect}
              variant="ghost"
              size="sm"
              className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handlePetraConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span>
                {isLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connecting...
                  </div>
                ) : (
                  "Connect Aptos"
                )}
              </span>
              <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </Button>
        )}
      </div>

      {/* Petra Installation Modal */}
      <Dialog open={showPetraModal} onOpenChange={setShowPetraModal}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl max-w-md">
          <DialogHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Install Petra Wallet
            </DialogTitle>
            <p className="text-gray-400 mt-2">
              The official Aptos wallet for seamless blockchain interactions
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Why Petra?
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Official Aptos wallet</li>
                <li>• Secure and user-friendly</li>
                <li>• Cross-platform support</li>
                <li>• Built-in DApp browser</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={installPetra}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Petra Extension
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://petra.app/', '_blank')}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 font-medium py-3 rounded-xl transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Official Website
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                After installation, refresh the page and try connecting again.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 