// components/GameHistoryItemSkeleton.tsx
import React from "react";

const GameHistoryItemSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-[#b16cea]/5 via-[#3beaff]/5 to-[#b16cea]/5 backdrop-blur-md border border-[#b16cea]/20 rounded-xl p-6 transition-all duration-500 relative overflow-hidden animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 space-y-4">
          {/* Room Code and Status */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-24 bg-slate-700 rounded"></div>
            <div className="h-5 w-20 bg-slate-700 rounded-full"></div>
          </div>
          {/* Time Range */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-slate-700 rounded"></div>
            <div className="h-4 w-48 bg-slate-700 rounded"></div>
          </div>
        </div>
        {/* Action Button */}
        <div className="flex justify-end">
          <div className="h-12 w-40 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default GameHistoryItemSkeleton;
