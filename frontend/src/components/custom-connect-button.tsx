"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Download, ExternalLink } from "lucide-react";
import { usePetraWallet } from "@/hooks/use-petra-wallet";

interface CustomConnectButtonProps {
  className?: string;
}

export function CustomConnectButton({ className }: CustomConnectButtonProps) {
  const [showPetraModal, setShowPetraModal] = useState(false);
  const { installed, isConnected, account, isLoading, connect, disconnect } = usePetraWallet();

  const handlePetraConnect = async () => {
    if (!installed) {
      setShowPetraModal(true);
      return;
    }

    await connect();
    setShowPetraModal(false);
  };

  const handlePetraDisconnect = async () => {
    await disconnect();
  };

  const installPetra = () => {
    window.open('https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinncaoajkhkmocdnaabaieajji', '_blank');
  };

  return (
    <>
      <div className="flex gap-2">
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            return (
              <Button
                onClick={openConnectModal}
                disabled={!mounted}
                className={className}
              >
                {mounted && account
                  ? `Connected: ${account.displayName}`
                  : "Connect Wallet"}
              </Button>
            );
          }}
        </ConnectButton.Custom>

        {/* Petra Button */}
        <Button
          onClick={handlePetraConnect}
          disabled={isLoading}
          variant="outline"
          className={`${className} border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white`}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnected && account
            ? `Petra: ${account.slice(0, 6)}...${account.slice(-4)}`
            : isLoading 
              ? "Connecting..." 
              : "Petra"
          }
        </Button>

        {isConnected && account && (
          <Button
            onClick={handlePetraDisconnect}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
          >
            Disconnect
          </Button>
        )}
      </div>

      {/* Petra Installation Modal */}
      <Dialog open={showPetraModal} onOpenChange={setShowPetraModal}>
        <DialogContent className="bg-cyber-dark border-neon-purple">
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