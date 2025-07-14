import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ban,
  CheckCircle,
  Circle,
  Crown,
  Loader,
  MessageCircle,
  Mic,
  MicOff,
  Play,
  Share2,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import EnhancedGameSettings from "../room-game-settings";
import GameSettingsView from "../room-settings-view";
import { Input } from "../ui/input";
import { useGameState } from "@/lib/game-state";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { updateGameSettings } from "@/lib/api";
import { Dispatch, SetStateAction, useState } from "react";
import { KICK_PLAYER_TYPE } from "@/lib/constants";
import type { ChatMessage } from "@/types/chat-message";

interface GameWaitingProps {
  roomId: string;
  isRefreshingPlayers: boolean;
  chatMessages: ChatMessage[];
  setIsRefreshingPlayers: Dispatch<SetStateAction<boolean>>;
  handleToggleReady: () => void;
  handleStartGame: () => void;
  sendMessage: (message: any) => void;
  handleSendMessage: (message: string) => void;
}

export const GameWaiting = ({
  roomId,
  chatMessages,
  isRefreshingPlayers,
  setIsRefreshingPlayers,
  handleToggleReady,
  handleSendMessage,
  handleStartGame,
  sendMessage,
}: GameWaitingProps) => {
  const {
    currentUser,
    players,
    currentPlayer,
    currentRoom,
    gameStatus,
    gameSettings,
    setGameSettings,
    readyCount,
  } = useGameState();

  const [kickConfirmation, setKickConfirmation] = useState<{
    show: boolean;
    playerId: string;
    playerName: string;
  }>({ show: false, playerId: "", playerName: "" });
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const readyPercentage =
    players.length > 0 ? (readyCount / players.length) * 100 : 0;

  // Handle kick player
  const handleKickPlayer = (walletId: string, playerName: string) => {
    setKickConfirmation({ show: true, playerId: walletId, playerName });
  };

  const confirmKickPlayer = () => {
    if (kickConfirmation.playerId) {
      sendMessage({
        type: KICK_PLAYER_TYPE,
        payload: {
          wallet_id: kickConfirmation.playerId,
          room_id: roomId,
        },
      });
    }

    setKickConfirmation({ show: false, playerId: "", playerName: "" });
  };

  const handleSendMessageInternal = () => {
    if (!newMessage.trim() || !currentUser?.walletId) return;
    handleSendMessage(newMessage);
    setNewMessage("");
  };

  // Helper functions
  const getCharacterIcon = (character: string) => {
    switch (character) {
      case "ninja":
        return "🥷";
      case "wizard":
        return "🧙‍♂️";
      case "engineer":
        return "👨‍💻";
      default:
        return "👤";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Players + Game Settings (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Players Section */}
        <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neon-blue">
              <Users className="w-5 h-5" />
              <span>Players ({players.length}/4)</span>
            </CardTitle>
            <Progress value={readyPercentage} className="h-2 bg-cyber-darker" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isRefreshingPlayers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-neon-blue animate-spin" />
                  <span className="ml-2 text-gray-400">Loading players...</span>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No players found. Refreshing...
                </div>
              ) : (
                players.map((player) => (
                  <motion.div
                    key={player.walletId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 glass-morphism rounded-lg border border-gray-700/50"
                  >
                    {/* Left Side - Avatar + Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar Container */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 border-2 border-neon-blue/30">
                          <AvatarImage
                            src={`/avatars/${player.character}.png`}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-cyber-darker text-neon-blue text-lg font-semibold">
                            {getCharacterIcon(player.character || "default")}
                          </AvatarFallback>
                        </Avatar>
                        {/* Host Crown - Positioned better */}
                        {player.isHost && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name and Badges Row */}
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-100 truncate">
                            {player.username}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-neon-purple/20 text-neon-purple text-xs px-2 py-1"
                          >
                            Lv.{player.level}
                          </Badge>
                          {player.isReady && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/20 text-green-400 animate-pulse text-xs px-2 py-1"
                            >
                              Ready
                            </Badge>
                          )}

                          {player.status === "disconnected" && (
                            <Badge
                              variant="secondary"
                              className="bg-red-500/20 text-red-400 animate-pulse text-xs px-2 py-1"
                            >
                              Disconnected
                            </Badge>
                          )}
                        </div>

                        {/* Wallet ID */}
                        <p className="text-sm text-gray-400 truncate mb-2">
                          {player.walletId}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Trophy className="w-3 h-3 mr-1 flex-shrink-0" />
                            {player.score} pts
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Target className="w-3 h-3 mr-1 flex-shrink-0" />
                            {player.gamesWon} wins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Action Buttons */}
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      {/* Ready Button for non-host players */}
                      {!player.isHost &&
                        player.walletId === currentUser?.walletId && (
                          <Button
                            variant={player.isReady ? "secondary" : "default"}
                            size="sm"
                            onClick={handleToggleReady}
                            className={`transition-all duration-200 min-w-[90px] ${
                              player.isReady
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-neon-blue hover:bg-neon-blue/80"
                            }`}
                          >
                            {player.isReady ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Ready
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 mr-1" />
                                Ready Up
                              </>
                            )}
                          </Button>
                        )}

                      {/* Kick Button for host */}
                      {currentPlayer?.isHost &&
                        currentUser?.walletId !== player.walletId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleKickPlayer(player.walletId, player.username)
                            }
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 group w-10 h-10 p-0"
                            title="Kick player"
                          >
                            <Ban className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </Button>
                        )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Section */}
        {currentPlayer?.isHost ? (
          <EnhancedGameSettings
            onSave={() => updateGameSettings(roomId, gameSettings)}
            setGameSettings={setGameSettings}
            gameSettings={gameSettings}
          />
        ) : (
          <GameSettingsView gameSettings={gameSettings} />
        )}
      </div>

      {/* Right Column - Chat + Room Info + Controls (1/3 width) */}
      <div className="space-y-6">
        {/* Chat Section */}
        <Card className="glass-morphism-deep border border-neon-purple/30 shadow-neon-glow-sm flex flex-col min-h-[300px] max-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-neon-purple">
              <span className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chat</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceChatEnabled(!isVoiceChatEnabled)}
                className={
                  isVoiceChatEnabled ? "text-green-400" : "text-gray-400"
                }
              >
                {isVoiceChatEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-grow min-h-0">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm ${
                      msg.sender.isSystem ? "text-gray-500 italic" : ""
                    }`}
                  >
                    {!msg.sender.isSystem && (
                      <span className="font-semibold text-neon-blue">
                        {msg.sender.username}:{" "}
                      </span>
                    )}
                    <span
                      className={
                        msg.sender.isSystem ? "text-gray-400" : "text-gray-300"
                      }
                    >
                      {msg.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-cyber-darker border-gray-700 focus:border-neon-purple"
                onKeyUp={(e) =>
                  e.key === "Enter" && handleSendMessageInternal()
                }
              />
              <Button
                onClick={handleSendMessageInternal}
                disabled={!newMessage.trim()}
                className="bg-neon-purple hover:bg-neon-purple/80 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Room Info Section */}
        <Card className="glass-morphism-deep border border-gray-700/50 shadow-neon-glow-sm">
          <CardHeader>
            <CardTitle className="text-gray-300">Room Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Room Code:</span>
              <span className="text-neon-blue font-mono">
                #{currentRoom.roomCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Players:</span>
              <span className="text-gray-300">{players.length}/4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ready:</span>
              <span className="text-green-400">
                {readyCount}/{players.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-neon-purple">Waiting</span>
            </div>
          </CardContent>
        </Card>

        {/* Host Controls Section */}
        {currentPlayer?.isHost && (
          <Card className="glass-morphism-deep border border-neon-blue/30 shadow-neon-glow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-neon-blue">
                <Crown className="w-5 h-5" />
                <span>Host Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 animate-glow-pulse transition-all duration-200"
                disabled={readyCount < 2 || gameStatus !== "waiting"}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/room/${roomId}`
                  );
                  toast({
                    title: "Link copied!",
                    description: "Room link copied to clipboard",
                  });
                }}
                className="w-full border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 transition-all duration-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kick Confirmation Dialog */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${
          kickConfirmation.show
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        } transition-opacity duration-200`}
      >
        <Card className="glass-morphism-deep border border-red-500/30 shadow-neon-glow-md max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-lg font-semibold text-red-400">
                Kick Player
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to kick {kickConfirmation.playerName}?
            </p>
            <div className="bg-cyber-dark/50 rounded-lg p-3 mb-4">
              <p className="text-gray-300">
                <span className="text-red-400 font-semibold">
                  {kickConfirmation.playerName}
                </span>
                will be removed from the room and won't be able to rejoin.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  setKickConfirmation({
                    show: false,
                    playerId: "",
                    playerName: "",
                  })
                }
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmKickPlayer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              >
                <Ban className="w-4 h-4 mr-2" />
                Confirm Kick
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
