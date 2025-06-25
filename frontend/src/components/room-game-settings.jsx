import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Info, Plus, Minus } from "lucide-react";
import { DEFAULT_GAME_SETTINGS } from "@/app/config/GameSettings";

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

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-left text-white hover:bg-gray-700 transition-colors"
      >
        {value}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 z-10 max-h-40 overflow-y-auto">
          {React.Children.map(children, (child) =>
            React.cloneElement(child, {
              onClick: () => {
                onValueChange(child.props.value);
                setIsOpen(false);
              },
            })
          )}
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ value, children, onClick }) => (
  <div
    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
    onClick={onClick}
  >
    {children}
  </div>
);

const NumberInput = ({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
  difficulty,
}) => {
  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "easy":
        return "text-green-400 border-green-400/30";
      case "medium":
        return "text-yellow-400 border-yellow-400/30";
      case "hard":
        return "text-red-400 border-red-400/30";
      default:
        return "text-purple-400 border-purple-400/30";
    }
  };

  return (
    <div>
      <label
        className={`text-sm mb-2 block font-medium ${getDifficultyColor(
          difficulty
        )}`}
      >
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <button
          onClick={decrement}
          disabled={value <= min}
          className="w-8 h-8 rounded bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={`w-16 px-2 py-1 text-center bg-gray-800 border rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${getDifficultyColor(
            difficulty
          )} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <button
          onClick={increment}
          disabled={value >= max}
          className="w-8 h-8 rounded bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {min} - {max} questions
      </div>
    </div>
  );
};

const EnhancedGameSettings = ({
  isHost = false,
  gameSettings,
  setGameSettings,
}) => {
  const totalQuestions =
    gameSettings.questions.easy +
    gameSettings.questions.medium +
    gameSettings.questions.hard;
  const estimatedTime = Math.ceil(
    (totalQuestions * gameSettings.timePerQuestion) / 60
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-4xl mx-auto"
        >
          <Card className="bg-gray-900/70 backdrop-blur-sm border border-purple-400/30 shadow-lg shadow-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-purple-400">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Game Settings</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-full">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">
                      Total: {totalQuestions} questions
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-full">
                    <span className="text-gray-300">
                      ≈ {estimatedTime} mins
                    </span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Time Setting */}
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <span>⏱️</span>
                    <span>Time per question</span>
                  </h4>
                  <Select
                    value={`${gameSettings.timePerQuestion} secs`}
                    onValueChange={(value) =>
                      setGameSettings((prev) => ({
                        ...prev,
                        timePerQuestion: parseInt(value),
                      }))
                    }
                  >
                    <SelectItem value="10">10 secs</SelectItem>
                    <SelectItem value="15">15 secs</SelectItem>
                    <SelectItem value="20">20 secs</SelectItem>
                    <SelectItem value="30">30 secs</SelectItem>
                    <SelectItem value="45">45 secs</SelectItem>
                    <SelectItem value="60">60 secs</SelectItem>
                  </Select>
                </div>

                {/* Questions Setting */}
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <span>📝</span>
                    <span>Questions on difficulty</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <NumberInput
                      value={gameSettings.questions.easy}
                      onChange={(value) =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { ...prev.questions, easy: value },
                        }))
                      }
                      label="🟢 Easy Questions"
                      difficulty="easy"
                      min={0}
                      max={20}
                    />
                    <NumberInput
                      value={gameSettings.questions.medium}
                      onChange={(value) =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { ...prev.questions, medium: value },
                        }))
                      }
                      label="🟡 Medium Questions"
                      difficulty="medium"
                      min={0}
                      max={20}
                    />
                    <NumberInput
                      value={gameSettings.questions.hard}
                      onChange={(value) =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { ...prev.questions, hard: value },
                        }))
                      }
                      label="🔴 Hard Questions"
                      difficulty="hard"
                      min={0}
                      max={20}
                    />
                  </div>
                </div>

                {/* Summary Info */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-400/30">
                  <h4 className="text-purple-300 font-medium mb-3 flex items-center space-x-2">
                    <Info className="w-5 h-5" />
                    <span>General Information</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-400 text-2xl font-bold">
                        {gameSettings.questions.easy}
                      </div>
                      <div className="text-gray-400">Easy Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 text-2xl font-bold">
                        {gameSettings.questions.medium}
                      </div>
                      <div className="text-gray-400">Medium Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 text-2xl font-bold">
                        {gameSettings.questions.hard}
                      </div>
                      <div className="text-gray-400">Hard Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 text-2xl font-bold">
                        {totalQuestions}
                      </div>
                      <div className="text-gray-400">Total Questions</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
                    <span>⏱️ Avg Time: {estimatedTime} mins</span>
                    <span>•</span>
                    <span>⚡ {gameSettings.timePerQuestion}s/question</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Quick Settings</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { easy: 3, medium: 3, hard: 2 },
                        }))
                      }
                      className="px-3 py-2 bg-green-600/20 text-green-400 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors text-sm"
                    >
                      Least (8 questions)
                    </button>
                    <button
                      onClick={() =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { easy: 5, medium: 5, hard: 5 },
                        }))
                      }
                      className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors text-sm"
                    >
                      Standard (15 questions)
                    </button>
                    <button
                      onClick={() =>
                        setGameSettings((prev) => ({
                          ...prev,
                          questions: { easy: 7, medium: 8, hard: 10 },
                        }))
                      }
                      className="px-3 py-2 bg-orange-600/20 text-orange-400 rounded border border-orange-600/30 hover:bg-orange-600/30 transition-colors text-sm"
                    >
                      Longest (25 questions)
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedGameSettings;
