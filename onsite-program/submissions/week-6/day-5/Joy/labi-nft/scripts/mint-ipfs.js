const { ethers } = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
  
  // Replace with your IPFS metadata hash from Pinata
  const ipfsMetadataHash = "YOUR_IPFS_METADATA_HASH_HERE";
  
  // Replace with recipient address (or use deployer)
  const recipientAddress = (await ethers.getSigners())[0].address;

  console.log("Minting NFT with IPFS metadata...");
  console.log("Contract:", contractAddress);
  console.log("IPFS Hash:", ipfsMetadataHash);
  console.log("Recipient:", recipientAddress);

  const IPFSTimeNFT = await ethers.getContractFactory("IPFSTimeNFT");
  const contract = IPFSTimeNFT.attach(contractAddress);

  try {
    const tx = await contract.mint(recipientAddress, ipfsMetadataHash);
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ NFT minted successfully!");
    
    // Get the token ID from the transfer event
    const transferEvent = receipt.logs.find(log => 
      log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    
    if (transferEvent) {
      const tokenId = parseInt(transferEvent.topics[3], 16);
      console.log("Token ID:", tokenId);
      
      // Get the token URI
      const tokenURI = await contract.tokenURI(tokenId);
      console.log("Token URI:", tokenURI);
      console.log("\n🎨 View your NFT at:", tokenURI);
    }
    
  } catch (error) {
    console.error("❌ Minting failed:", error);
    
    if (error.message.includes("YOUR_CONTRACT_ADDRESS_HERE")) {
      console.log("\n📋 Instructions:");
      console.log("1. Deploy contract first: npm run deploy:ipfs");
      console.log("2. Update contractAddress in this script");
      console.log("3. Update ipfsMetadataHash with your Pinata hash");
      console.log("4. Run this script again");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });