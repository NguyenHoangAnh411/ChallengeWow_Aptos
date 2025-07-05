"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function WaitingRoom({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const { roomId } = params;

  useEffect(() => {
    router.replace(`/room/${roomId}`);
  }, [roomId, router]);

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-8 h-8 text-neon-blue animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to room...</p>
      </div>
    </div>
  );
}
