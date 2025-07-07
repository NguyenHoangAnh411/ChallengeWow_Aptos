import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UsernameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (username: string) => void;
}

export default function UsernameModal({ open, onOpenChange, onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isValid = username.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    await onSubmit(username.trim());
    setIsSaving(false);
    setUsername("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full bg-cyber-darker border-neon-blue/40 rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-neon-blue mb-2">Set your username</h2>
        <p className="text-gray-400 mb-4">Please enter a username to continue.</p>
        <input
          className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white w-full mb-4"
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={isSaving}
        />
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="w-full bg-neon-blue hover:bg-blue-600 text-white font-bold py-2 rounded-lg"
        >
          {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div> : "Save"}
        </Button>
      </DialogContent>
    </Dialog>
  );
} 