import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { ConnectButtonWithPetra } from "@/components/connect-button-with-petra";

interface HeaderProps {
  showToFeed?: boolean;
  showToLanding?: boolean;
  showConnectButton?: boolean;
}

export default function Header({ showToFeed, showToLanding, showConnectButton }: HeaderProps) {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-neon-blue/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/landing" className="relative flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="cursor-pointer absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg blur opacity-50 animate-pulse"></div>
              <h1 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent ml-12">
                Challenge Wave
              </h1>
            </Link>
            {showToFeed && (
              <Button variant="ghost" onClick={() => router.push("/feed")}>Feed</Button>
            )}
            {showToLanding && (
              <Button variant="ghost" onClick={() => router.push("/landing")}>Home</Button>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {showConnectButton && <ConnectButtonWithPetra />}
          </motion.div>
        </div>
      </div>
    </nav>
  );
} 