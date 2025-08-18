const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log(`Deploying Lottery contract to ${network.name}...`);
  console.log("Network chain ID:", network.config.chainId);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("Deployer account has no funds!");
  }
  
  console.log("\nDeploying Lottery contract...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  
  const lottery = await LotteryFactory.deploy({
    gasLimit: process.env.GAS_LIMIT || 8000000,
  });
  
  await lottery.waitForDeployment();
  const contractAddress = await lottery.getAddress();
  
  console.log("Lottery contract deployed to:", contractAddress);
  console.log("Transaction hash:", lottery.deploymentTransaction().hash);
  
  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await lottery.deploymentTransaction().wait(5);
  console.log("Contract confirmed!");
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: lottery.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    blockNumber: lottery.deploymentTransaction().blockNumber,
  };
  
  const filename = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${filename}`);
  
  // Verify contract info
  console.log("\nContract Info:");
  console.log("Entry Fee:", ethers.formatEther(await lottery.ENTRY_FEE()), "ETH");
  console.log("Max Players:", (await lottery.MAX_PLAYERS()).toString());
  console.log("Current Round:", (await lottery.round()).toString());
  console.log("Current Players:", (await lottery.getPlayerCount()).toString());
  
  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  
  return contractAddress;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };