const { run, network } = require("hardhat");

async function verify(contractAddress, constructorArguments = []) {
  console.log(`Verifying contract on ${network.name}...`);
  console.log("Contract address:", contractAddress);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Verification failed:");
      console.error(error.message);
      throw error;
    }
  }
}

async function main() {
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.error("Please provide contract address as argument:");
    console.error("npx hardhat run scripts/verify-contract.js --network <network> <contract_address>");
    process.exit(1);
  }
  
  console.log("Verifying Lottery contract...");
  console.log("Network:", network.name);
  console.log("Contract Address:", contractAddress);
  
  // Lottery contract has no constructor arguments
  await verify(contractAddress, []);
  
  console.log("Verification completed!");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { verify };