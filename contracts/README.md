# 🌊 Challenge Wave Smart Contracts

Smart contracts for the Challenge Wave GameFi DApp on Olym3 Testnet.

## 📋 Tổng quan

Bộ smart contracts này bao gồm:
- **OLYMToken**: ERC20 token cho game rewards
- **ChallengeWaveGame**: Contract chính quản lý game rooms và rewards

## 🏗️ Cấu trúc dự án

```
contracts/
├── src/
│   ├── OLYMToken.sol          # ERC20 token contract
│   └── ChallengeWaveGame.sol  # Main game contract
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── ChallengeWave.test.js  # Test suite
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🚀 Cài đặt và Setup

### 1. Cài đặt dependencies

```bash
cd contracts
npm install
```

### 2. Tạo file environment

```bash
cp env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
# Private key của account deploy (QUAN TRỌNG: Không commit private key!)
PRIVATE_KEY=your_private_key_here

# API key cho Olym3 explorer (nếu có)
OLYM3_API_KEY=your_olym3_api_key_here

# Enable gas reporting
REPORT_GAS=true
```

### 3. Compile contracts

```bash
npm run compile
```

### 4. Chạy tests

```bash
npm test
```

## 🚀 Deployment

### Bước 1: Chuẩn bị

1. **Tạo ví MetaMask** và lấy private key
2. **Thêm Olym3 Testnet** vào MetaMask:
   - Network Name: Olym3 Testnet
   - RPC URL: https://rpc.olym3.xyz
   - Chain ID: 256000
   - Currency Symbol: OLYM
   - Block Explorer: https://explorer.olym3.xyz

3. **Nhận test tokens** từ faucet (nếu có)

### Bước 2: Deploy lên Olym3 Testnet

```bash
npm run deploy:olym3
```

### Bước 3: Verify contracts (tùy chọn)

```bash
npm run verify:olym3
```

## 📝 Hướng dẫn từng bước chi tiết

### Bước 1: Cài đặt Node.js và npm

Đảm bảo bạn đã cài đặt Node.js (version 16+) và npm.

### Bước 2: Tạo ví và lấy private key

1. Mở MetaMask
2. Tạo account mới hoặc sử dụng account hiện có
3. Export private key:
   - Click vào 3 dấu chấm → Account details
   - Click "Export Private Key"
   - Nhập password và copy private key

⚠️ **CẢNH BÁO**: Không bao giờ chia sẻ private key với ai!

### Bước 3: Thêm Olym3 Testnet vào MetaMask

1. Mở MetaMask
2. Click "Add Network" → "Add Network Manually"
3. Nhập thông tin:
   ```
   Network Name: Olym3 Testnet
   RPC URL: https://rpc.olym3.xyz
   Chain ID: 256000
   Currency Symbol: OLYM
   Block Explorer URL: https://explorer.olym3.xyz
   ```

### Bước 4: Nhận test tokens

Nếu có faucet, truy cập https://faucet.olym3.xyz để nhận test tokens.

### Bước 5: Deploy contracts

```bash
# Compile contracts
npm run compile

# Deploy lên Olym3 Testnet
npm run deploy:olym3
```

### Bước 6: Cập nhật frontend

Sau khi deploy thành công, cập nhật file `frontend/src/lib/constants.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  GAME_CONTRACT: "0x...", // Address từ deployment
  REWARD_CONTRACT: "0x...", // Address từ deployment
} as const;
```

## 🔧 Cấu hình Hardhat

File `hardhat.config.js` đã được cấu hình sẵn cho Olym3 Testnet:

```javascript
networks: {
  "olym3-testnet": {
    url: "https://rpc.olym3.xyz",
    chainId: 256000,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    gasPrice: 20000000000, // 20 gwei
    gas: 2100000,
  },
}
```

## 🧪 Testing

### Chạy tất cả tests

```bash
npm test
```

### Chạy test cụ thể

```bash
npx hardhat test test/ChallengeWave.test.js
```

### Chạy test với coverage

```bash
npm run coverage
```

## 📊 Gas Optimization

Contracts đã được tối ưu hóa gas:
- Sử dụng Solidity 0.8.20
- Optimizer enabled với 200 runs
- Sử dụng OpenZeppelin contracts đã được audit
- Minimal storage operations

## 🔒 Security Features

- **ReentrancyGuard**: Bảo vệ khỏi reentrancy attacks
- **Ownable**: Chỉ owner mới có thể gọi admin functions
- **Pausable**: Có thể pause token transfers nếu cần
- **Input validation**: Kiểm tra tất cả inputs
- **Emergency functions**: Có thể pause/refund trong trường hợp khẩn cấp

## 📋 Contract Functions

### OLYMToken

- `mint(address to, uint256 amount)`: Mint tokens (owner only)
- `mintGameReward(address to, uint256 amount)`: Mint rewards (game contract only)
- `burn(uint256 amount)`: Burn tokens
- `pause() / unpause()`: Pause/unpause transfers

### ChallengeWaveGame

- `createRoom(uint256 maxPlayers, uint256 entryFee)`: Tạo phòng mới
- `joinRoom(bytes32 roomId)`: Tham gia phòng
- `leaveRoom(bytes32 roomId)`: Rời phòng
- `submitGameResult(bytes32 roomId, address winner, uint256 score, bytes32 zkProof)`: Submit kết quả
- `claimRewards(bytes32 roomId)`: Nhận rewards

## 🚨 Troubleshooting

### Lỗi thường gặp

1. **"Insufficient funds"**
   - Kiểm tra balance trong ví
   - Nhận test tokens từ faucet

2. **"Nonce too low"**
   - Reset MetaMask account
   - Hoặc tăng nonce manually

3. **"Gas estimation failed"**
   - Tăng gas limit
   - Kiểm tra contract code

4. **"Contract verification failed"**
   - Kiểm tra constructor arguments
   - Đảm bảo compiler version đúng

### Debug commands

```bash
# Check network connection
npx hardhat console --network olym3-testnet

# Get account balance
npx hardhat run scripts/check-balance.js --network olym3-testnet

# Clean artifacts
npx hardhat clean
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Verify network configuration
3. Test với local network trước
4. Liên hệ team development

## 🔗 Links hữu ích

- [Olym3 Explorer](https://explorer.olym3.xyz)
- [Olym3 Documentation](https://docs.olym3.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/) 