require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Olym3 Testnet
    "olym3-testnet": {
      url: "https://rpc1.olym3.xyz",
      chainId: 256000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 2100000,
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Hardhat network
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      "olym3-testnet": process.env.OLYM3_API_KEY || "dummy", // Replace with actual API key if available
    },
    customChains: [
      {
        network: "olym3-testnet",
        chainId: 256000,
        urls: {
          apiURL: "https://explorer.olym3.xyz/api",
          browserURL: "https://explorer.olym3.xyz",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Exclude node_modules from compilation
  mocha: {
    timeout: 40000,
  },
}; 