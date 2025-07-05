import os
import uuid
from web3 import Web3
from dotenv import load_dotenv
import json

load_dotenv()

OLYM3_RPC_URL = os.getenv("OLYM3_RPC_URL", "https://rpc1.olym3.xyz")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
NFT_CONTRACT_ADDRESS = os.getenv("NFT_CONTRACT_ADDRESS")
GAME_CONTRACT_ADDRESS = os.getenv("GAME_CONTRACT_ADDRESS")

# Load ABI from artifact files
with open(os.path.join(os.path.dirname(__file__), '../../artifacts/contracts/contracts/ChallengeWaveNFT.sol/ChallengeWaveNFT.json'), 'r') as f:
    NFT_CONTRACT_ABI = json.load(f)["abi"]

with open(os.path.join(os.path.dirname(__file__), '../../artifacts/contracts/contracts/ChallengeWaveGame.sol/ChallengeWaveGame.json'), 'r') as f:
    GAME_CONTRACT_ABI = json.load(f)["abi"]

class BlockchainService:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(OLYM3_RPC_URL))
        self.account = self.web3.eth.account.from_key(PRIVATE_KEY)
        self.nft_contract = self.web3.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=NFT_CONTRACT_ABI)
        self.game_contract = self.web3.eth.contract(address=GAME_CONTRACT_ADDRESS, abi=GAME_CONTRACT_ABI)

    def _convert_uuid_to_bytes16(self, room_id: str) -> bytes:
        """Convert UUID string to bytes16 for smart contract"""
        try:
            # Remove hyphens if present and convert to bytes16
            uuid_str = room_id.replace('-', '')
            if len(uuid_str) != 32:
                raise ValueError("Invalid UUID format")
            result = bytes.fromhex(uuid_str)
            print(f"DEBUG: Converting UUID '{room_id}' to bytes16: {result.hex()}")
            return result
        except Exception as e:
            raise ValueError(f"Invalid UUID format: {room_id}. Error: {str(e)}")

    def mint_nft(self, room_id: str, metadata_uri: str) -> dict:
        """Mint NFT for a room (deployer becomes owner)"""
        nonce = self.web3.eth.get_transaction_count(self.account.address)
        room_id_bytes = self._convert_uuid_to_bytes16(room_id)

        txn = self.nft_contract.functions.mintGameNFT(room_id_bytes, metadata_uri).build_transaction({
            'from': self.account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': self.web3.eth.gas_price,
            'value': self.web3.to_wei(0.01, 'ether'),
        })

        signed_txn = self.web3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
        raw_tx = getattr(signed_txn, 'rawTransaction', None) or getattr(signed_txn, 'raw_transaction', None)
        if raw_tx is None and isinstance(signed_txn, dict):
            raw_tx = signed_txn.get('rawTransaction') or signed_txn.get('raw_transaction')
        if raw_tx is None:
            raise Exception(f"Cannot find rawTransaction in signed_txn: {signed_txn}")
        tx_hash = self.web3.eth.send_raw_transaction(raw_tx)
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Convert receipt to dict for JSON serialization
        return {
            'transactionHash': receipt['transactionHash'].hex(),
            'blockNumber': receipt['blockNumber'],
            'gasUsed': receipt['gasUsed'],
            'status': receipt['status'],
            'room_id': room_id,
            'metadata_uri': metadata_uri
        }

    def submit_game_result(self, room_id: str, winner_address: str, score: int, zk_proof: str) -> dict:
        """Submit game result and transfer NFT to winner via Game contract"""
        nonce = self.web3.eth.get_transaction_count(self.account.address)
        room_id_bytes = self._convert_uuid_to_bytes16(room_id)
        zk_proof_bytes = bytes.fromhex(zk_proof[2:]) if zk_proof.startswith('0x') else self.web3.keccak(text=zk_proof)

        print(f"DEBUG: Submitting game result for room {room_id}")
        print(f"DEBUG: Room ID bytes: {room_id_bytes.hex()}")
        print(f"DEBUG: Winner address: {winner_address}")
        print(f"DEBUG: Score: {score}")
        print(f"DEBUG: ZK Proof: {zk_proof_bytes.hex()}")

        # Gọi Game contract để submit game result và transfer NFT
        txn = self.game_contract.functions.submitGameResult(
            room_id_bytes, winner_address, score, zk_proof_bytes
        ).build_transaction({
            'from': self.account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': self.web3.eth.gas_price,
        })

        signed_txn = self.web3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
        raw_tx = getattr(signed_txn, 'rawTransaction', None) or getattr(signed_txn, 'raw_transaction', None)
        if raw_tx is None and isinstance(signed_txn, dict):
            raw_tx = signed_txn.get('rawTransaction') or signed_txn.get('raw_transaction')
        if raw_tx is None:
            raise Exception(f"Cannot find rawTransaction in signed_txn: {signed_txn}")
        tx_hash = self.web3.eth.send_raw_transaction(raw_tx)
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"DEBUG: Transaction successful: {receipt['transactionHash'].hex()}")
        
        # Convert receipt to dict for JSON serialization
        return {
            'transactionHash': receipt['transactionHash'].hex(),
            'blockNumber': receipt['blockNumber'],
            'gasUsed': receipt['gasUsed'],
            'status': receipt['status'],
            'room_id': room_id,
            'winner_address': winner_address,
            'score': score
        }

    def get_nft_by_room(self, room_id: str):
        """Get NFT information by room ID"""
        room_id_bytes = self._convert_uuid_to_bytes16(room_id)
        return self.nft_contract.functions.getNFTByRoom(room_id_bytes).call()
