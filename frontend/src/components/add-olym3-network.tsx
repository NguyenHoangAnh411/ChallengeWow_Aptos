"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OLYM3_TESTNET } from "@/lib/constants";
import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { Wallet, Network, CheckCircle, AlertCircle } from "lucide-react";

export function AddOlym3Network() {
  const [isAdding, setIsAdding] = useState(false);
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const addOlym3Network = async () => {
    if (!isConnected) {
      toast({
        title: "Ví chưa kết nối",
        description: "Vui lòng kết nối ví MetaMask trước",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      // Try to switch to Olym3 Testnet
      await switchChain({ chainId: OLYM3_TESTNET.id });
      toast({
        title: "Thành công!",
        description: "Đã chuyển sang mạng Olym3 Testnet",
      });
    } catch (error: any) {
      // If chain doesn't exist, add it manually
      if (error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${OLYM3_TESTNET.id.toString(16)}`,
                chainName: OLYM3_TESTNET.name,
                nativeCurrency: OLYM3_TESTNET.nativeCurrency,
                rpcUrls: OLYM3_TESTNET.rpcUrls.default.http,
                blockExplorerUrls: [OLYM3_TESTNET.blockExplorers.default.url],
              },
            ],
          });
          toast({
            title: "Thành công!",
            description: "Đã thêm mạng Olym3 Testnet vào MetaMask",
          });
        } catch (addError) {
          toast({
            title: "Lỗi",
            description: "Không thể thêm mạng Olym3 Testnet. Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể chuyển mạng. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Network className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Kết nối Olym3 Testnet</CardTitle>
        <CardDescription>
          Thêm mạng Olym3 Testnet vào ví MetaMask để tham gia game
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Mạng: {OLYM3_TESTNET.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Chain ID: {OLYM3_TESTNET.id}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Token: {OLYM3_TESTNET.nativeCurrency.symbol}</span>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Vui lòng kết nối ví MetaMask trước
            </span>
          </div>
        ) : (
          <Button
            onClick={addOlym3Network}
            disabled={isAdding}
            className="w-full"
            size="lg"
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang thêm mạng...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Thêm Olym3 Testnet
              </>
            )}
          </Button>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>
            Sau khi thêm mạng, bạn có thể nhận OLYM test tokens từ faucet để tham gia game
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 