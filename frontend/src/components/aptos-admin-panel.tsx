import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useBlockchain } from '../hooks/use-blockchain'; 
// SỬA LỖI: Import tĩnh tất cả những gì cần thiết ở đây.
import { aptosClient, aptosUtils, getBalanceWithSdk } from '../lib/aptos'; 
import { 
  Shield, 
  Send, 
  Key,
  UserPlus,
  RefreshCw 
} from 'lucide-react';
import { toast } from '../hooks/use-toast';


// CẢNH BÁO BẢO MẬT: Không bao giờ lưu private key trực tiếp trong code ở môi trường production.
// Hãy sử dụng biến môi trường (Environment Variables).
// Ví dụ: const ADMIN_PRIVATE_KEY = process.env.REACT_APP_ADMIN_PRIVATE_KEY;
const ADMIN_PRIVATE_KEY = 'ed25519-priv-0x6cd07e57a2a22f71af3c121d1d917bcd377f97652171a2048dc74f71f4937208';
const ADMIN_ADDRESS = '0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335';
const APT_IN_OCTA = 100000000;

export const AptosAdminPanel: React.FC = () => {
  // Chỉ lấy những gì cần dùng từ hook
  const { getExplorerUrl } = useBlockchain();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isAdminConnected, setIsAdminConnected] = useState(false);
  const [adminAddress, setAdminAddress] = useState('');
  const [adminBalance, setAdminBalance] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toApt = (octa: number) => (octa / APT_IN_OCTA).toFixed(4);

  const connectAsAdmin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // `aptosClient` đã được khởi tạo với admin account, chỉ cần lấy địa chỉ từ nó.
      const adminAddr = aptosClient['adminAccount'].accountAddress.toString();
      
      const balance = await getBalanceWithSdk(adminAddr);
      setAdminBalance(balance ?? 0);
      setIsAdminConnected(true);
      setAdminAddress(adminAddr);
      
      toast({
        title: "Admin Connected",
        description: `Connected as admin: ${adminAddr.slice(0, 8)}... (Balance: ${toApt(balance ?? 0)} APT)`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect as admin';
      console.error('Admin connection error:', err);
      setError(errorMessage);
      toast({ title: "Admin Connection Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitToken = async () => {
    if (adminBalance < 0.05 * APT_IN_OCTA) { // So sánh trực tiếp với OCTA
      toast({
        title: "Insufficient Balance",
        description: `Admin balance: ${toApt(adminBalance)} APT. Need at least 0.05 APT for transaction fees.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { aptosClient } = await import('../lib/aptos');
      // Giả sử initToken cần admin account để ký
      const result = await aptosClient.initToken(); 
      toast({
        title: "Token Initialized",
        description: `Transaction: ${result.hash}`,
      });
      
      const explorerUrl = getExplorerUrl(result.hash);
      if (explorerUrl) window.open(explorerUrl, '_blank');
      refreshBalance(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize token';
      console.error('Failed to initialize token:', err);
      setError(errorMessage);
      toast({ title: "Token Init Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMintTokens = async () => {
    // ... (Thêm validation nếu cần)
    setIsSubmitting(true);
    setError('');
    try {
      const amount = parseInt(tokenAmount);
      // SỬA LỖI: Gọi trực tiếp `aptosClient`.
      const result = await aptosClient.mintTokens(recipientAddress.trim(), amount);
      toast({
        title: "Tokens Minted",
        description: `${amount} tokens minted to ${recipientAddress.slice(0, 8)}...`,
      });
      
      const explorerUrl = getExplorerUrl(result.hash);
      if (explorerUrl) window.open(explorerUrl, '_blank');
      refreshBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint tokens';
      console.error('Minting failed:', err);
      setError(errorMessage);
      toast({ title: "Mint Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchMint = async () => {
    // ... (Thêm validation nếu cần)
    setIsSubmitting(true);
    setError('');
    try {
        const addresses = recipientAddress.split('\n').filter(addr => addr.trim() && aptosUtils.isValidAddress(addr.trim()));
        const amount = parseInt(tokenAmount);
        let successCount = 0;
        let failedAddresses: string[] = [];

        // Sử dụng Promise.allSettled để xử lý đồng thời và thu thập kết quả
        const mintPromises = addresses.map(async (addr) => {
          try {
            await aptosClient.mintTokens(addr.trim(), amount);
            return { status: 'fulfilled' as const, address: addr };
          } catch (err) {
            return { status: 'rejected' as const, address: addr, reason: err };
          }
        });
        
        const results = await Promise.all(mintPromises);

        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            failedAddresses.push(result.address);
            console.error(`Failed to mint to ${result.address}:`, result.reason);
          }
        });
        
        toast({
            title: "Batch Mint Complete",
            description: `Successfully minted to ${successCount}/${addresses.length} addresses.`,
        });

        if (failedAddresses.length > 0) {
          setError(`Failed to mint to: ${failedAddresses.join(', ')}`);
        }

        refreshBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during batch mint.';
      console.error('Batch mint failed:', err);
      setError(errorMessage);
      toast({ title: "Batch Mint Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const refreshBalance = async () => {
    if (!isAdminConnected || !adminAddress) return;
    
    try {
      const balance = await getBalanceWithSdk(adminAddress);
      setAdminBalance(balance ?? 0);
      setError('');
      toast({ title: "Balance Refreshed", description: `New balance: ${toApt(balance ?? 0)} APT`});
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      setError('Failed to refresh balance');
    }
  };
  
  // Các hàm còn lại (getAptFromFaucet) cũng nên bọc trong setIsSubmitting(true/false)

  // Helper component cho button có trạng thái loading
  const LoadingButton: React.FC<React.ComponentProps<typeof Button> & {loading: boolean}> = ({ loading, children, ...props }) => (
    <Button {...props} disabled={props.disabled || loading}>
      {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : children}
    </Button>
  );

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <Card className="border-orange-200 bg-orange-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Shield className="h-5 w-5" /> Admin Panel
          </CardTitle>
          <CardDescription>
            Kết nối với quyền admin để khởi tạo và cấp phát token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdminConnected ? (
            <div>
              <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg text-sm text-orange-700">
                <b>Cảnh báo:</b> Chức năng này sử dụng private key của admin được định nghĩa sẵn để thực hiện giao dịch trên devnet.
                <p className="font-mono text-xs mt-1 break-all">{ADMIN_ADDRESS}</p>
              </div>
              <LoadingButton 
                onClick={connectAsAdmin}
                loading={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 mt-4"
              >
                <Key className="h-4 w-4 mr-2" />
                Connect as Admin
              </LoadingButton>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-sm text-green-700 mt-1">
                  Đã kết nối với ví admin: <span className="font-mono">{adminAddress}</span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-700">
                    Số dư: <span className="font-bold">{toApt(adminBalance)} APT</span>
                  </p>
                  <Button onClick={refreshBalance} size="sm" variant="outline" className="h-6 px-2 text-xs">Refresh</Button>
                </div>
              </div>
              {/* ... Phần hiển thị lỗi ... */}
            </div>
          )}
        </CardContent>
      </Card>
      
      {isAdminConnected && (
         <>
          {/* Mint Tokens Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Mint Tokens</CardTitle>
              <CardDescription>Cấp phát token cho người dùng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* ... input amount và address ... */}
                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Địa chỉ ví nhận (Recipient Address)</Label>
                  <Textarea
                    id="recipientAddress"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Nhập một hoặc nhiều địa chỉ, mỗi địa chỉ một dòng"
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
               <div className="flex gap-2 flex-wrap">
                  <LoadingButton 
                    onClick={handleMintTokens} 
                    loading={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mint (Single)
                  </LoadingButton>
                  <LoadingButton 
                    onClick={handleBatchMint} 
                    loading={isSubmitting}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Mint (Batch)
                  </LoadingButton>
                </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};