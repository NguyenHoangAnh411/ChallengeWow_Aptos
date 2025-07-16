"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WaitingRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;

  useEffect(() => {
    if (roomId) {
      router.replace(`/room/${roomId}`);
    }
  }, [roomId, router]);

  if (!roomId || roomId === "undefined") {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Invalid room ID. Please check your URL.</p>

          <Button
            onClick={router.back}
            className="pt-5 bg-gradient-to-r from-purple-500 to-emerald-600 hover:from-purple-600 hover:to-emerald-700 transition-all duration-200 px-4 py-4 text-sm font-bold shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 mr-3" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-8 h-8 text-neon-blue animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to room...</p>
      </div>
    </div>
  );
}
