import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectItem, SelectContent } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { GameQuestions, GameSettings } from "@/config/GameSettings";

interface EnhancedGameSettingsProps {
  gameSettings: GameSettings;
  setGameSettings: (gameSettings: GameSettings) => void;
  onSave?: (settings: GameSettings) => Promise<void>;
}

const EnhancedGameSettings: React.FC<EnhancedGameSettingsProps> = ({
  gameSettings,
  setGameSettings,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(
    null
  );

  const totalQuestions =
    (gameSettings.questions?.easy ?? 0) +
    (gameSettings.questions?.medium ?? 0) +
    (gameSettings.questions?.hard ?? 0);

  const estimatedTime = Math.ceil(
    (totalQuestions * gameSettings.timePerQuestion) / 60
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      if (onSave) {
        if (totalQuestions === 0) {
          setSaveStatus("error");
          return;
        }
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

  const handleTimeChange = (value: string) => {
    const timeValue = parseInt(value);
    setGameSettings({
      ...gameSettings,
      timePerQuestion: timeValue,
    });
  };

  const handleQuestionChange =
    (difficulty: keyof GameQuestions) => (value: number) => {
      setGameSettings({
        ...gameSettings,
        questions: { ...gameSettings.questions, [difficulty]: value },
      });
    };

  const setQuickPreset = (questions: GameQuestions) => {
    setGameSettings({
      ...gameSettings,
      questions,
    });
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
                  onValueChange={handleTimeChange}
                >
                  <SelectContent>
                    <SelectItem value="10">10 secs</SelectItem>
                    <SelectItem value="15">15 secs</SelectItem>
                    <SelectItem value="20">20 secs</SelectItem>
                    <SelectItem value="25">25 secs</SelectItem>
                    <SelectItem value="30">30 secs</SelectItem>
                    <SelectItem value="45">45 secs</SelectItem>
                    <SelectItem value="60">60 secs</SelectItem>
                  </SelectContent>
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
                    onChange={handleQuestionChange("easy")}
                    label="🟢 Easy Questions"
                    difficulty="easy"
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    value={gameSettings.questions.medium}
                    onChange={handleQuestionChange("medium")}
                    label="🟡 Medium Questions"
                    difficulty="medium"
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    value={gameSettings.questions.hard}
                    onChange={handleQuestionChange("hard")}
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
                      setQuickPreset({ easy: 5, medium: 3, hard: 2 })
                    }
                    className="px-3 py-2 bg-green-600/20 text-green-400 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors text-sm"
                  >
                    Default (10 questions)
                  </button>
                  <button
                    onClick={() =>
                      setQuickPreset({ easy: 3, medium: 4, hard: 3 })
                    }
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors text-sm"
                  >
                    Balanced (10 questions)
                  </button>
                  <button
                    onClick={() =>
                      setQuickPreset({ easy: 7, medium: 8, hard: 10 })
                    }
                    className="px-3 py-2 bg-orange-600/20 text-orange-400 rounded border border-orange-600/30 hover:bg-orange-600/30 transition-colors text-sm"
                  >
                    Extended (25 questions)
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
