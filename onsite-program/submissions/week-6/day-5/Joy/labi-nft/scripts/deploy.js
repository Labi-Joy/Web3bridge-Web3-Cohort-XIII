const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DynamicTimeNFT...");

  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
  const dynamicTimeNFT = await DynamicTimeNFT.deploy();
  
  await dynamicTimeNFT.waitForDeployment();
  const contractAddress = await dynamicTimeNFT.getAddress();

  console.log("DynamicTimeNFT deployed to:", contractAddress);
  console.log("Contract deployer:", (await ethers.getSigners())[0].address);
  
  // Mint first NFT to deployer
  console.log("Minting first NFT...");
  const tx = await dynamicTimeNFT.mint((await ethers.getSigners())[0].address);
  await tx.wait();
  console.log("First NFT minted with transaction:", tx.hash);
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log("Deployment completed successfully!");
    console.log("Save this contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });