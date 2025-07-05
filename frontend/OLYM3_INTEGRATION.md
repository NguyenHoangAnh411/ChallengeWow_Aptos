# 🌊 Tích hợp Olym3 Testnet vào Challenge Wave

Hướng dẫn chi tiết về cách tích hợp và sử dụng mạng Olym3 Testnet trong ứng dụng Challenge Wave.

## 📋 Tổng quan

Ứng dụng Challenge Wave đã được tích hợp với mạng Olym3 Testnet để:
- Xác thực người chơi thông qua ví blockchain
- Lưu trữ kết quả game trên blockchain
- Tạo zk-SNARK proofs cho các thử thách
- Phát hành phần thưởng token

## 🔧 Cấu hình mạng Olym3 Testnet

### Thông tin mạng
```typescript
OLYM3_TESTNET = {
  id: 256000, // Chain ID
  name: "Olym3 Testnet",
  network: "olym3-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "OLYM",
    symbol: "OLYM",
  },
  rpcUrls: {
    default: { http: ["https://rpc1.olym3.xyz"] },
    public: { http: ["https://rpc1.olym3.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Olym3 Explorer",
      url: "https://explorer.olym3.xyz",
    },
  },
  testnet: true,
}
```

### Các file đã được tạo/cập nhật

1. **`src/lib/constants.ts`** - Cấu hình mạng Olym3 Testnet
2. **`src/components/providers.tsx`** - Cập nhật WagmiProvider với Olym3 Testnet
3. **`src/components/add-olym3-network.tsx`** - Component thêm mạng vào MetaMask
4. **`src/components/network-status-banner.tsx`** - Banner hiển thị trạng thái mạng
5. **`src/hooks/use-network-status.tsx`** - Hook kiểm tra trạng thái mạng
6. **`src/lib/blockchain.ts`** - Utilities cho tương tác blockchain
7. **`src/app/setup-network/page.tsx`** - Trang hướng dẫn thiết lập mạng

## 🚀 Cách sử dụng

### 1. Kết nối ví MetaMask

Người dùng cần:
1. Cài đặt MetaMask extension
2. Kết nối ví với ứng dụng
3. Thêm mạng Olym3 Testnet

### 2. Thêm mạng Olym3 Testnet

Có 2 cách:

#### Cách 1: Tự động (Khuyến nghị)
```typescript
import { AddOlym3Network } from "@/components/add-olym3-network";

// Component sẽ tự động thêm mạng khi người dùng click
<AddOlym3Network />
```

#### Cách 2: Thủ công
1. Mở MetaMask
2. Vào Settings > Networks > Add Network
3. Nhập thông tin:
   - Network Name: Olym3 Testnet
   - RPC URL: https://rpc.olym3.xyz
   - Chain ID: 256000
   - Currency Symbol: OLYM
   - Block Explorer: https://explorer.olym3.xyz

### 3. Kiểm tra trạng thái mạng

```typescript
import { useNetworkStatus } from "@/hooks/use-network-status";

function MyComponent() {
  const { isConnected, isCorrectNetwork, networkName } = useNetworkStatus();
  
  if (!isConnected) {
    return <div>Vui lòng kết nối ví</div>;
  }
  
  if (!isCorrectNetwork) {
    return <div>Vui lòng chuyển sang mạng {networkName}</div>;
  }
  
  return <div>Sẵn sàng chơi game!</div>;
}
```

### 4. Hiển thị banner trạng thái

```typescript
import { NetworkStatusBanner } from "@/components/network-status-banner";

function App() {
  return (
    <div>
      <NetworkStatusBanner />
      {/* Rest of your app */}
    </div>
  );
}
```

## 🔗 Tương tác với Blockchain

### Sử dụng blockchain utilities

```typescript
import { blockchainUtils, networkHelpers } from "@/lib/blockchain";

// Lấy balance
const balance = await blockchainUtils.getBalance(address);
const formattedBalance = blockchainUtils.formatOLYM(balance);

// Lấy thông tin mạng
const networkInfo = networkHelpers.getNetworkInfo();

// Tạo explorer URL
const txUrl = networkHelpers.getExplorerUrl(txHash);
const addressUrl = networkHelpers.getAddressExplorerUrl(address);
```

### Tương tác với smart contracts (Khi có contract)

```typescript
import { contractHelpers } from "@/lib/blockchain";

// Submit kết quả game
const txHash = await contractHelpers.submitGameResult(
  walletClient,
  contractAddress,
  {
    roomId: "room-123",
    winner: "0x...",
    score: 100,
    zkProof: "proof-data"
  }
);

// Claim rewards
const rewardTx = await contractHelpers.claimRewards(
  walletClient,
  rewardContractAddress,
  "10.5" // OLYM amount
);
```

## 🎮 Tích hợp vào Game Flow

### 1. Trước khi vào game
- Kiểm tra kết nối ví
- Kiểm tra mạng đúng
- Hiển thị hướng dẫn nếu cần

### 2. Trong game
- Sử dụng địa chỉ ví làm player ID
- Lưu trữ tạm thời kết quả game

### 3. Sau khi kết thúc game
- Tạo zk-SNARK proof
- Submit kết quả lên blockchain
- Cập nhật leaderboard
- Phát hành rewards

## 🛠️ Development

### Chạy ứng dụng

```bash
cd frontend
npm install
npm run dev
```

### Test mạng Olym3 Testnet

1. Kết nối ví MetaMask
2. Chuyển sang mạng Olym3 Testnet
3. Nhận test tokens từ faucet (nếu có)
4. Test các tính năng blockchain

### Debug

```typescript
// Kiểm tra trạng thái mạng
console.log("Chain ID:", chainId);
console.log("Is on Olym3:", networkHelpers.isOnOlym3Testnet(chainId));

// Kiểm tra balance
const balance = await blockchainUtils.getBalance(address);
console.log("Balance:", blockchainUtils.formatOLYM(balance));
```

## 🔗 Links hữu ích

- **Olym3 Explorer**: https://explorer.olym3.xyz
- **Olym3 Documentation**: https://docs.olym3.xyz
- **Olym3 Faucet**: https://faucet.olym3.xyz
- **MetaMask**: https://metamask.io

## 📝 Lưu ý quan trọng

1. **Testnet**: Olym3 Testnet chỉ dùng để test, không có giá trị thực
2. **Faucet**: Cần faucet để nhận OLYM test tokens
3. **Smart Contracts**: Cần deploy game contracts lên Olym3 Testnet
4. **Security**: Luôn verify transactions trước khi confirm
5. **Backup**: Backup private keys và seed phrases an toàn

## 🚨 Troubleshooting

### Lỗi thường gặp

1. **"Chain not found"**
   - Kiểm tra Chain ID đúng (256000)
   - Thử thêm mạng thủ công

2. **"RPC Error"**
   - Kiểm tra RPC URL: https://rpc.olym3.xyz
   - Thử refresh trang

3. **"Insufficient balance"**
   - Nhận test tokens từ faucet
   - Kiểm tra địa chỉ ví đúng

4. **"Transaction failed"**
   - Kiểm tra gas limit
   - Đảm bảo đủ OLYM để trả phí

### Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Verify network configuration
3. Test với ví khác
4. Liên hệ team development 