"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Loader,
  Target,
  Trophy,
  Users,
  Zap,
  // ... các icon khác
} from "lucide-react";
import { GameStatus } from "@/types/GameStatus";
import { useGameState } from "@/lib/game-state";
import { useRoomQuery } from "@/hooks/use-room-query";
import { PlayersTab } from "@/components/history/player-tab";
import { OverviewTab } from "@/components/history/overview-tab";
import { QuestionsTab } from "@/components/history/question-tab";
import { TabButton } from "@/components/ui/tab-button";
import { GameHistoryDetailSkeleton } from "@/components/history/game-history-detail-skeleton";

const GameHistoryDetail: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useGameState();
  const tabs = [
    {
      name: "overview",
      label: "Overview",
      icon: <Zap size={18} />,
    },
    {
      name: "players",
      label: "Players",
      icon: <Users size={18} />,
    },
    {
      name: "questions",
      label: "Questions",
      icon: <Target size={18} />,
    },
    {
      name: "results",
      label: "Results",
      icon: <Trophy size={18} />,
    },
  ] as const;
  type TabName = (typeof tabs)[number]["name"];
  const [activeTab, setActiveTab] = useState<TabName>("overview");

  const roomId = useMemo(() => pathname?.split("/").pop(), [pathname]);

  const { data: room, isLoading, isError } = useRoomQuery(roomId);

  const derivedData = useMemo(() => {
    if (!room) {
      return null;
    }

    const statusInfo = getStatusInfo(room.status);
    const isWinner =
      room.status === GameStatus.FINISHED &&
      room.winnerWalletId === currentUser?.walletId;
    const startedAt = room.startedAt ? new Date(room.startedAt) : null;
    const endedAt = room.endedAt ? new Date(room.endedAt) : null;
    const gameDuration =
      startedAt && endedAt
        ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000 / 60)
        : 0;

    return { statusInfo, isWinner, gameDuration };
  }, [room, currentUser?.walletId]);

  if (isLoading) {
    return <GameHistoryDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] text-red-400">
        <p className="font-orbitron text-xl">Error loading game details.</p>
        <p>The game might not exist or an error occurred.</p>
      </div>
    );
  }

  if (!room || !derivedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] text-yellow-400">
        <p className="font-orbitron text-xl">Game not found.</p>
        <p>The requested game ID could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0d2e] via-[#16213e] to-[#0f1419] text-white p-4 lg:p-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#3beaff] hover:text-[#b16cea] transition-colors duration-300 mb-4 font-orbitron"
          >
            <ArrowLeft size={20} /> Back to History
          </button>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-orbitron font-bold text-[#b16cea] drop-shadow-[0_0_20px_rgba(177,108,234,0.8)] mb-2">
                #{room.roomCode}
              </h1>
              <div className="flex items-center gap-4">
                <div
                  className={`px-4 py-2 rounded-full font-orbitron text-sm ${derivedData.statusInfo.color} ${derivedData.statusInfo.bgColor} border border-current/30`}
                >
                  {derivedData.statusInfo.label}
                </div>
                {derivedData.isWinner && (
                  <div className="px-4 py-2 rounded-full font-orbitron text-sm text-green-400 bg-green-400/20 border border-green-400/30 flex items-center gap-2">
                    <Trophy size={16} /> Victory!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Khôi phục lại */}
        <div className="flex flex-wrap gap-2 mb-8">
          <TabButton
            tabName="overview"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            label="Overview"
            icon={<Target size={18} />}
          />
          <TabButton
            tabName="players"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            label="Players"
            icon={<Users size={18} />}
          />
          <TabButton
            tabName="questions"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            label="Questions"
            icon={<Zap size={18} />}
          />
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === "overview" && (
            <OverviewTab
              gameDetail={room}
              gameDuration={derivedData.gameDuration}
            />
          )}
          {activeTab === "players" && (
            <PlayersTab
              gameDetail={room}
              currentUserWallet={currentUser?.walletId ?? ""}
            />
          )}
          {activeTab === "questions" && <QuestionsTab gameDetail={room} />}
        </div>
      </div>
    </div>
  );
};

const getStatusInfo = (status: GameStatus) => {
  switch (status) {
    case GameStatus.WAITING:
    case GameStatus.COUNTING_DOWN:
      return {
        label: "Waiting",
        color: "text-gray-400",
        bgColor: "bg-gray-400/20",
      };
    case GameStatus.IN_PROGRESS:
    case GameStatus.QUESTION_RESULT:
      return {
        label: "In Progress",
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/20",
      };
    case GameStatus.FINISHED:
      return {
        label: "Finished",
        color: "text-green-400",
        bgColor: "bg-green-400/20",
      };
    case GameStatus.CANCELLED:
      return {
        label: "Cancelled",
        color: "text-red-400",
        bgColor: "bg-red-400/20",
      };
    default:
      return {
        label: "Unknown",
        color: "text-gray-400",
        bgColor: "bg-gray-400/20",
      };
  }
};

export default GameHistoryDetail;
