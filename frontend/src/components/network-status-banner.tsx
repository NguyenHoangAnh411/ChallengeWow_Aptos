"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { AddOlym3Network } from "./add-olym3-network";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Wallet,
  Network
} from "lucide-react";

export function NetworkStatusBanner() {
  const { 
    isConnected, 
    isCorrectNetwork, 
    isLoading, 
    networkName 
  } = useNetworkStatus();

  if (isLoading) {
    return (
      <Alert className="mb-4">
        <Wifi className="h-4 w-4 animate-pulse" />
        <AlertTitle>Đang kiểm tra kết nối...</AlertTitle>
        <AlertDescription>
          Đang kiểm tra trạng thái mạng blockchain
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <Wallet className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Chưa kết nối ví</AlertTitle>
        <AlertDescription>
          Vui lòng kết nối ví MetaMask để tham gia game Challenge Wave
        </AlertDescription>
      </Alert>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Alert className="mb-4 border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle>Sai mạng blockchain</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Vui lòng chuyển sang mạng {networkName} để tham gia game
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Network className="h-4 w-4 mr-2" />
                Thêm mạng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kết nối {networkName}</DialogTitle>
              </DialogHeader>
              <AddOlym3Network />
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle>Đã kết nối {networkName}</AlertTitle>
      <AlertDescription>
        Bạn đã sẵn sàng tham gia game Challenge Wave!
      </AlertDescription>
    </Alert>
  );
} 