import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      forking: {
        url: "https://ethereum.publicnode.com",
        blockNumber: 18500000
      }
    }
  }
};

export default config;