import { createPublicClient, http, parseEther, formatEther } from "viem";
import { OLYM3_TESTNET, CONTRACT_ADDRESSES } from "./constants";

// Export contract addresses for use in hooks
export { CONTRACT_ADDRESSES };

// Create public client for Olym3 Testnet
export const publicClient = createPublicClient({
  chain: OLYM3_TESTNET,
  transport: http(),
});

// Contract ABIs (simplified versions for frontend)
export const GAME_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "createRoom",
    "outputs": [{"type": "bytes32"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32"}],
    "name": "joinRoom",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32"}],
    "name": "leaveRoom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "bytes32"},
      {"type": "address"},
      {"type": "uint256"},
      {"type": "bytes32"}
    ],
    "name": "submitGameResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32"}],
    "name": "getRoom",
    "outputs": [
      {"type": "address"},
      {"type": "uint256"},
      {"type": "uint256"},
      {"type": "uint256"},
      {"type": "uint256"},
      {"type": "bool"},
      {"type": "bool"},
      {"type": "bool"},
      {"type": "address[]"},
      {"type": "address"},
      {"type": "uint256"},
      {"type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const NFT_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "address"},
      {"type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "bytes32"},
      {"type": "string"}
    ],
    "name": "mintGameNFT",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "bytes32"},
      {"type": "address"}
    ],
    "name": "transferToWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32"}],
    "name": "getNFTByRoom",
    "outputs": [
      {"type": "uint256"},
      {"type": "address"},
      {"type": "address"},
      {"type": "string"},
      {"type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "address"}],
    "name": "getNFTsByOwner",
    "outputs": [{"type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "address"}],
    "name": "getNFTsWonBy",
    "outputs": [{"type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const OLYM_TOKEN_ABI = [
  {
    "inputs": [{"type": "address"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "address"},
      {"type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Utility functions for blockchain interactions
export const blockchainUtils = {
  // Format OLYM tokens for display
  formatOLYM: (amount: bigint | string) => {
    const value = typeof amount === "string" ? BigInt(amount) : amount;
    return formatEther(value);
  },

  // Parse OLYM tokens from string
  parseOLYM: (amount: string) => {
    return parseEther(amount);
  },

  // Get current block number
  getCurrentBlock: async () => {
    return await publicClient.getBlockNumber();
  },

  // Get balance of an address
  getBalance: async (address: string) => {
    return await publicClient.getBalance({ address: address as `0x${string}` });
  },

  // Get OLYM token balance
  getOLYMBalance: async (address: string) => {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.OLYM_TOKEN as `0x${string}`,
      abi: OLYM_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
  },

  // Get transaction count (nonce) for an address
  getTransactionCount: async (address: string) => {
    return await publicClient.getTransactionCount({ address: address as `0x${string}` });
  },

  // Wait for transaction confirmation
  waitForTransaction: async (hash: string) => {
    return await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
  },

  // Get transaction details
  getTransaction: async (hash: string) => {
    return await publicClient.getTransaction({ hash: hash as `0x${string}` });
  },

  // Get transaction receipt
  getTransactionReceipt: async (hash: string) => {
    return await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` });
  },
};

// Contract interaction helpers
export const contractHelpers = {
  // Create a new game room
  createRoom: async (
    walletClient: any,
    maxPlayers: number,
    entryFee: string
  ) => {
    const [account] = await walletClient.getAddresses();
    
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'createRoom',
      args: [BigInt(maxPlayers), parseEther(entryFee)],
      value: parseEther(entryFee),
    });
    
    return hash;
  },

  // Join a game room
  joinRoom: async (
    walletClient: any,
    roomId: string,
    entryFee: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'joinRoom',
      args: [roomId as `0x${string}`],
      value: parseEther(entryFee),
    });
    
    return hash;
  },

  // Leave a game room
  leaveRoom: async (
    walletClient: any,
    roomId: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'leaveRoom',
      args: [roomId as `0x${string}`],
    });
    
    return hash;
  },

  // Submit game result (only owner/backend can call)
  submitGameResult: async (
    walletClient: any,
    roomId: string,
    winner: string,
    score: number,
    zkProof: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'submitGameResult',
      args: [roomId as `0x${string}`, winner as `0x${string}`, BigInt(score), zkProof as `0x${string}`],
    });
    
    return hash;
  },

  // Claim reward
  claimReward: async (
    walletClient: any,
    roomId: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'claimReward',
      args: [roomId as `0x${string}`],
    });
    
    return hash;
  },

  // Get room information
  getRoom: async (roomId: string) => {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.GAME_CONTRACT as `0x${string}`,
      abi: GAME_CONTRACT_ABI,
      functionName: 'getRoom',
      args: [roomId as `0x${string}`],
    });
  },

  // Mint NFT for game room (only owner can call)
  mintGameNFT: async (
    walletClient: any,
    roomId: string,
    tokenURI: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mintGameNFT',
      args: [roomId as `0x${string}`, tokenURI],
      value: parseEther("0.01"), // Mint price
    });
    
    return hash;
  },

  // Transfer NFT to winner (only game contract can call)
  transferNFTToWinner: async (
    walletClient: any,
    roomId: string,
    winner: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'transferToWinner',
      args: [roomId as `0x${string}`, winner as `0x${string}`],
    });
    
    return hash;
  },

  // Get NFT by room
  getNFTByRoom: async (roomId: string) => {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'getNFTByRoom',
      args: [roomId as `0x${string}`],
    });
  },

  // Get NFTs by owner
  getNFTsByOwner: async (ownerAddress: string) => {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'getNFTsByOwner',
      args: [ownerAddress as `0x${string}`],
    });
  },

  // Get NFTs won by address
  getNFTsWonBy: async (winnerAddress: string) => {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'getNFTsWonBy',
      args: [winnerAddress as `0x${string}`],
    });
  },

  // Transfer OLYM tokens
  transferOLYM: async (
    walletClient: any,
    to: string,
    amount: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.OLYM_TOKEN as `0x${string}`,
      abi: OLYM_TOKEN_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, parseEther(amount)],
    });
    
    return hash;
  },

  // Burn OLYM tokens
  burnOLYM: async (
    walletClient: any,
    amount: string
  ) => {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.OLYM_TOKEN as `0x${string}`,
      abi: OLYM_TOKEN_ABI,
      functionName: 'burn',
      args: [parseEther(amount)],
    });
    
    return hash;
  },

  // Mint NFT (simple mint function)
  mintNFT: async (walletClient: any) => {
    const [account] = await walletClient.getAddresses();
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mint',
      args: [account],
    });
    
    return hash;
  },

  // Transfer NFT
  transferNFT: async (
    walletClient: any,
    to: string,
    tokenId: number
  ) => {
    const [account] = await walletClient.getAddresses();
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'transferFrom',
      args: [account, to as `0x${string}`, BigInt(tokenId)],
    });
    
    return hash;
  },

  // Get NFT balance
  getNFTBalance: async (address: string) => {
    const balance = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.NFT_CONTRACT as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    
    return balance.toString();
  },

  // Get OLYM balance
  getOLYMBalance: async (address: string) => {
    const balance = await blockchainUtils.getOLYMBalance(address);
    return blockchainUtils.formatOLYM(balance);
  },

  // Get native balance
  getNativeBalance: async (address: string) => {
    const balance = await blockchainUtils.getBalance(address);
    return blockchainUtils.formatOLYM(balance);
  },
};

// Network status helpers
export const networkHelpers = {
  // Check if connected to Olym3 Testnet
  isOnOlym3Testnet: (chainId: number) => {
    return chainId === OLYM3_TESTNET.id;
  },

  // Get network info
  getNetworkInfo: () => {
    return {
      name: OLYM3_TESTNET.name,
      chainId: OLYM3_TESTNET.id,
      currency: OLYM3_TESTNET.nativeCurrency,
      explorer: OLYM3_TESTNET.blockExplorers.default.url,
      rpcUrl: OLYM3_TESTNET.rpcUrls.default.http[0],
    };
  },

  // Get explorer URL for transaction
  getExplorerUrl: (hash: string) => {
    return `${OLYM3_TESTNET.blockExplorers.default.url}/tx/${hash}`;
  },

  // Get explorer URL for address
  getAddressExplorerUrl: (address: string) => {
    return `${OLYM3_TESTNET.blockExplorers.default.url}/address/${address}`;
  },
}; 