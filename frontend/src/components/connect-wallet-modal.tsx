import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectButtonWithPetra } from "@/components/connect-button-with-petra";

export default function ConnectWalletModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="bg-cyber-dark border-neon-blue flex flex-col items-center justify-center z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-neon-purple text-center">
            Wallet Not Connected
          </DialogTitle>
          <DialogDescription>
            Please connect your wallet to create or join a room.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <ConnectButtonWithPetra />
        </div>
      </DialogContent>
    </Dialog>
  );
}