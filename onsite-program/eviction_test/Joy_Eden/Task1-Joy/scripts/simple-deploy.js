const hre = require("hardhat");

async function main() {
  console.log("Deploying Lottery Smart Contract\n");
  
  const [deployer, ...players] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.deployed();
  
  console.log("Lottery deployed to:", lottery.address);
  
  return lottery.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports = { main };