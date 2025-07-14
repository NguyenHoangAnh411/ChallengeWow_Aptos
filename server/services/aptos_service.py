import os
import random
from typing import Dict, Any
from dotenv import load_dotenv
import hashlib

from aptos_sdk.account import Account
from aptos_sdk.async_client import RestClient
from aptos_sdk.transactions import (
    EntryFunction,
    TransactionPayload,
    TransactionArgument,
    RawTransaction,
    SignedTransaction,
    Authenticator,
    AccountAuthenticator,
    Ed25519Authenticator,
)
from aptos_sdk.authenticator import Authenticator, Ed25519Authenticator
from aptos_sdk.bcs import Serializer
from aptos_sdk.account_address import AccountAddress
# from aptos_sdk.ed25519 import Ed25519PublicKey

load_dotenv()

NODE_URL = os.getenv("APTOS_NODE_URL", "https://fullnode.devnet.aptoslabs.com/v1")

class AptosService:
    def __init__(self):
        self.network = os.getenv("APTOS_NETWORK", "devnet")
        self.client = RestClient(NODE_URL)

        self.admin_private_key = os.getenv("APTOS_ADMIN_PRIVATE_KEY")
        if not self.admin_private_key.startswith("0x"):
            self.admin_private_key = "0x" + self.admin_private_key

        self.admin_account = Account.load_key(self.admin_private_key)
        self.admin_address = self.admin_account.address()
        self.game_module_address = os.getenv("APTOS_GAME_MODULE_ADDRESS")

    def get_explorer_url(self, txn_hash: str) -> str:
        return f"https://explorer.aptoslabs.com/txn/{txn_hash}?network={self.network}"

    async def get_account_balance(self, address: str) -> Dict[str, Any]:
        try:
            address_obj = AccountAddress.from_str(address)
            balance = await self.client.account_balance(address_obj)
            return {"success": True, "balance": balance, "balance_apt": balance / 10**8, "address": address}
        except Exception as e:
            if "Account not found" in str(e):
                return {"success": True, "balance": 0, "balance_apt": 0, "address": address}
            return {"success": False, "error": str(e), "address": address}

    async def get_player_data(self, address: str) -> Dict[str, Any]:
        try:
            address_obj = AccountAddress.from_str(address)
            resource_type = f"{self.game_module_address}::game_module::PlayerData"
            resource = await self.client.account_resource(address_obj, resource_type)
            data = resource["data"]
            return {
                "success": True, "score": int(data["score"]), "games_played": int(data["games_played"]),
                "address": address, "initialized": True
            }
        except Exception as e:
            if "Resource not found" in str(e):
                return {"success": True, "score": 0, "games_played": 0, "address": address, "initialized": False}
            return {"success": False, "error": str(e), "address": address}

    async def _submit_transaction(self, sender: Account, payload: TransactionPayload) -> str:
        raw_txn = await self.client.create_bcs_transaction(sender, payload)

        prefix = hashlib.sha3_256(b"APTOS::RawTransaction").digest()
        serializer = Serializer()
        raw_txn.serialize(serializer)
        body = serializer.output()
        message_to_sign = prefix + body

        signature = sender.sign(message_to_sign)
        authenticator = Authenticator(Ed25519Authenticator(sender.public_key(), signature))
        signed_txn = SignedTransaction(raw_txn, authenticator)
        txn_hash = await self.client.submit_bcs_transaction(signed_txn)

        txn_result = await self.client.transaction_by_hash(txn_hash)
        if not txn_result.get("success", False):
            raise Exception(f"Transaction failed: {txn_result['vm_status']}")

        return txn_hash

    async def call_game_function(self, signer_key: str, function_name: str, args: list = []) -> Dict[str, Any]:
        try:
            if not signer_key.startswith("0x"):
                signer_key = "0x" + signer_key
            signer_account = Account.load_key(signer_key)
            payload = EntryFunction.natural(
                f"{self.game_module_address}::game_module",
                function_name, [], args
            )
            txn_hash = await self._submit_transaction(signer_account, TransactionPayload(payload))
            return {
                "success": True, "hash": txn_hash, "explorer_url": self.get_explorer_url(txn_hash)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def call_init_player(self, player_private_key: str) -> Dict[str, Any]:
        return await self.call_game_function(player_private_key, "init_player")

    async def call_submit_score(self, player_private_key: str, score: int) -> Dict[str, Any]:
        score_arg = TransactionArgument(score, Serializer.u64)
        return await self.call_game_function(player_private_key, "submit_score", [score_arg])

    async def call_init_caps_by_admin(self) -> Dict[str, Any]:
        return await self.call_game_function(self.admin_private_key, "init_caps")
    
    def serialize_bool_vector(self, bools: list[bool]) -> bytes:
        result = bytearray()
        length = len(bools)
        while True:
            byte = length & 0x7F
            length >>= 7
            if length == 0:
                result.append(byte)
                break
            else:
                result.append(byte | 0x80)
        for b in bools:
            result.append(1 if b else 0)
        return bytes(result)
    
    def serialize_uleb128(self, serializer: Serializer, value: int):
        while True:
            byte = value & 0x7F
            value >>= 7
            if value == 0:
                serializer._buffer.write(bytes([byte]))
                break
            else:
                serializer._buffer.write(bytes([byte | 0x80]))


    def encode_vector_str(self, vals: list[str]) -> bytes:
        out = bytearray()
        rem = len(vals)
        while True:
            b = rem & 0x7F
            rem >>= 7
            if rem == 0:
                out.append(b)
                break
            out.append(b | 0x80)
        for s in vals:
            tmp = Serializer()
            tmp.serialize_str(s)
            out.extend(tmp.output())
        return bytes(out)
    
    async def mint_nft_to_player(
        self,
        recipient_address: str,
        collection_name: str,
        token_name: str,
        token_description: str,
        token_uri: str
    ) -> Dict[str, Any]:
        try:
            token_name_with_suffix = f"{token_name} #{random.randint(1000, 9999)}"
            print("DEBUG mint_nft_to_player args:", {
                "admin_address": str(self.admin_address),
                "collection_name": collection_name,
                "token_name": token_name_with_suffix,
                "token_description": token_description,
                "token_uri": token_uri,
                "recipient_address": recipient_address,
                "game_module_address": self.game_module_address
            })

            recipient_bytes = AccountAddress.from_str(recipient_address).address
            print("DEBUG recipient_bytes:", recipient_bytes.hex(), len(recipient_bytes))

            # Royalty cấu hình
            ROYALTY_NUMERATOR = 0  # Không thu phí
            if ROYALTY_NUMERATOR == 0:
                ROYALTY_DENOMINATOR = 0  # ✅ PHẢI bằng 0 nếu numerator là 0
                royalty_address = AccountAddress.from_str("0x" + "0" * 64).address
            else:
                ROYALTY_DENOMINATOR = 10000
                royalty_address = self.admin_address.address

            print("DEBUG Royalty:", ROYALTY_NUMERATOR, "/", ROYALTY_DENOMINATOR)
            print("DEBUG Royalty Address:", royalty_address.hex())

            try:
                collection_payload = EntryFunction.natural(
                    "0x3::token", "create_collection_script", [], [
                        TransactionArgument(collection_name, Serializer.str),
                        TransactionArgument("Collection for " + collection_name, Serializer.str),
                        TransactionArgument(token_uri, Serializer.str),
                        TransactionArgument(1000000, Serializer.u64),
                        TransactionArgument(self.serialize_bool_vector([True, True, True]), Serializer.fixed_bytes),
                    ]
                )
                await self._submit_transaction(self.admin_account, TransactionPayload(collection_payload))
            except Exception as e:
                if "ECOLLECTION_ALREADY_EXISTS" in str(e).upper():
                    print("DEBUG: Collection already exists. Skipping.")
                else:
                    raise e

            # Tạo token (NFT)
            token_payload = EntryFunction.natural(
                "0x3::token", "create_token_script", [], [
                    TransactionArgument(collection_name, Serializer.str),
                    TransactionArgument(token_name_with_suffix, Serializer.str),
                    TransactionArgument(token_description, Serializer.str),
                    TransactionArgument(1, Serializer.u64),
                    TransactionArgument(1, Serializer.u64),
                    TransactionArgument(token_uri, Serializer.str),
                    TransactionArgument(royalty_address, Serializer.fixed_bytes),
                    TransactionArgument(ROYALTY_NUMERATOR, Serializer.u64),
                    TransactionArgument(ROYALTY_DENOMINATOR, Serializer.u64),
                    TransactionArgument(self.serialize_bool_vector([True]*5), Serializer.fixed_bytes),
                    TransactionArgument(self.encode_vector_str([]), Serializer.fixed_bytes),
                    TransactionArgument(self.encode_vector_str([]), Serializer.fixed_bytes),
                    TransactionArgument(self.encode_vector_str([]), Serializer.fixed_bytes),
                ]
            )

            await self._submit_transaction(self.admin_account, TransactionPayload(token_payload))

            offer_payload = EntryFunction.natural(
                "0x3::token_transfers", "offer_script", [], [
                    TransactionArgument(recipient_bytes, Serializer.fixed_bytes),
                    TransactionArgument(self.admin_address.address, Serializer.fixed_bytes),
                    TransactionArgument(collection_name, Serializer.str),
                    TransactionArgument(token_name_with_suffix, Serializer.str),
                    TransactionArgument(0, Serializer.u64),  # property version
                    TransactionArgument(1, Serializer.u64),  # amount
                ]
            )

            offer_hash = await self._submit_transaction(self.admin_account, TransactionPayload(offer_payload))

            return {
                "success": True,
                "message": f"Successfully minted '{token_name_with_suffix}' and offered to {recipient_address}.",
                "transaction_hash": offer_hash,
                "explorer_url": self.get_explorer_url(offer_hash)
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
