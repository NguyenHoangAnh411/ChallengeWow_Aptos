"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Brain,
  Gamepad2,
  BookOpen,
  Clock,
  Shield,
  Trophy,
  Box,
  ExternalLink,
  Github,
  MessageCircle,
  FileText,
  Wallet,
  XIcon,
  Network,
} from "lucide-react";
import { ethers } from "ethers";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NetworkStatusBanner } from "@/components/network-status-banner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Landing() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletId, setwalletId] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const address = accounts[0];
        setwalletId(address);
        setIsConnected(true);
      } else {
        alert("Please install Metamask or a compatible wallet extension.");
      }
    } catch (err) {
      alert("Failed to connect wallet");
    }
    setIsConnecting(false);
  };

  const handleJoinChallenge = () => {
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen cyber-grid overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 neural-network opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 hexagon bg-neon-blue opacity-10 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-20 h-20 hexagon bg-neon-purple opacity-15 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-24 h-24 hexagon bg-neon-blue opacity-10 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-neon-blue/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="cursor-pointer absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg blur opacity-50 animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Challenge Wave
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ConnectButton />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Logo Animation */}
          <motion.div
            className="mb-12 flex justify-center"
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Outer rotating ring */}
              <div
                className="absolute inset-0 w-40 h-40 rounded-full border-2 border-neon-blue opacity-30 animate-spin"
                style={{ animationDuration: "20s" }}
              ></div>
              <div
                className="absolute inset-2 w-36 h-36 rounded-full border border-neon-purple opacity-20 animate-spin"
                style={{
                  animationDuration: "15s",
                  animationDirection: "reverse",
                }}
              ></div>

              {/* Main logo */}
              <div className="w-32 h-32 bg-gradient-to-r from-neon-blue via-purple-500 to-neon-purple rounded-full p-1 animate-neon-pulse relative z-10">
                <div className="w-full h-full bg-gradient-to-br from-cyber-dark to-cyber-accent rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-neon-blue/10 to-transparent animate-pulse"></div>
                  <Brain className="w-16 h-16 text-neon-blue relative z-10 animate-float" />
                </div>
              </div>

              {/* Orbiting particles */}
              <div
                className="absolute top-0 left-1/2 w-2 h-2 bg-neon-blue rounded-full transform -translate-x-1/2 animate-spin"
                style={{ animationDuration: "8s", transformOrigin: "1px 80px" }}
              ></div>
              <div
                className="absolute top-0 left-1/2 w-1 h-1 bg-neon-purple rounded-full transform -translate-x-1/2 animate-spin"
                style={{
                  animationDuration: "12s",
                  animationDirection: "reverse",
                  transformOrigin: "0.5px 90px",
                }}
              ></div>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-orbitron font-black mb-6 bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            CHALLENGE
            <br />
            WAVE
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The ultimate GameFi DApp for real-time competitive quizzes. Prove
            your knowledge, earn rewards, and dominate the blockchain
            leaderboard.
          </motion.p>

          {/* Network Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <NetworkStatusBanner />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 z-50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={handleJoinChallenge}
              className="bg-neon-blue hover:bg-blue-500 px-8 py-4 rounded-lg text-xl font-semibold transition-all duration-300 neon-glow-blue hover:scale-105"
            >
              <Gamepad2 className="w-6 h-6 mr-2" />
              Join Challenge
            </Button>
            <Button
              variant="outline"
              className="border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white px-8 py-4 rounded-lg text-xl font-semibold transition-all duration-300"
              onClick={() => router.push("/setup-network")}
            >
              <Network className="w-6 h-6 mr-2" />
              Thiết lập mạng
            </Button>
          </motion.div>

          {/* Enhanced Stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-morphism rounded-lg p-8 hologram-border relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-orbitron font-bold text-neon-blue animate-glow-pulse">
                      1,247
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-blue-500 rounded-full flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-gray-300 font-medium">
                    Active Players
                  </div>
                  <div className="text-sm text-neon-blue mt-1">
                    +12% this week
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-morphism rounded-lg p-8 hologram-border relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-orbitron font-bold text-neon-purple animate-glow-pulse">
                      8,392
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-purple-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-gray-300 font-medium">
                    Challenges Completed
                  </div>
                  <div className="text-sm text-neon-purple mt-1">
                    +847 today
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-morphism rounded-lg p-8 hologram-border relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-orbitron font-bold text-green-400 animate-glow-pulse">
                      ₹45,231
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Box className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-gray-300 font-medium">Total Rewards</div>
                  <div className="text-sm text-green-400 mt-1">
                    Live on blockchain
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            className="cursor-pointer glass-morphism rounded-lg p-6 text-center group hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 bg-neon-blue rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Quiz</h3>
            <p className="text-gray-400">
              Lightning-fast 15-second rounds with live competition
            </p>
          </motion.div>

          <motion.div
            className="cursor-pointer glass-morphism rounded-lg p-6 text-center group hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 bg-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">zk-SNARK Proofs</h3>
            <p className="text-gray-400">
              Zero-knowledge proofs ensure fair play and privacy
            </p>
          </motion.div>

          <motion.div
            className="cursor-pointer glass-morphism rounded-lg p-6 text-center group hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p className="text-gray-400">
              Win tokens and climb the global leaderboard
            </p>
          </motion.div>

          <motion.div
            className="cursor-pointer glass-morphism rounded-lg p-6 text-center group hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
              <Box className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">OLYM3 Testnet</h3>
            <p className="text-gray-400">
              Built on cutting-edge blockchain technology
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-400">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <a
            href="#"
            className="hover:text-neon-blue transition-colors flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            OLYM3 Explorer
          </a>
          <a
            href="#"
            className="hover:text-neon-blue transition-colors flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Whitepaper
          </a>
          <a
            href="#"
            className="hover:text-neon-blue transition-colors flex items-center"
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </a>
          <a
            href="#"
            className="hover:text-neon-blue transition-colors flex items-center"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Discord
          </a>
          <a
            href="https://x.com/ChallengeAndWow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-blue transition-colors flex items-center"
          >
            <XIcon className="w-4 h-4 mr-2" />
            X (Twitter)
          </a>
        </div>
        <p>&copy; 2024 Challenge Wave. Built with blockchain transparency.</p>
      </footer>
    </div>
  );
}
