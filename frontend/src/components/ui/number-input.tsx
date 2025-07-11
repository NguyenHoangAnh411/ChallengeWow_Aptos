import React from "react";
import { Plus, Minus } from "lucide-react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  difficulty: "easy" | "medium" | "hard";
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
  difficulty,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const getDifficultyColor = (diff: "easy" | "medium" | "hard"): string => {
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
