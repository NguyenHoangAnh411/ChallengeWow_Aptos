'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ChallengeRoom({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { roomId } = params;
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
                  isPaused={hasAnswered}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-orbitron font-bold text-white">
                    {hasAnswered ? 'Waiting' : 'Go!'}
                  </span>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <Badge variant="secondary" className="bg-neon-blue/20 text-neon-blue border-neon-blue/50 mb-2 font-semibold">Question {questionNumber}</Badge>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-100 leading-tight">
                            {currentQuestion.content}
                          </h2>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-neon-blue transition-all">
                          <ExternalLink className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {currentQuestion.options.map((option, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="outline"
                              className={`
                                w-full h-auto text-left justify-start p-6 text-lg rounded-lg transition-all duration-300 
                                border-2 
                                ${selectedAnswer === option 
                                  ? 'bg-neon-purple/80 border-neon-purple text-white shadow-neon-glow-md' 
                                  : 'bg-cyber-darker/80 border-gray-700 hover:border-neon-purple/70 text-gray-300 hover:bg-cyber-darker'
                                }
                                ${hasAnswered ? 'cursor-not-allowed' : ''}
                              `}
                              onClick={() => handleAnswerSelect(option)}
                              disabled={hasAnswered}
                            >
                              <span className="font-bold mr-4 text-neon-purple">{String.fromCharCode(65 + index)}.</span>
                              <span>{option}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Players List */}
          <aside className="lg:col-span-1">
            <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-orbitron font-bold text-neon-purple mb-6 text-center">Players</h3>
                <div className="space-y-4">
                  {sortedPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player as User} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
} 