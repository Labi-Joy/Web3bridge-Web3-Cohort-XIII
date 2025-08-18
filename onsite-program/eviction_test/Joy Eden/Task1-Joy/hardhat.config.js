require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // Ethereum Mainnet
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gasPrice: parseInt(process.env.GAS_PRICE || "20000000000"),
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: parseInt(process.env.GAS_PRICE || "20000000000"),
    },
    // Polygon Mainnet
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: parseInt(process.env.GAS_PRICE || "50000000000"),
    },
    // Polygon Mumbai Testnet
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: parseInt(process.env.GAS_PRICE || "50000000000"),
    },
    // BSC Mainnet
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
      accounts: [PRIVATE_KEY],
      chainId: 56,
      gasPrice: parseInt(process.env.GAS_PRICE || "10000000000"),
    },
    // BSC Testnet
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [PRIVATE_KEY],
      chainId: 97,
      gasPrice: parseInt(process.env.GAS_PRICE || "10000000000"),
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};