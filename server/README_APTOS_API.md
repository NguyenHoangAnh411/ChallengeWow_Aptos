# Aptos Blockchain API Documentation

## Overview
This document describes the Aptos blockchain integration APIs for the ChallengeWow game.

## Base URL
```
http://localhost:3366/api
```

## Endpoints

### 1. Network Information
**GET** `/aptos/network`

Get current Aptos network configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "network": "devnet",
    "base_url": "https://fullnode.devnet.aptoslabs.com/v1",
    "explorer_url": "https://explorer.aptoslabs.com",
    "game_module_address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
  }
}
```

### 2. Account Balance
**GET** `/aptos/balance/{address}`

Get APT balance for an account.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "balance": 100000000,
    "balance_apt": 1.0,
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
  }
}
```

### 3. Token Balance
**GET** `/aptos/token-balance/{address}`

Get game token balance for an account.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "balance": 1000,
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
  }
}
```

### 4. Player Data
**GET** `/aptos/player-data/{address}`

Get player game data (score, games_played).

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "score": 150,
    "games_played": 5,
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
  }
}
```

### 5. Fund Account
**POST** `/aptos/fund/{address}?amount=100000000`

Fund account with test APT (devnet only).

**Parameters:**
- `address` (string): Aptos account address
- `amount` (int, optional): Amount in octa (default: 100,000,000 = 1 APT)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Funded 1.0 APT to 0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335",
    "amount": 100000000,
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
  }
}
```

### 6. Account Information
**GET** `/aptos/account/{address}`

Get account information.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "account": {
      "sequence_number": "0",
      "authentication_key": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335"
    }
  }
}
```

### 7. Account Resources
**GET** `/aptos/account/{address}/resources`

Get all resources for an account.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "resources": [
      {
        "type": "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
        "data": {
          "coin": {
            "value": "100000000"
          }
        }
      }
    ]
  }
}
```

### 8. Account Summary
**GET** `/aptos/account/{address}/summary`

Get comprehensive account summary including balance, tokens, and player data.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335",
    "network": "devnet",
    "balance": { "success": true, "balance": 100000000, "balance_apt": 1.0 },
    "token_balance": { "success": true, "balance": 1000 },
    "player_data": { "success": true, "score": 150, "games_played": 5 },
    "account_info": { "success": true, "account": {...} },
    "explorer_url": "https://explorer.aptoslabs.com/account/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335?network=devnet"
  }
}
```

### 9. Transaction Details
**GET** `/aptos/transaction/{hash}`

Get transaction details by hash.

**Parameters:**
- `hash` (string): Transaction hash

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "transaction": {
      "version": "123456",
      "hash": "0x...",
      "state_change_hash": "0x...",
      "event_root_hash": "0x...",
      "state_checkpoint_hash": null,
      "gas_used": "1000",
      "success": true,
      "vm_status": "Executed successfully",
      "accumulator_root_hash": "0x...",
      "changes": [...],
      "events": [...],
      "timestamp": "1234567890"
    },
    "explorer_url": "https://explorer.aptoslabs.com/txn/0x...?network=devnet"
  }
}
```

### 10. Validate Address
**GET** `/aptos/validate-address/{address}`

Validate Aptos address format.

**Parameters:**
- `address` (string): Aptos account address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335",
    "valid": true
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server error)

## Configuration

Set the following environment variables:

```bash
# Aptos Network (devnet, testnet, mainnet)
APTOS_NETWORK=devnet

# Admin account for minting tokens
APTOS_ADMIN_PRIVATE_KEY=ed25519-priv-0x...
APTOS_ADMIN_ADDRESS=0x...

# Game module address
APTOS_GAME_MODULE_ADDRESS=0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335
```

## Usage Examples

### Frontend Integration

```javascript
// Get account balance
const response = await fetch('/api/aptos/balance/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335');
const data = await response.json();

// Fund account
const fundResponse = await fetch('/api/aptos/fund/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335?amount=100000000', {
  method: 'POST'
});

// Get account summary
const summaryResponse = await fetch('/api/aptos/account/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335/summary');
```

### cURL Examples

```bash
# Get network info
curl http://localhost:3366/api/aptos/network

# Get account balance
curl http://localhost:3366/api/aptos/balance/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335

# Fund account
curl -X POST "http://localhost:3366/api/aptos/fund/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335?amount=100000000"

# Get account summary
curl http://localhost:3366/api/aptos/account/0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335/summary
``` 