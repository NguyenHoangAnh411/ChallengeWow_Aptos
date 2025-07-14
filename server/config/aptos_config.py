import os
from dotenv import load_dotenv

load_dotenv()

# Aptos Network Configuration
APTOS_NETWORK = os.getenv("APTOS_NETWORK", "devnet")
APTOS_ADMIN_PRIVATE_KEY = os.getenv("APTOS_ADMIN_PRIVATE_KEY")
APTOS_ADMIN_ADDRESS = os.getenv("APTOS_ADMIN_ADDRESS")
APTOS_GAME_MODULE_ADDRESS = os.getenv("APTOS_GAME_MODULE_ADDRESS", "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335")

# Aptos API URLs
APTOS_API_URLS = {
    "devnet": "https://fullnode.devnet.aptoslabs.com/v1",
    "testnet": "https://fullnode.testnet.aptoslabs.com/v1", 
    "mainnet": "https://fullnode.mainnet.aptoslabs.com/v1"
}

APTOS_EXPLORER_URLS = {
    "devnet": "https://explorer.aptoslabs.com",
    "testnet": "https://explorer.aptoslabs.com",
    "mainnet": "https://explorer.aptoslabs.com"
}

APTOS_FAUCET_URL = "https://faucet.devnet.aptoslabs.com/mint"

# Game Module Configuration
GAME_MODULE_CONFIG = {
    "module_address": APTOS_GAME_MODULE_ADDRESS,
    "module_name": "game_module",
    "functions": {
        "init_player": "init_player",
        "submit_score": "submit_score", 
        "init_caps": "init_caps",
        "mint_tokens": "mint_tokens",
        "send_reward": "send_reward",
        "burn_tokens": "burn_tokens"
    },
    "resources": {
        "player_data": "PlayerData",
        "my_token": "MyToken"
    }
}

# Default funding amount (in octa)
DEFAULT_FUNDING_AMOUNT = 100_000_000  # 1 APT 