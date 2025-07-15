# Petra Wallet Integration

Hướng dẫn tích hợp ví Petra vào Challenge Wave DApp.

## Tổng quan

Dự án này đã được tích hợp ví Petra (Aptos wallet) cùng với các ví EVM thông qua RainbowKit. Người dùng có thể kết nối cả ví EVM (MetaMask, WalletConnect, etc.) và ví Aptos (Petra) bằng cách sử dụng ConnectButtonWithPetra component, giữ nguyên cách hiển thị gốc của RainbowKit modal.

## Các thành phần đã tạo

### 1. Petra Connector (`src/lib/petra-connector.ts`)
- Quản lý kết nối với ví Petra
- Kiểm tra xem Petra đã được cài đặt chưa
- Xử lý kết nối/ngắt kết nối
- Sign transaction và message

### 2. Petra Wallet Hook (`src/hooks/use-petra-wallet.ts`)
- Hook React để quản lý state của Petra wallet
- Tự động kiểm tra trạng thái kết nối
- Xử lý lỗi và loading states

### 3. Petra Wallet Option (`src/components/petra-wallet-option.tsx`)
- Component hiển thị option Petra trong modal
- Modal cài đặt Petra nếu chưa có
- Hiển thị trạng thái kết nối

### 4. Connect Button With Petra (`src/components/connect-button-with-petra.tsx`)
- Component kết hợp ConnectButton gốc của RainbowKit với Petra button
- Giữ nguyên cách hiển thị gốc của RainbowKit modal
- Thêm Petra button bên cạnh ConnectButton gốc

## Cách sử dụng

### 1. Sử dụng ConnectButtonWithPetra (Khuyến nghị)
```tsx
import { ConnectButtonWithPetra } from "@/components/connect-button-with-petra";

function MyComponent() {
  return (
    <ConnectButtonWithPetra />
  );
}
```

### 2. Sử dụng Petra Wallet Hook
```tsx
import { usePetraWallet } from "@/hooks/use-petra-wallet";

function MyComponent() {
  const { installed, isConnected, account, connect, disconnect } = usePetraWallet();

  return (
    <div>
      {installed ? (
        <button onClick={connect}>
          {isConnected ? `Connected: ${account}` : "Connect Petra"}
        </button>
      ) : (
        <p>Please install Petra wallet</p>
      )}
    </div>
  );
}
```

### 3. Sử dụng Petra Wallet Option (Cho custom UI)
```tsx
import { PetraWalletOption } from "@/components/petra-wallet-option";

function MyComponent() {
  const handleConnect = (address: string) => {
    console.log('Petra connected:', address);
  };

  return (
    <PetraWalletOption onConnect={handleConnect} />
  );
}
```

## Tính năng

### ✅ Đã hoàn thành
- [x] Tích hợp Petra wallet với RainbowKit
- [x] Modal cài đặt Petra tự động
- [x] Quản lý state kết nối
- [x] UI thân thiện với người dùng
- [x] Hỗ trợ kết nối/ngắt kết nối
- [x] Hiển thị địa chỉ ví đã kết nối
- [x] Xử lý lỗi và loading states

### 🔄 Có thể cải thiện
- [ ] Thêm các ví Aptos khác (Martian, Pontem, etc.)
- [ ] Tích hợp với Aptos blockchain operations
- [ ] Thêm support cho mobile wallets
- [ ] Cải thiện UX/UI
- [ ] Thêm animations và transitions

## Cài đặt Petra Wallet

### Chrome Extension
1. Truy cập [Chrome Web Store](https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinncaoajkhkmocdnaabaieajji)
2. Click "Add to Chrome"
3. Tạo hoặc import ví
4. Refresh trang web

### Firefox Extension
1. Truy cập [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/petra-aptos-wallet/)
2. Click "Add to Firefox"
3. Tạo hoặc import ví
4. Refresh trang web

### Mobile App
1. Tải app từ [App Store](https://apps.apple.com/app/petra-aptos-wallet/id6446058620) hoặc Google Play
2. Tạo hoặc import ví
3. Sử dụng WalletConnect để kết nối

## Troubleshooting

### Petra không hiển thị
- Kiểm tra xem Petra đã được cài đặt chưa
- Refresh trang web
- Kiểm tra console để xem lỗi

### Không thể kết nối
- Đảm bảo Petra đã được unlock
- Kiểm tra quyền truy cập của extension
- Thử ngắt kết nối và kết nối lại

### Lỗi network
- Đảm bảo đang kết nối đúng network (Devnet/Testnet/Mainnet)
- Kiểm tra RPC endpoint

## Tài liệu tham khảo

- [Petra Wallet Documentation](https://petra.app/docs)
- [Aptos Developer Documentation](https://aptos.dev/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/) 