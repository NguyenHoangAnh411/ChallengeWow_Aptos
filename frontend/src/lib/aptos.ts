import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  UserTransactionResponse,
  MoveValue,
  Hex,
  PrivateKey,
  InputEntryFunctionData,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";

// Aptos Network Configuration
export const APTOS_NETWORKS = {
  devnet: { name: "Devnet", network: Network.DEVNET, explorerUrl: "https://explorer.aptoslabs.com" },
  testnet: { name: "Testnet", network: Network.TESTNET, explorerUrl: "https://explorer.aptoslabs.com" },
  mainnet: { name: "Mainnet", network: Network.MAINNET, explorerUrl: "https://explorer.aptoslabs.com" },
};

// Contract Configuration
export const APTOS_CONTRACT_CONFIG = {
  MODULE_ADDRESS: "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335",
  MODULE_NAME: "game_module",
  GAME_MODULE: "0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335::game_module",
};

// Initialize Aptos Client
export const createAptosClient = (network: Network = Network.DEVNET) => {
  const aptosConfig = new AptosConfig({ network });
  return new Aptos(aptosConfig);
};

// Game Module Functions
export class GameModuleClient {
  private aptos: Aptos;
  private adminAccount: Account;
  public account?: Account;

  constructor(network: Network = Network.DEVNET, adminPrivateKey: string) {
    this.aptos = createAptosClient(network);
    this.adminAccount = aptosUtils.createAccountFromPrivateKey(adminPrivateKey);
  }

  setAccount(account: Account) {
    this.account = account;
  }

  async initPlayer() {
    if (!this.account) throw new Error("Account not set");
    const payload: InputEntryFunctionData = {
      function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::init_player`,
      functionArguments: [],
    };
    const txnRequest = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payload,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.account, transaction: txnRequest });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return { hash: response.hash };
  }

  async submitScore(score: number) {
    if (!this.account) throw new Error("Account not set");
    const payload: InputEntryFunctionData = {
      function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::submit_score`,
      functionArguments: [score], // SDK tự xử lý `toString()`
    };
    const txnRequest = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payload,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.account, transaction: txnRequest });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return { hash: response.hash };
  }

  async getScore(address: string): Promise<number> {
    const resource = await this.aptos.getAccountResource({
      accountAddress: address,
      resourceType: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::PlayerData`,
    });
    if (resource) {
      return parseInt((resource as any).data.score);
    }
    return 0;
  }

  async getGamesPlayed(address: string): Promise<number> {
    const resource = await this.aptos.getAccountResource({
      accountAddress: address,
      resourceType: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::PlayerData`,
    });
    if (resource) {
      return parseInt((resource as any).data.games_played);
    }
    return 0;
  }

  async initToken() {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.adminAccount.accountAddress,
      data: {
        function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::init_caps`,
        functionArguments: [],
      } as InputEntryFunctionData,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.adminAccount, transaction });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return response;
  }

  async mintTokens(to: string, amount: number) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.adminAccount.accountAddress,
      data: {
        function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::mint_tokens`,
        functionArguments: [to, amount],
      } as InputEntryFunctionData,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.adminAccount, transaction });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return response;
  }

  async sendReward(receiver: string, amount: number) {
    if (!this.account) throw new Error("Account not set");
    const payload: InputEntryFunctionData = {
      function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::send_reward`,
      functionArguments: [receiver, amount.toString()],
    };
    const txnRequest = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payload,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.account, transaction: txnRequest });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return { hash: response.hash };
  }

  async burnTokens(amount: number) {
    if (!this.account) throw new Error("Account not set");
    const payload: InputEntryFunctionData = {
      function: `${APTOS_CONTRACT_CONFIG.MODULE_ADDRESS}::${APTOS_CONTRACT_CONFIG.MODULE_NAME}::burn_tokens`,
      functionArguments: [amount.toString()],
    };
    const txnRequest = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: payload,
    });
    const response = await this.aptos.signAndSubmitTransaction({ signer: this.account, transaction: txnRequest });
    await this.aptos.waitForTransaction({ transactionHash: response.hash });
    return { hash: response.hash };
  }

  async getTokenBalance(address: string): Promise<number> {
    try {
      const resource = await this.aptos.getAccountResource({
        accountAddress: address,
        resourceType: "0x1::coin::CoinStore<0x16433aded23efef052959ed158b1ac6a725ab8df3f531166bb46207e4c38b335::game_module::MyToken>",
      });
      if (resource) {
        return parseInt((resource as any).data.coin.value);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getAccountBalance(): Promise<number> {
    if (!this.account) throw new Error("Account not set");
    try {
      const resource = await this.aptos.getAccountResource({
        accountAddress: this.account.accountAddress.toString(),
        resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      });
      if (resource) {
        return parseInt((resource as any).data.coin.value);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getAccountInfo(address: string) {
    return await this.aptos.account.getAccountInfo({ accountAddress: address });
  }

  async getTransaction(hash: string) {
    return await this.aptos.getTransactionByHash({ transactionHash: hash });
  }

  getExplorerUrl(hash: string, network: keyof typeof APTOS_NETWORKS = "devnet") {
    const config = APTOS_NETWORKS[network];
    return `${config.explorerUrl}/txn/${hash}?network=${network}`;
  }
}

// Utility functions
export const aptosUtils = {
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  },

  createAccountFromPrivateKey: (privateKeyHex: string): Account => {
    let hex = privateKeyHex;
    if (hex.startsWith('ed25519-priv-')) {
      hex = hex.replace('ed25519-priv-', '');
    }
    if (hex.startsWith('0x')) {
      hex = hex.slice(2);
    }
    const privKey = new Ed25519PrivateKey(hex);
    return Account.fromPrivateKey({ privateKey: privKey });
  },

  generateAccount: (): Account => {
    return Account.generate();
  },

  formatAPT: (octa: number | null | undefined): string => {
    if (!octa) return '0.0000';
    return (Number(octa) / 1e8).toFixed(4);
  },
};

// Lấy số dư APT bằng SDK mới
export async function getBalanceWithSdk(address: string): Promise<number | null> {
  const aptos = createAptosClient(Network.DEVNET);
  try {
    // getAccountAPTAmount trả về một bigint, cần chuyển thành number
    const amount = await aptos.getAccountAPTAmount({ accountAddress: address });
    // **SỬA LỖI QUAN TRỌNG:** Trả về OCTA (giá trị gốc), không chia ở đây.
    return Number(amount);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Resource not found")) {
      return 0; // Tài khoản chưa được khởi tạo, số dư là 0
    }
    console.error("Không thể lấy số dư ví:", error);
    return null;
  }
}

const ADMIN_PRIVATE_KEY = 'ed25519-priv-0x6cd07e57a2a22f71af3c121d1d917bcd377f97652171a2048dc74f71f4937208';
export const aptosClient = new GameModuleClient(Network.DEVNET, ADMIN_PRIVATE_KEY);