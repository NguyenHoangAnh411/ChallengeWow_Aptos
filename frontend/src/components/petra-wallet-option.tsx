"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Download, ExternalLink, CheckCircle } from "lucide-react";
import { usePetraWallet } from "@/hooks/use-petra-wallet";

interface PetraWalletOptionProps {
  onConnect?: (address: string) => void;
  className?: string;
}

export function PetraWalletOption({ onConnect, className }: PetraWalletOptionProps) {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { installed, isConnected, account, isLoading, connect, disconnect } = usePetraWallet();

  const handleConnect = async () => {
    if (!installed) {
      setShowInstallModal(true);
      return;
    }

    try {
      await connect();
      if (account && onConnect) {
        onConnect(account);
      }
    } catch (error) {
      console.error('Failed to connect Petra:', error);
    }
  };

  const installPetra = () => {
    window.open('https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinncaoajkhkmocdnaabaieajji', '_blank');
  };

  return (
    <>
      <div className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-neon-purple transition-colors ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-neon-purple to-purple-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Petra</h3>
            <p className="text-sm text-gray-400">Aptos Wallet</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isConnected && account ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-400">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              size="sm"
              className="bg-neon-purple hover:bg-purple-600 text-white"
            >
              {isLoading ? "Connecting..." : installed ? "Connect" : "Install"}
            </Button>
          )}
        </div>
      </div>

      {/* Installation Modal */}
      <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <DialogContent className="bg-cyber-dark border-neon-purple max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neon-purple text-center">
              Install Petra Wallet
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-neon-purple to-purple-500 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            
            <p className="text-gray-300">
              Petra is the official Aptos wallet. Install it to connect to Challenge Wave.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={installPetra}
                className="bg-neon-purple hover:bg-purple-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Petra Extension
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://petra.app/', '_blank')}
                className="border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Petra Website
              </Button>
            </div>
            
            <p className="text-sm text-gray-400">
              After installation, refresh the page and try connecting again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 