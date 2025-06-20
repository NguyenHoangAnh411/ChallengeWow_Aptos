import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWalletModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="bg-cyber-dark border-neon-blue flex flex-col items-center justify-center">
        <DialogHeader>
          <DialogTitle className="text-neon-purple text-center">
            Wallet Not Connected
          </DialogTitle>
          <DialogDescription>
            Please connect your wallet to create or join a room.
          </DialogDescription>
        </DialogHeader>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            return (
              <button
                onClick={openConnectModal}
                disabled={!mounted}
                className="px-6 py-3 mt-4 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold shadow-lg neon-glow-blue hover:scale-105 transition-all duration-300"
              >
                {mounted && account
                  ? `Connected: ${account.displayName}`
                  : "Connect Wallet"}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </DialogContent>
    </Dialog>
  );
}
