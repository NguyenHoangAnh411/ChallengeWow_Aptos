import json
from web3 import Web3
import os

# Đường dẫn đến file ABI (cố định theo Hardhat)
ABI_PATH = os.path.join(os.path.dirname(__file__), 'artifacts', 'contracts', 'ChallengeWaveNFT.sol', 'ChallengeWaveNFT.json')

# === THÔNG TIN CẦN ĐIỀN ===
RPC_URL = "https://rpc1.olym3.xyz"  # <-- Đổi thành RPC thực tế
NFT_CONTRACT_ADDRESS = "0x6E6a3f72f31034995c863Ee70757F766B21B2458"  # <-- Địa chỉ contract NFT mới nhất
ROOM_ID = "3a57ebf5-9941-4ec2-b32e-b4fe4d29b062"  # <-- Room ID muốn kiểm tra

# ==========================

def uuid_to_bytes16(uuid_str):
    return bytes.fromhex(uuid_str.replace("-", ""))

def main():
    # Load ABI
    with open(ABI_PATH, 'r', encoding='utf-8') as f:
        artifact = json.load(f)
        abi = artifact['abi']

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    nft = w3.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=abi)
    room_bytes16 = uuid_to_bytes16(ROOM_ID)

    # Lấy tokenId từ roomId
    token_id = nft.functions.roomToNFT(room_bytes16).call()

    # Lấy thông tin NFT (winner, host, metadata...)
    info = nft.functions.getNFTInfo(token_id).call()

    # Có thể kiểm tra trực tiếp mapping winner nếu muốn
    winner = nft.functions.nftWinner(token_id).call()


if __name__ == "__main__":
    main() 