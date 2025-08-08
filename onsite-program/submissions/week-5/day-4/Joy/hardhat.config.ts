import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";
require("dotenv").config()

const {LISK_SEPOLIA_URL} = process.env;

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.30",

  networks: {
    'lisk-sepolia': {
      url: LISK_SEPOLIA_URL,
      accounts: [PRIVATE_KEY as string],
      gasPrice: 1000000000,
      timeout: 600000,
    },
  },

  etherscan: {
    apiKey: {
      "lisk-sepolia": "123"
    },
    customChains: [
      {
          network: "lisk-sepolia",
          chainId: 4202,
          urls: {
              apiURL: "https://sepolia-blockscout.lisk.com/api",
              browserURL: "https://sepolia-blockscout.lisk.com"
          }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
};

export default config;