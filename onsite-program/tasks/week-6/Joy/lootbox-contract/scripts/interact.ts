import hre, { ethers } from "hardhat";

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("Interaction script starting...");
  console.log("Deployer address:", deployer.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);

  const lootBoxAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const mockVRFAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const mockERC20Address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const mockERC721Address = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const mockERC1155Address = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = LootBox.attach(lootBoxAddress);

  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const mockVRF = MockVRFCoordinator.attach(mockVRFAddress);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = MockERC20.attach(mockERC20Address);

  const MockERC721 = await ethers.getContractFactory("MockERC721");
  const mockERC721 = MockERC721.attach(mockERC721Address);

  const MockERC1155 = await ethers.getContractFactory("MockERC1155");
  const mockERC1155 = MockERC1155.attach(mockERC1155Address);

  console.log("\n=== Contract Information ===");
  console.log("LootBox owner:", await lootBox.owner());
  console.log("Loot box price:", ethers.formatEther(await lootBox.lootBoxPrice()), "ETH");
  console.log("Total rewards:", await lootBox.totalRewards());
  console.log("Total weight:", await lootBox.totalWeight());

  console.log("\n=== Active Rewards ===");
  const activeRewardIds = await lootBox.getActiveRewardIds();
  for (const rewardId of activeRewardIds) {
    const reward = await lootBox.getReward(rewardId);
    const rewardTypes = ["ERC20", "ERC721", "ERC1155"];
    console.log(`Reward ${rewardId}: ${rewardTypes[reward.rewardType]} - ${reward.tokenAddress} - Amount: ${reward.amount} - Weight: ${reward.weight}`);
  }

  console.log("\n=== Initial Balances ===");
  console.log("User1 ETH balance:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
  console.log("User1 ERC20 balance:", await mockERC20.balanceOf(user1.address));
  console.log("User2 ETH balance:", ethers.formatEther(await ethers.provider.getBalance(user2.address)));
  console.log("User2 ERC20 balance:", await mockERC20.balanceOf(user2.address));

  console.log("\n=== User1 Opening Loot Box ===");
  const lootBoxPrice = await lootBox.lootBoxPrice();
  
  let tx = await lootBox.connect(user1).openLootBox({ value: lootBoxPrice });
  let receipt = await tx.wait();
  
  let requestEvent = receipt!.logs.find(log => {
    try {
      const parsed = lootBox.interface.parseLog({ topics: log.topics as string[], data: log.data });
      return parsed?.name === "RandomnessRequested";
    } catch {
      return false;
    }
  });
  
  let parsedEvent = lootBox.interface.parseLog({ topics: requestEvent!.topics as string[], data: requestEvent!.data });
  let requestId = parsedEvent!.args[0];
  console.log("Request ID:", requestId);

  console.log("Fulfilling random words with value 25 (should hit ERC20 reward)...");
  await mockVRF.fulfillRandomWords(requestId, [25]);

  console.log("User1 ERC20 balance after opening loot box:", await mockERC20.balanceOf(user1.address));

  console.log("\n=== User2 Opening Loot Box ===");
  tx = await lootBox.connect(user2).openLootBox({ value: lootBoxPrice });
  receipt = await tx.wait();
  
  requestEvent = receipt!.logs.find(log => {
    try {
      const parsed = lootBox.interface.parseLog({ topics: log.topics as string[], data: log.data });
      return parsed?.name === "RandomnessRequested";
    } catch {
      return false;
    }
  });
  
  parsedEvent = lootBox.interface.parseLog({ topics: requestEvent!.topics as string[], data: requestEvent!.data });
  requestId = parsedEvent!.args[0];
  console.log("Request ID:", requestId);

  console.log("Fulfilling random words with value 75 (should hit ERC721 reward)...");
  await mockVRF.fulfillRandomWords(requestId, [75]);

  try {
    const owner = await mockERC721.ownerOf(1);
    console.log("Owner of NFT #1:", owner);
    if (owner === user2.address) {
      console.log("User2 successfully received NFT #1!");
    }
  } catch (error) {
    console.log("NFT #1 may have been transferred or doesn't exist");
  }

  console.log("\n=== Admin Functions Demo ===");
  
  console.log("Current loot box price:", ethers.formatEther(await lootBox.lootBoxPrice()), "ETH");
  
  console.log("Updating loot box price to 0.2 ETH...");
  await lootBox.updateLootBoxPrice(ethers.parseEther("0.2"));
  console.log("New loot box price:", ethers.formatEther(await lootBox.lootBoxPrice()), "ETH");

  console.log("Adding new ERC20 reward...");
  await lootBox.addReward(0, mockERC20Address, 0, ethers.parseEther("100"), 40);
  console.log("New total rewards:", await lootBox.totalRewards());
  console.log("New total weight:", await lootBox.totalWeight());

  console.log("Removing reward ID 0...");
  await lootBox.removeReward(0);
  console.log("Updated total weight:", await lootBox.totalWeight());

  console.log("\n=== Final Active Rewards ===");
  const finalActiveRewardIds = await lootBox.getActiveRewardIds();
  for (const rewardId of finalActiveRewardIds) {
    const reward = await lootBox.getReward(rewardId);
    const rewardTypes = ["ERC20", "ERC721", "ERC1155"];
    console.log(`Reward ${rewardId}: ${rewardTypes[reward.rewardType]} - ${reward.tokenAddress} - Amount: ${reward.amount} - Weight: ${reward.weight}`);
  }

  console.log("\n=== Contract Balances ===");
  console.log("LootBox ETH balance:", ethers.formatEther(await ethers.provider.getBalance(lootBoxAddress)), "ETH");
  console.log("LootBox ERC20 balance:", await mockERC20.balanceOf(lootBoxAddress));

  console.log("\n=== Withdraw Demo ===");
  console.log("Withdrawing ETH to owner...");
  await lootBox.withdraw();
  console.log("LootBox ETH balance after withdrawal:", ethers.formatEther(await ethers.provider.getBalance(lootBoxAddress)), "ETH");

  console.log("Withdrawing some ERC20 tokens to owner...");
  await lootBox.withdrawToken(mockERC20Address, ethers.parseEther("100"));
  console.log("LootBox ERC20 balance after token withdrawal:", await mockERC20.balanceOf(lootBoxAddress));

  console.log("\n=== Interaction Demo Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });