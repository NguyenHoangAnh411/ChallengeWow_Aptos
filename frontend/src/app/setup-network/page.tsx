"use client";

import { AddOlym3Network } from "@/components/add-olym3-network";
import { NetworkStatusBanner } from "@/components/network-status-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Network,
  Wallet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Info,
  Coins,
  Shield,
} from "lucide-react";
import { OLYM3_TESTNET } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function SetupNetworkPage() {
  const router = useRouter();

  const steps = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Connect MetaMask Wallet",
      description: "Make sure you have installed and connected MetaMask wallet",
      status: "required",
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Add Olym3 Testnet Network",
      description: "Add Olym3 Testnet blockchain network to MetaMask",
      status: "required",
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Get OLYM test tokens",
      description: "Get OLYM tokens from faucet to participate in the game",
      status: "optional",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Start playing the game",
      description: "Create rooms and join challenges",
      status: "ready",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-dark via-cyber-accent to-cyber-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Setup Olym3 Testnet Network
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Step-by-step guide to connect to Olym3 Testnet network and start
            participating in Challenge Wave game
          </p>
        </div>

        {/* Network Status */}
        <div className="max-w-2xl mx-auto mb-8">
          <NetworkStatusBanner />
        </div>

        {/* Setup Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-cyber-accent/50 border-neon-blue/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5" />
                Setup Guide
              </CardTitle>
              <CardDescription className="text-gray-300">
                Follow these steps to connect to Olym3 Testnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-neon-blue">{step.icon}</div>
                      <h3 className="text-lg font-semibold text-white">
                        {step.title}
                      </h3>
                      <Badge
                        variant={
                          step.status === "required"
                            ? "destructive"
                            : step.status === "optional"
                            ? "secondary"
                            : "default"
                        }
                        className="ml-auto"
                      >
                        {step.status === "required"
                          ? "Required"
                          : step.status === "optional"
                          ? "Optional"
                          : "Ready"}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-3">{step.description}</p>

                    {index === 1 && (
                      <div className="bg-cyber-dark/50 p-4 rounded-lg border border-neon-blue/20">
                        <AddOlym3Network />
                      </div>
                    )}

                    {index === 2 && (
                      <div className="bg-cyber-dark/50 p-4 rounded-lg border border-neon-blue/20">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Info className="h-4 w-4 text-neon-blue" />
                            <span>Olym3 Testnet Network Information:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Network Name:
                              </span>
                              <span className="text-white">
                                {OLYM3_TESTNET.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Chain ID:</span>
                              <span className="text-white">
                                {OLYM3_TESTNET.id}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Token:</span>
                              <span className="text-white">
                                {OLYM3_TESTNET.nativeCurrency.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">RPC URL:</span>
                              <span className="text-white text-xs">
                                {OLYM3_TESTNET.rpcUrls.default.http[0]}
                              </span>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span>
                              Faucet will be provided soon to receive OLYM test
                              tokens
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 3 && (
                      <div className="bg-cyber-dark/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-white font-medium">
                              You're ready!
                            </p>
                            <p className="text-gray-300 text-sm">
                              Create rooms and start joining challenges
                            </p>
                          </div>
                          <Button
                            onClick={() => router.push("/lobby")}
                            className="ml-auto bg-neon-blue hover:bg-blue-600"
                          >
                            Go to Lobby
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Additional Resources */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-cyber-accent/30 border-neon-purple/20">
            <CardHeader>
              <CardTitle className="text-white">Reference Materials</CardTitle>
              <CardDescription className="text-gray-300">
                Learn more about Olym3 Testnet and Challenge Wave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <a
                    href="https://explorer.olym3.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Olym3 Explorer
                  </a>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <a
                    href="https://docs.olym3.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Olym3 Documentation
                  </a>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <a
                    href="https://faucet.olym3.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Olym3 Faucet
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/")}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
