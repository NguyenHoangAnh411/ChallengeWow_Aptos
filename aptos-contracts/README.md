# Move Contract Development Guide

Hướng dẫn đầy đủ để phát triển và deploy Move contract trên Aptos blockchain từ đầu đến cuối.

## 📋 Mục lục

- [Cài đặt và Cấu hình](#cài-đặt-và-cấu-hình)
- [Khởi tạo Project](#khởi-tạo-project)
- [Cấu hình Move.toml](#cấu-hình-movetoml)
- [Viết Contract](#viết-contract)
- [Biên dịch và Test](#biên-dịch-và-test)
- [Deploy và Interact](#deploy-và-interact)
- [Utilities và Advanced](#utilities-và-advanced)
- [Workflow Điển Hình](#workflow-điển-hình)

## 🚀 Cài đặt và Cấu hình

### Cài đặt Aptos CLI
```bash
# Cài đặt Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Hoặc sử dụng package manager
# macOS
brew install aptos

# Windows
scoop install aptos

# Kiểm tra phiên bản
aptos --version
```

### Tạo Project Structure
```bash
# Tạo thư mục project
mkdir my-move-project
cd my-move-project

# Tạo cấu trúc thư mục
mkdir sources
mkdir tests
mkdir scripts

# Tạo file Move.toml
touch Move.toml
```

## 📁 Khởi tạo Project

### Cấu trúc thư mục chuẩn
```
my-move-project/
├── Move.toml
├── sources/
│   ├── my_module.move
│   └── other_module.move
├── tests/
│   └── my_module_tests.move
├── scripts/
│   └── deploy_script.move
└── README.md
```

## ⚙️ Cấu hình Move.toml

### File Move.toml cơ bản
```toml
[package]
name = "MyProject"
version = "1.0.0"
authors = ["your-email@example.com"]

[addresses]
my_project = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "devnet"
subdir = "aptos-framework"
```

### Cấu hình cho các network khác nhau
```toml
# Devnet
rev = "devnet"

# Testnet
rev = "testnet"

# Mainnet
rev = "mainnet"

# Specific commit
rev = "b1e7e2b"
```

## 📝 Viết Contract

### Template cơ bản (sources/my_module.move)
```move
module my_project::my_module {
    use std::signer;
    use std::error;
    use std::string;
    use aptos_framework::coin;
    
    // Struct definitions
    struct MyData has key, store {
        value: u64,
        name: string::String,
    }
    
    struct MyToken has store, drop {}
    
    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    
    // Events
    struct ValueChangedEvent has drop, store {
        old_value: u64,
        new_value: u64,
    }
    
    // Initialize function
    public entry fun init(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<MyData>(addr), error::already_exists(E_ALREADY_INITIALIZED));
        move_to(account, MyData { 
            value: 0,
            name: string::utf8(b"Default"),
        });
    }
    
    // Public functions
    public entry fun set_value(account: &signer, new_value: u64) acquires MyData {
        let addr = signer::address_of(account);
        assert!(exists<MyData>(addr), error::not_found(E_NOT_INITIALIZED));
        
        let data = borrow_global_mut<MyData>(addr);
        let old_value = data.value;
        data.value = new_value;
        
        // Emit event
        event::emit(ValueChangedEvent {
            old_value,
            new_value,
        });
    }
    
    public entry fun set_name(account: &signer, new_name: vector<u8>) acquires MyData {
        let addr = signer::address_of(account);
        assert!(exists<MyData>(addr), error::not_found(E_NOT_INITIALIZED));
        
        let data = borrow_global_mut<MyData>(addr);
        data.name = string::utf8(new_name);
    }
    
    // View functions
    public fun get_value(addr: address): u64 acquires MyData {
        assert!(exists<MyData>(addr), error::not_found(E_NOT_INITIALIZED));
        borrow_global<MyData>(addr).value
    }
    
    public fun get_name(addr: address): string::String acquires MyData {
        assert!(exists<MyData>(addr), error::not_found(E_NOT_INITIALIZED));
        borrow_global<MyData>(addr).name
    }
    
    // Check if initialized
    public fun is_initialized(addr: address): bool {
        exists<MyData>(addr)
    }
}
```

### Contract với Coin/Token
```move
module my_project::token_module {
    use std::signer;
    use std::error;
    use std::string;
    use aptos_framework::coin;
    
    struct MyToken has store, drop {}
    
    struct CapStore has key {
        burn_cap: coin::BurnCapability<MyToken>,
        mint_cap: coin::MintCapability<MyToken>,
    }
    
    // Initialize token
    public entry fun init_token(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<CapStore>(addr), error::already_exists(1));
        
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<MyToken>(
            account,
            string::utf8(b"My Token"),
            string::utf8(b"MTK"),
            6,
            false
        );
        
        move_to(account, CapStore {
            burn_cap,
            mint_cap,
        });
        
        coin::destroy_freeze_cap(freeze_cap);
        coin::register<MyToken>(account);
    }
    
    // Mint tokens
    public entry fun mint_tokens(account: &signer, to: address, amount: u64) acquires CapStore {
        let caps = borrow_global<CapStore>(signer::address_of(account));
        let minted = coin::mint<MyToken>(amount, &caps.mint_cap);
        coin::deposit(to, minted);
    }
    
    // Burn tokens
    public entry fun burn_tokens(account: &signer, amount: u64) acquires CapStore {
        let caps = borrow_global<CapStore>(signer::address_of(account));
        let coin_to_burn = coin::withdraw<MyToken>(account, amount);
        coin::burn<MyToken>(coin_to_burn, &caps.burn_cap);
    }
}
```

## 🔧 Biên dịch và Test

### Biên dịch Contract
```bash
# Biên dịch cơ bản
aptos move compile

# Biên dịch với thông tin chi tiết
aptos move compile --verbose

# Biên dịch với warnings
aptos move compile --warnings-as-errors

# Kiểm tra lỗi
aptos move check
```

### Viết Tests (tests/my_module_tests.move)
```move
#[test_only]
module my_project::my_module_tests {
    use std::signer;
    use my_project::my_module;
    
    #[test]
    fun test_init() {
        let account = account::create_account_for_test(@my_project);
        my_module::init(&account);
        assert!(my_module::is_initialized(@my_project), 0);
    }
    
    #[test]
    fun test_set_value() {
        let account = account::create_account_for_test(@my_project);
        my_module::init(&account);
        my_module::set_value(&account, 42);
        assert!(my_module::get_value(@my_project) == 42, 0);
    }
    
    #[test]
    #[expected_failure(abort_code = my_module::E_NOT_INITIALIZED)]
    fun test_get_value_not_initialized() {
        my_module::get_value(@0x123);
    }
}
```

### Chạy Tests
```bash
# Chạy tất cả test
aptos move test

# Chạy test với thông tin chi tiết
aptos move test --verbose

# Chạy test cụ thể
aptos move test --filter test_init

# Chạy test với coverage
aptos move test --coverage
```

## 🚀 Deploy và Interact

### Cấu hình Network
```bash
# Tạo profile cho devnet
aptos init --profile devnet --network devnet

# Tạo profile cho testnet
aptos init --profile testnet --network testnet

# Tạo profile cho mainnet
aptos init --profile mainnet --network mainnet

# Liệt kê profiles
aptos account list --profile devnet
```

### Lấy Test Coins
```bash
# Lấy coins từ faucet (devnet)
aptos account fund-with-faucet --profile devnet --account devnet

# Lấy coins từ faucet (testnet)
aptos account fund-with-faucet --profile testnet --account testnet
```

### Deploy Contract
```bash
# Deploy với address mặc định
aptos move publish --profile devnet

# Deploy với named address
aptos move publish --profile devnet --named-addresses my_project=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Deploy với gas limit tùy chỉnh
aptos move publish --profile devnet --max-gas 10000

# Deploy với upgrade policy
aptos move publish --profile devnet --upgrade-policy compatible
```

### Test Functions
```bash
# Gọi function init
aptos move run --profile devnet --function-id '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::my_module::init'

# Gọi function với arguments
aptos move run --profile devnet --function-id '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::my_module::set_value' --args u64:42

# Gọi function với string argument
aptos move run --profile devnet --function-id '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::my_module::set_name' --args string:"Hello World"

# Gọi function với address argument
aptos move run --profile devnet --function-id '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::token_module::mint_tokens' --args address:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef u64:1000
```

### Kiểm tra State
```bash
# Xem account info
aptos account list --profile devnet

# Xem resource của account
aptos account list --profile devnet --query resources

# Xem module đã deploy
aptos account list --profile devnet --query modules

# Xem balance của token
aptos account list --profile devnet --query resources --account 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## 🔍 Debug và Monitoring

### Xem Transaction Details
```bash
# Xem transaction details
aptos transaction show --profile devnet --transaction-hash 0x...

# Xem transaction với events
aptos transaction show --profile devnet --transaction-hash 0x... --with-events

# Xem transaction với payload
aptos transaction show --profile devnet --transaction-hash 0x... --with-payload

# Xem transaction với changes
aptos transaction show --profile devnet --transaction-hash 0x... --with-changes
```

### Simulate Transaction
```bash
# Simulate transaction
aptos move run --profile devnet --function-id 'module::function' --dry-run

# Estimate gas
aptos move run --profile devnet --function-id 'module::function' --estimate-max-gas
```

## 🛠️ Utilities và Advanced

### Code Quality
```bash
# Format code
aptos move format

# Lint code
aptos move lint

# Generate documentation
aptos move docgen

# Clean build artifacts
aptos move clean
```

### Key Management
```bash
# Generate key
aptos key generate --output-file key.key

# Import key
aptos key import --input-file key.key

# Rotate key
aptos key rotate --profile devnet

# List keys
aptos key list
```

### Move Prover (Formal Verification)
```bash
# Run Move Prover
aptos move prove

# Run specific spec
aptos move prove --spec-file my_spec.move

# Run with timeout
aptos move prove --timeout 300

# Run with verbose output
aptos move prove --verbose
```

### Scripts
```bash
# Chạy Move script
aptos move run-script --profile devnet --script-path scripts/my_script.move

# Compile script
aptos move compile --script-path scripts/my_script.move

# Example script (scripts/deploy_script.move)
script {
    use std::signer;
    use my_project::my_module;
    
    fun main(account: &signer) {
        my_module::init(account);
        my_module::set_value(account, 100);
    }
}
```

### Package Management
```bash
# Download dependencies
aptos move download

# Update dependencies
aptos move update

# Lock dependencies
aptos move lock
```

## 📋 Workflow Điển Hình

### Development Workflow
```bash
# 1. Setup project
mkdir my-project && cd my-project
aptos init --profile devnet --network devnet
aptos account fund-with-faucet --profile devnet --account devnet

# 2. Create Move.toml
# (Edit Move.toml as shown above)

# 3. Write contract
# (Create sources/my_module.move)

# 4. Write tests
# (Create tests/my_module_tests.move)

# 5. Compile and test
aptos move compile
aptos move test

# 6. Deploy
aptos move publish --profile devnet --named-addresses my_project=0x...

# 7. Test functions
aptos move run --profile devnet --function-id '0x...::my_module::init'
aptos move run --profile devnet --function-id '0x...::my_module::set_value' --args u64:100

# 8. Monitor
aptos transaction show --profile devnet --transaction-hash 0x...
aptos account list --profile devnet --query resources
```

### Production Workflow
```bash
# 1. Test on devnet
aptos move publish --profile devnet --named-addresses my_project=0x...
# Test all functions

# 2. Test on testnet
aptos init --profile testnet --network testnet
aptos account fund-with-faucet --profile testnet --account testnet
aptos move publish --profile testnet --named-addresses my_project=0x...
# Test all functions

# 3. Deploy to mainnet
aptos init --profile mainnet --network mainnet
aptos move publish --profile mainnet --named-addresses my_project=0x...
```

## 🚨 Common Issues và Solutions

### Compilation Errors
```bash
# Error: property map_borrow_with_default is not valid
# Solution: Update Aptos Framework version in Move.toml
rev = "devnet"  # or "main" or specific commit

# Error: Module not found
# Solution: Check address in Move.toml and deployment
aptos account list --profile devnet --query modules
```

### Deployment Errors
```bash
# Error: Insufficient gas
# Solution: Increase gas limit
aptos move publish --profile devnet --max-gas 50000

# Error: Account not funded
# Solution: Get test coins
aptos account fund-with-faucet --profile devnet --account devnet
```

### Runtime Errors
```bash
# Error: Resource not found
# Solution: Check if resource exists
aptos account list --profile devnet --query resources

# Error: Abort code
# Solution: Check error codes in contract
```

## 📚 Resources

- [Aptos Documentation](https://aptos.dev/)
- [Move Language Book](https://move-language.github.io/move/)
- [Aptos Framework](https://github.com/aptos-labs/aptos-framework)
- [Move Examples](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/framework/aptos-framework/sources)
- [Aptos CLI Reference](https://aptos.dev/cli/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Coding! 🚀** 