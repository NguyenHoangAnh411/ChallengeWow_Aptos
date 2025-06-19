 'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimerCircle from "@/components/timer-circle";
import PlayerCard from "@/components/player-card";
import { useGameState } from "@/lib/game-state";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { Question, User } from "@/types/schema";

export default function ChallengeRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const { toast } = useToast();
  const { currentUser, currentRoom, setCurrentRoom, players, setPlayers, updatePlayerStatus } = useGameState();
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [roomTimeRemaining, setRoomTimeRemaining] = useState("2:45");
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, active, completed

  // Mock data for demo
  useEffect(() => {
    if (!currentRoom && roomId) {
      setCurrentRoom({
        id: parseInt(roomId as string),
        roomCode: "1847",
        hostId: 1,
        status: "active",
        maxPlayers: 4,
        currentPlayers: 4,
        prize: 150,
        duration: 180,
        createdAt: new Date()
      });
    }

    if (players.length === 0) {
      setPlayers([
        {
          id: 1,
          username: "Player_7834",
          walletAddress: "0x1234...5678",
          totalScore: 850,
          gamesWon: 23,
          rank: 142,
          createdAt: new Date(),
          status: "answered",
          responseTime: 2.3
        },
        {
          id: 2,
          username: "CyberNinja",
          walletAddress: "0xABCD...1234",
          totalScore: 920,
          gamesWon: 34,
          rank: 45,
          createdAt: new Date(),
          status: "thinking",
          responseTime: -1
        },
        {
          id: 3,
          username: "QuizMaster",
          walletAddress: "0x9876...4321",
          totalScore: 780,
          gamesWon: 19,
          rank: 89,
          createdAt: new Date(),
          status: "answered",
          responseTime: 4.1
        },
        {
          id: 4,
          username: "TechGuru",
          walletAddress: "0x5555...7777",
          totalScore: 650,
          gamesWon: 12,
          rank: 203,
          createdAt: new Date(),
          status: "timeout",
          responseTime: 15
        }
      ]);
    }

    // Set current question
    if (!currentQuestion) {
      setCurrentQuestion({
        id: "1",
        content: "Which programming language is known as the 'mother of all languages'?",
        options: ["Assembly Language", "C Programming", "FORTRAN", "COBOL"],
        correctOptionIndex: 1,
        createdAt: new Date().toISOString()
      });
    }
  }, [roomId, currentRoom, setCurrentRoom, players, setPlayers, currentQuestion]);

  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'player_answered':
          updatePlayerStatus(data.playerId, 'answered', data.responseTime);
          break;
        case 'next_question':
          setCurrentQuestion(data.question);
          setQuestionNumber(prev => prev + 1);
          setSelectedAnswer(null);
          setHasAnswered(false);
          break;
        case 'game_ended':
          router.push(`/results/${data.gameId}`);
          break;
      }
    }
  });

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    // Send answer to server
    sendMessage({
      type: 'submit_answer',
      roomId: currentRoom?.id,
      playerId: currentUser?.id,
      answer,
      responseTime: 15 - Math.floor(Math.random() * 10) // Mock response time
    });

    toast({
      title: "Answer Submitted",
      description: "Your answer has been recorded!",
    });
  };

  const handleTimeUp = () => {
    if (!hasAnswered) {
      toast({
        title: "Time's Up!",
        description: "Moving to next question...",
        variant: "destructive",
      });
      
      // Simulate moving to results after timeout
      setTimeout(() => {
        router.push(`/results/1`);
      }, 2000);
    }
  };

  const handleLeaveRoom = () => {
    sendMessage({
      type: 'leave_room',
      roomId: currentRoom?.id,
      playerId: currentUser?.id
    });
    router.push("/lobby");
  };

  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid-fast relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 neural-network opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-neon-blue/5 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-neon-purple/5 to-transparent rounded-full blur-3xl"></div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 hexagon bg-neon-blue/20 animate-float"></div>
      <div className="absolute top-60 right-16 w-12 h-12 hexagon bg-neon-purple/20 animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-40 left-1/4 w-20 h-20 hexagon bg-neon-blue/15 animate-float" style={{animationDelay: '4s'}}></div>

      {/* Enhanced Header */}
      <header className="relative z-10 bg-cyber-darker/90 backdrop-blur-xl border-b border-neon-blue/30 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 p-2 rounded-lg glass-morphism"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-orbitron font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  Room #{currentRoom?.roomCode}
                </h1>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Enhanced Room Timer */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <Clock className="w-5 h-5 text-neon-purple" />
                <span className="font-orbitron text-lg font-bold text-neon-purple">{roomTimeRemaining}</span>
              </div>
              
              {/* Enhanced Question Counter */}
              <div className="flex items-center space-x-2 px-4 py-2 glass-morphism rounded-lg">
                <HelpCircle className="w-5 h-5 text-neon-blue" />
                <span className="font-orbitron font-bold text-neon-blue">{questionNumber}/10</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {/* Enhanced Question Timer */}
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <TimerCircle
                  duration={15}
                  onTimeUp={handleTimeUp}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-full blur-xl animate-pulse"></div>
              </div>
            </motion.div>

            {/* Enhanced Question Card */}
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50, rotateY: -15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -50, rotateY: 15 }}
                  transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                >
                  <Card className="glass-morphism rounded-lg p-8 mb-8 hologram-border relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 animate-pulse"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-neon-blue/10 to-transparent rounded-full blur-2xl"></div>
                    
                    <CardContent className="p-0 relative z-10">
                      <motion.h2 
                        className="text-2xl md:text-4xl font-semibold mb-8 text-center leading-relaxed bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        {currentQuestion.content}
                      </motion.h2>

                      {/* Enhanced Answer Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentQuestion.options.map((option, index) => {
                          const letter = String.fromCharCode(65 + index); // A, B, C, D
                          const isSelected = selectedAnswer === option;
                          
                          return (
                            <motion.button
                              key={index}
                              onClick={() => handleAnswerSelect(option)}
                              disabled={hasAnswered}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.1 * index }}
                              className={`
                                relative p-6 rounded-lg text-left transition-all duration-300 group overflow-hidden
                                ${isSelected 
                                  ? "bg-gradient-to-r from-neon-blue/20 to-blue-500/20 border-2 border-neon-blue neon-glow-blue" 
                                  : "glass-morphism border-2 border-transparent hover:border-neon-blue/50 hover:bg-cyber-accent/20"
                                }
                                ${hasAnswered ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                              `}
                              whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center font-bold
                                  ${isSelected ? "bg-neon-blue text-white" : "bg-neon-blue text-white"}
                                `}>
                                  {letter}
                                </div>
                                <span className="text-lg">{option}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Blockchain Status */}
            <Card className="glass-morphism rounded-lg p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">Blockchain Status:</span>
                    <span className="text-sm text-green-400">zk-SNARK Proof Generated</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neon-blue hover:text-blue-400 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Proof
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-morphism rounded-lg p-6">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 text-neon-purple">Players</h3>
                <div className="space-y-4">
                  {players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={{
                        ...player,
                        isCurrentUser: player.id === currentUser?.id
                      }}
                    />
                  ))}
                </div>

                {/* Current Standings */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Current Standings</h4>
                  <div className="space-y-2">
                    {sortedPlayers.slice(0, 3).map((player, index) => {
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div key={player.id} className="flex justify-between text-sm">
                          <span className={`${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : "text-orange-400"}`}>
                            {medals[index]} {player.username}
                          </span>
                          <span className="font-semibold">{player.totalScore}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
