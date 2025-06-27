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
  onSave, // New prop for save callback
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  const totalQuestions =
    gameSettings.questions.easy +
    gameSettings.questions.medium +
    gameSettings.questions.hard;
  const estimatedTime = Math.ceil(
    (totalQuestions * gameSettings.timePerQuestion) / 60
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Call the onSave callback prop if provided
      if (onSave) {
        await onSave(gameSettings);
      }

      setSaveStatus("success");

      // Clear success status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      console.error("Error saving settings:", error);

      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
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
                  <span className="text-gray-300">≈ {estimatedTime} mins</span>
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

              {/* Save Button */}
              <div className="flex justify-center pt-4">
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving || totalQuestions === 0}
                  whileHover={{ scale: totalQuestions > 0 ? 1.05 : 1 }}
                  whileTap={{ scale: totalQuestions > 0 ? 0.95 : 1 }}
                  className={`
                    flex items-center space-x-2 px-8 py-3 rounded-lg font-medium text-lg
                    transition-all duration-200 shadow-lg
                    ${
                      totalQuestions === 0
                        ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        : saveStatus === "success"
                        ? "bg-green-600 text-white shadow-green-500/30"
                        : saveStatus === "error"
                        ? "bg-red-600 text-white shadow-red-500/30"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30"
                    }
                  `}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : saveStatus === "success" ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Saved Successfully!</span>
                    </>
                  ) : saveStatus === "error" ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Save Failed</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      <span>Save Settings</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Status Message */}
              {saveStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`
                    text-center text-sm p-3 rounded-lg
                    ${
                      saveStatus === "success"
                        ? "bg-green-900/30 text-green-400 border border-green-600/30"
                        : "bg-red-900/30 text-red-400 border border-red-600/30"
                    }
                  `}
                >
                  {saveStatus === "success"
                    ? "✅ Game settings have been saved successfully!"
                    : "❌ Failed to save settings. Please try again."}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnhancedGameSettings;
