const { ethers } = require("hardhat");

async function main() {
  console.log("Lottery Smart Contract Deployment & Interaction\n");
  
  const [deployer, ...players] = await ethers.getSigners();
  const ENTRY_FEE = ethers.parseEther("0.01");
  
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
  
  console.log("Deploying Lottery contract...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();
  
  const contractAddress = await lottery.getAddress();
  console.log("Lottery deployed to:", contractAddress);
  console.log("Round:", (await lottery.round()).toString(), "\n");
  
  console.log("Starting first lottery round...");
  console.log("Adding 10 players to the lottery:");
  
  const initialBalances = {};
  
  for (let i = 0; i < 10; i++) {
    const player = players[i];
    initialBalances[player.address] = await ethers.provider.getBalance(player.address);
    
    console.log(`   Player ${i + 1}: ${player.address}`);
    
    const tx = await lottery.connect(player).enter({ value: ENTRY_FEE });
    await tx.wait();
    
    const playerCount = await lottery.getPlayerCount();
    const prizePool = await lottery.getPrizePool();
    
    console.log(`   Entered! Players: ${playerCount.toString()}/10, Prize Pool: ${ethers.formatEther(prizePool)} ETH`);
    
    if (Number(playerCount) === 0) {
      console.log("   Lottery automatically triggered!");
      break;
    }
  }
  
  console.log("\nFirst Round Results:");
  const winner1 = await lottery.lastWinner();
  const round1 = await lottery.round();
  
  console.log("Winner:", winner1);
  console.log("Current Round:", round1.toString());
  console.log("Players in new round:", (await lottery.getPlayerCount()).toString());
  
  const winnerBalance = await ethers.provider.getBalance(winner1);
  const balanceIncrease = winnerBalance - initialBalances[winner1];
  console.log("Winner's balance increase:", ethers.formatEther(balanceIncrease), "ETH");
  
  console.log("\nStarting second lottery round to test reset...");
  
  const secondRoundBalances = {};
  
  for (let i = 0; i < 10; i++) {
    const player = players[i + 10] || players[i];
    secondRoundBalances[player.address] = await ethers.provider.getBalance(player.address);
    
    console.log(`   Player ${i + 1}: ${player.address}`);
    
    const tx = await lottery.connect(player).enter({ value: ENTRY_FEE });
    await tx.wait();
    
    const playerCount = await lottery.getPlayerCount();
    
    console.log(`   Entered! Players: ${playerCount.toString()}/10`);
    
    if (Number(playerCount) === 0) {
      console.log("   Second lottery completed!");
      break;
    }
  }
  
  console.log("\nSecond Round Results:");
  const winner2 = await lottery.lastWinner();
  const round2 = await lottery.round();
  
  console.log("Winner:", winner2);
  console.log("Current Round:", round2.toString());
  console.log("Players in new round:", (await lottery.getPlayerCount()).toString());
  
  const winner2Balance = await ethers.provider.getBalance(winner2);
  const balance2Increase = winner2Balance - secondRoundBalances[winner2];
  console.log("Winner's balance increase:", ethers.formatEther(balance2Increase), "ETH");
  
  console.log("\nDeployment and interaction completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Final Round:", (await lottery.round()).toString());
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports = { main };