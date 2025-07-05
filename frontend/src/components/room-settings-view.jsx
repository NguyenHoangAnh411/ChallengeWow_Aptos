import React from "react";
import { motion } from "framer-motion";
import { Info, Clock, HelpCircle, Users, Target } from "lucide-react";

const Card = ({ children, className }) => (
  <div className={`rounded-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => <div className="p-4 pb-2">{children}</div>;

const CardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-4 pt-0">{children}</div>
);

const StatCard = ({
  icon,
  label,
  value,
  color = "text-gray-300",
  bgColor = "bg-gray-800/50",
}) => (
  <div className={`${bgColor} rounded-lg p-4 border border-gray-700/50`}>
    <div className="flex items-center space-x-3">
      <div className={`${color} text-xl`}>{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
      </div>
    </div>
  </div>
);

const DifficultyBar = ({ easy, medium, hard }) => {
  const total = easy + medium + hard;
  const easyPercent = total > 0 ? (easy / total) * 100 : 0;
  const mediumPercent = total > 0 ? (medium / total) * 100 : 0;
  const hardPercent = total > 0 ? (hard / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">Difficulty Distribution</span>
        <span className="text-gray-400">{total} total questions</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
        {easy > 0 && (
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${easyPercent}%` }}
          />
        )}
        {medium > 0 && (
          <div
            className="bg-yellow-500 h-full transition-all duration-300"
            style={{ width: `${mediumPercent}%` }}
          />
        )}
        {hard > 0 && (
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${hardPercent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-400">
            {easy} Easy ({easyPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-yellow-400">
            {medium} Medium ({mediumPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-400">
            {hard} Hard ({hardPercent.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const GameSettingsView = ({ gameSettings }) => {
  const totalQuestions =
    gameSettings.questions.easy +
    gameSettings.questions.medium +
    gameSettings.questions.hard;
  const estimatedTime = Math.ceil(
    (totalQuestions * gameSettings.timePerQuestion) / 60
  );
  const totalPoints =
    gameSettings.questions.easy * 50 +
    gameSettings.questions.medium * 100 +
    gameSettings.questions.hard * 150;

  const getDifficultyLevel = () => {
    const hardRatio = gameSettings.questions.hard / totalQuestions;
    const mediumRatio = gameSettings.questions.medium / totalQuestions;

    if (hardRatio > 0.5)
      return {
        level: "Very Hard",
        color: "text-red-400",
        bg: "bg-red-900/20",
        border: "border-red-600/30",
      };
    if (hardRatio > 0.3)
      return {
        level: "Hard",
        color: "text-orange-400",
        bg: "bg-orange-900/20",
        border: "border-orange-600/30",
      };
    if (mediumRatio > 0.5)
      return {
        level: "Medium",
        color: "text-yellow-400",
        bg: "bg-yellow-900/20",
        border: "border-yellow-600/30",
      };
    return {
      level: "Easy",
      color: "text-green-400",
      bg: "bg-green-900/20",
      border: "border-green-600/30",
    };
  };

  const difficultyInfo = getDifficultyLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 max-w-4xl mx-auto space-y-6"
      >
        {/* Header Card */}
        <Card className="bg-gray-900/70 backdrop-blur-sm border border-purple-400/30 shadow-lg shadow-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-purple-400">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Game Information</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyInfo.bg} ${difficultyInfo.color} ${difficultyInfo.border} border`}
              >
                {difficultyInfo.level} Game
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                Ready to Play?
              </h2>
              <p className="text-gray-400">
                Here's what to expect in this game session
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="📝"
            label="Total Questions"
            value={totalQuestions}
            color="text-purple-400"
            bgColor="bg-purple-900/20"
          />
          <StatCard
            icon="⏱️"
            label="Time per Question"
            value={`${gameSettings.timePerQuestion}s`}
            color="text-blue-400"
            bgColor="bg-blue-900/20"
          />
          <StatCard
            icon="🕒"
            label="Estimated Duration"
            value={`${estimatedTime} min`}
            color="text-cyan-400"
            bgColor="bg-cyan-900/20"
          />
          <StatCard
            icon="🎯"
            label="Max Points"
            value={totalPoints}
            color="text-yellow-400"
            bgColor="bg-yellow-900/20"
          />
        </div>

        {/* Difficulty Breakdown */}
        <Card className="bg-gray-900/70 backdrop-blur-sm border border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Target className="w-5 h-5" />
              <span>Question Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyBar
              easy={gameSettings.questions.easy}
              medium={gameSettings.questions.medium}
              hard={gameSettings.questions.hard}
            />
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-900/20 border border-green-600/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🟢</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {gameSettings.questions.easy}
              </div>
              <div className="text-green-300 font-medium mb-2">
                Easy Questions
              </div>
              <div className="text-xs text-gray-400">50 points each</div>
              <div className="text-sm text-green-400 mt-2 font-semibold">
                {gameSettings.questions.easy * 50} points available
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900/20 border border-yellow-600/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🟡</div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {gameSettings.questions.medium}
              </div>
              <div className="text-yellow-300 font-medium mb-2">
                Medium Questions
              </div>
              <div className="text-xs text-gray-400">100 points each</div>
              <div className="text-sm text-yellow-400 mt-2 font-semibold">
                {gameSettings.questions.medium * 100} points available
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-900/20 border border-red-600/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🔴</div>
              <div className="text-2xl font-bold text-red-400 mb-1">
                {gameSettings.questions.hard}
              </div>
              <div className="text-red-300 font-medium mb-2">
                Hard Questions
              </div>
              <div className="text-xs text-gray-400">150 points each</div>
              <div className="text-sm text-red-400 mt-2 font-semibold">
                {gameSettings.questions.hard * 150} points available
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Tips */}
        <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-600/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-indigo-300">
              <HelpCircle className="w-5 h-5" />
              <span>Game Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">💡</span>
                  <span className="text-gray-300">
                    Answer quickly for bonus points
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400">⚡</span>
                  <span className="text-gray-300">
                    You have {gameSettings.timePerQuestion} seconds per question
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-400">🎯</span>
                  <span className="text-gray-300">
                    Higher difficulty = more points
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">🏆</span>
                  <span className="text-gray-300">
                    Maximum possible score: {totalPoints} points
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ready Status */}
        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-400/30">
          <CardContent className="p-6 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Ready to Start!
            </h3>
            <p className="text-gray-300 mb-4">
              The host will begin the game when all players are ready
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>~{estimatedTime} minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Waiting for host</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GameSettingsView;
