'use client';

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cyber-dark">
      <Card className="w-full max-w-md mx-4 glass-morphism">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-neon-blue">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Button
            onClick={() => router.push("/")}
            className="mt-6 w-full bg-neon-blue hover:bg-blue-600"
          >
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
