import React from "react";

export const GameHistoryDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] p-4 lg:p-8 animate-pulse">
    <div className="max-w-6xl mx-auto">
      {/* Header Skeleton */}
      <div className="h-8 w-48 bg-slate-700 rounded mb-4"></div>
      <div className="h-12 w-80 bg-slate-700 rounded mb-2"></div>
      <div className="h-8 w-32 bg-slate-700 rounded mb-8"></div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-8">
        <div className="h-12 w-36 bg-slate-700 rounded-lg"></div>
        <div className="h-12 w-36 bg-slate-700 rounded-lg"></div>
        <div className="h-12 w-36 bg-slate-700 rounded-lg"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-48 w-full bg-slate-700 rounded-xl"></div>
        <div className="h-24 w-full bg-slate-700 rounded-xl"></div>
        <div className="h-24 w-full bg-slate-700 rounded-xl"></div>
      </div>
    </div>
  </div>
);
