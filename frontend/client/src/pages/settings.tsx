import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Wallet, Palette, Gamepad2, Info, AlertTriangle, Trash, UserMinus, Book, Github, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useGameState } from "@/lib/game-state";

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useGameState();
  
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState(!!currentUser?.walletAddress);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Interface settings
  const [theme, setTheme] = useState("dark");
  const [soundEffects, setSoundEffects] = useState(true);
  const [animations, setAnimations] = useState(true);
  
  // Game settings
  const [autoJoinRooms, setAutoJoinRooms] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [questionCategories, setQuestionCategories] = useState({
    technology: true,
    science: false,
    general: true,
    sports: false
  });

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    
    // Simulate wallet disconnection
    setTimeout(() => {
      setIsWalletConnected(false);
      setIsDisconnecting(false);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    }, 1500);
  };

  const handleClearData = () => {
    toast({
      title: "Data Cleared",
      description: "All local data has been cleared.",
      variant: "destructive",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "This action would permanently delete your account.",
      variant: "destructive",
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setQuestionCategories(prev => ({
      ...prev,
      [category]: checked
    }));
  };

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="bg-cyber-darker border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/lobby")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-orbitron font-bold text-neon-blue">Settings</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Wallet Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-morphism rounded-lg p-6">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-neon-blue">
                  <Wallet className="w-5 h-5 mr-2" />
                  Wallet Connection
                </h3>
                <div className="space-y-4">
                  {isWalletConnected ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">MetaMask</div>
                          <div className="text-sm text-gray-400">
                            {currentUser?.walletAddress || "0x1234...5678"}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleDisconnectWallet}
                        disabled={isDisconnecting}
                        className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                      >
                        {isDisconnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Disconnect Wallet
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No wallet connected</p>
                      <Button
                        onClick={() => router.push("/")}
                        className="bg-neon-purple hover:bg-purple-600 px-6 py-2 rounded-lg font-medium transition-all duration-300"
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Interface Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-morphism rounded-lg p-6">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-neon-purple">
                  <Palette className="w-5 h-5 mr-2" />
                  Interface
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Theme</div>
                      <div className="text-sm text-gray-400">Choose your preferred theme</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className={`px-3 py-1 rounded text-sm ${
                          theme === "dark" ? "bg-neon-blue text-white" : "text-gray-400 hover:text-white bg-transparent"
                        }`}
                      >
                        Dark
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setTheme("light")}
                        className={`px-3 py-1 rounded text-sm ${
                          theme === "light" ? "bg-neon-blue text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Light
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sound Effects</div>
                      <div className="text-sm text-gray-400">Enable game sound effects</div>
                    </div>
                    <Switch
                      checked={soundEffects}
                      onCheckedChange={setSoundEffects}
                      className="data-[state=checked]:bg-neon-blue"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Animations</div>
                      <div className="text-sm text-gray-400">Reduce motion for better performance</div>
                    </div>
                    <Switch
                      checked={animations}
                      onCheckedChange={setAnimations}
                      className="data-[state=checked]:bg-neon-purple"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-morphism rounded-lg p-6">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-green-400">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Game Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-Join Rooms</div>
                      <div className="text-sm text-gray-400">Automatically join available rooms</div>
                    </div>
                    <Switch
                      checked={autoJoinRooms}
                      onCheckedChange={setAutoJoinRooms}
                      className="data-[state=checked]:bg-green-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notifications</div>
                      <div className="text-sm text-gray-400">Get notified about new challenges</div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                      className="data-[state=checked]:bg-green-400"
                    />
                  </div>

                  <div>
                    <div className="font-medium mb-2">Preferred Question Categories</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="technology"
                          checked={questionCategories.technology}
                          onCheckedChange={(checked) => handleCategoryChange("technology", !!checked)}
                          className="border-gray-600 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
                        />
                        <label htmlFor="technology" className="text-sm">Technology</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="science"
                          checked={questionCategories.science}
                          onCheckedChange={(checked) => handleCategoryChange("science", !!checked)}
                          className="border-gray-600 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
                        />
                        <label htmlFor="science" className="text-sm">Science</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="general"
                          checked={questionCategories.general}
                          onCheckedChange={(checked) => handleCategoryChange("general", !!checked)}
                          className="border-gray-600 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
                        />
                        <label htmlFor="general" className="text-sm">General Knowledge</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sports"
                          checked={questionCategories.sports}
                          onCheckedChange={(checked) => handleCategoryChange("sports", !!checked)}
                          className="border-gray-600 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
                        />
                        <label htmlFor="sports" className="text-sm">Sports</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-morphism rounded-lg p-6">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-400">
                  <Info className="w-5 h-5 mr-2" />
                  About
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span>1.0.0-beta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span>OLYM3 Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract:</span>
                    <span className="font-mono">0xABC...123</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <a href="#" className="text-neon-blue hover:text-blue-400 transition-colors flex items-center">
                      <Book className="w-4 h-4 mr-1" />
                      Documentation
                    </a>
                    <a href="#" className="text-neon-blue hover:text-blue-400 transition-colors flex items-center">
                      <Github className="w-4 h-4 mr-1" />
                      GitHub
                    </a>
                    <a href="#" className="text-neon-blue hover:text-blue-400 transition-colors flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Support
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="glass-morphism rounded-lg p-6 border border-red-500">
              <CardContent className="p-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <Button
                    onClick={handleClearData}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="outline"
                    className="w-full border border-red-500 text-red-400 hover:bg-red-600 hover:text-white px-4 py-3 rounded-lg font-medium transition-all duration-300"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
