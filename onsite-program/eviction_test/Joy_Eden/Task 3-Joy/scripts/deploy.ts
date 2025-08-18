import { ethers } from "hardhat";

async function main() {
  const minStakeAmount = ethers.parseEther("0.01");

  console.log("Deploying LudoGame contract...");
  console.log("Minimum stake amount:", ethers.formatEther(minStakeAmount), "ETH");

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(minStakeAmount);

  await ludoGame.waitForDeployment();

  const contractAddress = await ludoGame.getAddress();
  console.log("LudoGame deployed to:", contractAddress);

  const deployedMinStake = await ludoGame.minStakeAmount();
  console.log("Deployed contract minimum stake:", ethers.formatEther(deployedMinStake), "ETH");

  return {
    address: contractAddress,
    minStakeAmount: deployedMinStake
  };
}

main()
  .then((result) => {
    console.log("\n🎯 Deployment successful!");
    console.log("Contract Address:", result.address);
    console.log("Minimum Stake Amount:", ethers.formatEther(result.minStakeAmount), "ETH");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });