"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PetraWalletOption } from "@/components/petra-wallet-option";

interface CustomConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function CustomConnectModal({ 
  open, 
  onOpenChange, 
  title = "Connect Wallet",
  description = "Choose your wallet to connect to Challenge Wave"
}: CustomConnectModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handlePetraConnect = (address: string) => {
    setSelectedWallet('petra');
    // You can add additional logic here, like updating global state
    console.log('Petra connected:', address);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-dark border-neon-blue max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neon-blue text-center">
            {title}
          </DialogTitle>
          <p className="text-gray-400 text-center text-sm">
            {description}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* EVM Wallets Section */}
          <div>
            <h3 className="text-white font-semibold mb-3">EVM Wallets</h3>
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                return (
                  <div className="space-y-2">
                    <Button
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="w-full bg-neon-blue hover:bg-blue-600 text-white"
                    >
                      {mounted && account
                        ? `Connected: ${account.displayName}`
                        : "Connect EVM Wallet"}
                    </Button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <Separator className="bg-gray-700" />

          {/* Aptos Wallets Section */}
          <div>
            <h3 className="text-white font-semibold mb-3">Aptos Wallets</h3>
            <PetraWalletOption 
              onConnect={handlePetraConnect}
              className="w-full"
            />
          </div>

          {/* Additional wallet options can be added here */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Don't have a wallet?{" "}
              <a 
                href="https://ethereum.org/en/wallets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neon-blue hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 