// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Crown,
//   RotateCcw,
//   Home,
//   Trophy,
//   ExternalLink,
//   Box,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import PlayerCard from "@/components/player-card";
// import { useGameState } from "@/lib/game-state";
// import type { User } from "@/types/schema";

// interface GameResult extends User {
//   finalScore: number;
//   correctAnswers: number;
//   totalQuestions: number;
//   avgTime: number;
//   reward: number;
// }

// export default function Results() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const gameId = searchParams.get("gameId");
//   const { currentUser } = useGameState();
//   const [winner, setWinner] = useState<GameResult | null>(null);
//   const [finalResults, setFinalResults] = useState<GameResult[]>([]);
//   const [blockchainInfo, setBlockchainInfo] = useState({
//     blockHash: "0x7a8f...c2d9",
//     zkProofVerified: true,
//     network: "OLYM3 Testnet",
//   });

//   useEffect(() => {
//     // Mock results data
//     const mockResults: GameResult[] = [
//       {
//         id: 2,
//         username: "CyberNinja",
//         walletId: "0xABCD...1234",
//         totalScore: 920,
//         gamesWon: 34,
//         rank: 45,
//         finalScore: 920,
//         correctAnswers: 8,
//         totalQuestions: 10,
//         avgTime: 2.8,
//         reward: 200,
//       },
//       {
//         id: 1,
//         username: "Player_7834",
//         walletId: "0x1234...5678",
//         totalScore: 850,
//         gamesWon: 23,
//         rank: 142,
//         finalScore: 850,
//         correctAnswers: 7,
//         totalQuestions: 10,
//         avgTime: 3.2,
//         reward: 75,
//       },
//       {
//         id: 3,
//         username: "QuizMaster",
//         walletId: "0x9876...4321",
//         totalScore: 780,
//         gamesWon: 19,
//         rank: 89,
//         finalScore: 780,
//         correctAnswers: 6,
//         totalQuestions: 10,
//         avgTime: 4.1,
//         reward: 50,
//       },
//       {
//         id: 4,
//         username: "TechGuru",
//         walletId: "0x5555...7777",
//         totalScore: 650,
//         gamesWon: 12,
//         rank: 203,
//         finalScore: 650,
//         correctAnswers: 5,
//         totalQuestions: 10,
//         avgTime: 6.5,
//         reward: 25,
//       },
//     ];

//     setFinalResults(mockResults);
//     setWinner(mockResults[0]);
//   }, [gameId]);

//   const handlePlayAgain = () => {
//     router.push("/lobby");
//   };

//   const handleBackToLobby = () => {
//     router.push("/lobby");
//   };

//   const handleViewLeaderboard = () => {
//     router.push("/leaderboard");
//   };

//   const handleViewOnExplorer = () => {
//     // Mock blockchain explorer link
//     window.open(
//       `https://explorer.olym3.io/tx/${blockchainInfo.blockHash}`,
//       "_blank"
//     );
//   };

//   return (
//     <div className="min-h-screen bg-cyber-dark">
//       {/* Header */}
//       <header className="bg-cyber-darker border-b border-gray-800 px-4 py-4">
//         <div className="container mx-auto text-center">
//           <h1 className="text-3xl font-orbitron font-bold text-neon-blue">
//             Challenge Complete!
//           </h1>
//           <p className="text-gray-400 mt-2">Room #1847 - Final Results</p>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-8">
//         {/* Winner Celebration */}
//         {winner && (
//           <motion.div
//             className="text-center mb-12"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.8, ease: "easeOut" }}
//           >
//             <div className="animate-winner-glow inline-block p-8 rounded-2xl glass-morphism">
//               <motion.div
//                 className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
//                 animate={{ rotate: [0, 10, -10, 0] }}
//                 transition={{
//                   duration: 2,
//                   repeat: Infinity,
//                   ease: "easeInOut",
//                 }}
//               >
//                 <Crown className="w-12 h-12 text-white" />
//               </motion.div>
//               <h2 className="text-4xl font-orbitron font-bold text-yellow-400 mb-2">
//                 {winner.username}
//               </h2>
//               <p className="text-xl text-gray-300 mb-4">🏆 Challenge Winner!</p>
//               <div className="flex justify-center items-center space-x-8 mt-4">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-neon-blue">
//                     {winner.finalScore}
//                   </div>
//                   <div className="text-sm text-gray-400">Final Score</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-green-400">
//                     +{winner.reward}
//                   </div>
//                   <div className="text-sm text-gray-400">Tokens Won</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-neon-purple">
//                     {winner.avgTime}s
//                   </div>
//                   <div className="text-sm text-gray-400">Avg. Time</div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Leaderboard */}
//         <div className="max-w-4xl mx-auto">
//           <h3 className="text-2xl font-orbitron font-bold text-center mb-8">
//             Final Leaderboard
//           </h3>

//           <motion.div
//             className="space-y-4"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.6, delay: 0.3 }}
//           >
//             {finalResults.map((player, index) => (
//               <motion.div
//                 key={player.id}
//                 initial={{ opacity: 0, x: -50 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: index * 0.1 }}
//               >
//                 <Card
//                   className={`glass-morphism rounded-lg p-6 hover:scale-105 transition-all duration-300 ${
//                     index === 0 ? "border-2 border-yellow-400" : ""
//                   }`}
//                 >
//                   <CardContent className="p-0">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-4">
//                         <div className="text-3xl">
//                           {index === 0
//                             ? "🥇"
//                             : index === 1
//                             ? "🥈"
//                             : index === 2
//                             ? "🥉"
//                             : `${index + 1}️⃣`}
//                         </div>
//                         <div
//                           className={`w-12 h-12 bg-gradient-to-r ${
//                             index === 0
//                               ? "from-yellow-400 to-orange-500"
//                               : index === 1
//                               ? "from-gray-400 to-gray-600"
//                               : index === 2
//                               ? "from-orange-400 to-orange-600"
//                               : "from-neon-blue to-neon-purple"
//                           } rounded-full flex items-center justify-center`}
//                         >
//                           <span className="font-bold text-white">
//                             {player.username.substring(0, 2).toUpperCase()}
//                           </span>
//                         </div>
//                         <div>
//                           <div
//                             className={`text-xl font-semibold ${
//                               player.id === currentUser?.id
//                                 ? "text-neon-purple"
//                                 : ""
//                             }`}
//                           >
//                             {player.username}
//                             {player.id === currentUser?.id ? " (You)" : ""}
//                           </div>
//                           <div className="text-sm text-gray-400">
//                             {player.walletId}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold text-neon-blue">
//                           {player.finalScore}
//                         </div>
//                         <div className="text-sm text-gray-400">
//                           <span>
//                             {player.correctAnswers}/{player.totalQuestions}
//                           </span>{" "}
//                           correct •
//                           <span className="ml-1">{player.avgTime}s</span> avg
//                         </div>
//                         <div className="text-sm text-green-400">
//                           +{player.reward} tokens
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>

//         {/* Blockchain Information */}
//         <motion.div
//           className="max-w-2xl mx-auto mt-12"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.8 }}
//         >
//           <Card className="glass-morphism rounded-lg p-6">
//             <CardContent className="p-0">
//               <h4 className="text-xl font-semibold mb-4 text-neon-purple flex items-center">
//                 <Box className="w-5 h-5 mr-2" />
//                 Blockchain Proof
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-400">Challenge Block Hash:</span>
//                   <span className="font-mono text-sm text-neon-blue">
//                     {blockchainInfo.blockHash}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-400">zk-SNARK Proof:</span>
//                   <span className="text-green-400">✓ Verified</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-400">Network:</span>
//                   <span className="text-neon-blue">
//                     {blockchainInfo.network}
//                   </span>
//                 </div>
//                 <div className="flex justify-center mt-4">
//                   <Button
//                     onClick={handleViewOnExplorer}
//                     className="bg-neon-purple hover:bg-purple-600 px-6 py-2 rounded-lg font-medium transition-all duration-300"
//                   >
//                     <ExternalLink className="w-4 h-4 mr-2" />
//                     View on Explorer
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Action Buttons */}
//         <motion.div
//           className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 1 }}
//         >
//           <Button
//             onClick={handlePlayAgain}
//             className="bg-neon-blue hover:bg-blue-500 px-8 py-3 rounded-lg font-semibold transition-all duration-300 neon-glow-blue hover:scale-105"
//           >
//             <RotateCcw className="w-5 h-5 mr-2" />
//             Play Again
//           </Button>
//           <Button
//             onClick={handleBackToLobby}
//             variant="outline"
//             className="border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
//           >
//             <Home className="w-5 h-5 mr-2" />
//             Back to Lobby
//           </Button>
//           <Button
//             onClick={handleViewLeaderboard}
//             variant="outline"
//             className="border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
//           >
//             <Trophy className="w-5 h-5 mr-2" />
//             Global Leaderboard
//           </Button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
