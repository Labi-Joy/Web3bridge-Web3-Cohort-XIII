const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying IPFSTimeNFT...");

  const IPFSTimeNFT = await ethers.getContractFactory("IPFSTimeNFT");
  const ipfsTimeNFT = await IPFSTimeNFT.deploy();
  
  await ipfsTimeNFT.waitForDeployment();
  const contractAddress = await ipfsTimeNFT.getAddress();

  console.log("IPFSTimeNFT deployed to:", contractAddress);
  console.log("Contract deployer:", (await ethers.getSigners())[0].address);
  
  // Example: Mint NFT with IPFS hash (replace with your actual hash)
  const exampleIPFSHash = "QmYourIPFSHashHere";
  console.log(`\nTo mint an NFT with your IPFS hash, run:`);
  console.log(`npx hardhat run scripts/mint-ipfs.js --network localhost`);
  console.log(`\nOr call: ipfsTimeNFT.mint("${(await ethers.getSigners())[0].address}", "${exampleIPFSHash}")`);
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📝 Save this contract address:", address);
    console.log("\n📋 Next Steps:");
    console.log("1. Upload your image to Pinata using upload-to-pinata.html");
    console.log("2. Get the IPFS metadata hash");
    console.log("3. Use the mint function with your IPFS hash");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });