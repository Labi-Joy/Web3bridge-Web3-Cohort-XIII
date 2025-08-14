import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const LOOT_BOX_PRICE = ethers.parseEther("0.1");

  console.log("\nDeploying mock contracts for testing...");

  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const mockVRFCoordinator = await MockVRFCoordinator.deploy();
  await mockVRFCoordinator.waitForDeployment();
  console.log("MockVRFCoordinator deployed to:", await mockVRFCoordinator.getAddress());

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Reward Token", "REWARD", ethers.parseEther("10000"));
  await mockERC20.waitForDeployment();
  console.log("MockERC20 deployed to:", await mockERC20.getAddress());

  const MockERC721 = await ethers.getContractFactory("MockERC721");
  const mockERC721 = await MockERC721.deploy("Reward NFT", "RNFT");
  await mockERC721.waitForDeployment();
  console.log("MockERC721 deployed to:", await mockERC721.getAddress());

  const MockERC1155 = await ethers.getContractFactory("MockERC1155");
  const mockERC1155 = await MockERC1155.deploy("https://api.example.com/metadata/{id}");
  await mockERC1155.waitForDeployment();
  console.log("MockERC1155 deployed to:", await mockERC1155.getAddress());

  console.log("\nDeploying LootBox contract...");

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    await mockVRFCoordinator.getAddress(),
    SUBSCRIPTION_ID,
    KEY_HASH,
    LOOT_BOX_PRICE
  );
  await lootBox.waitForDeployment();
  
  console.log("LootBox deployed to:", await lootBox.getAddress());

  console.log("\nSetting up rewards...");

  await mockERC20.transfer(await lootBox.getAddress(), ethers.parseEther("1000"));
  console.log("Transferred 1000 REWARD tokens to LootBox");

  for (let i = 1; i <= 5; i++) {
    await mockERC721.mintTokenId(await lootBox.getAddress(), i);
  }
  console.log("Minted NFTs with IDs 1-5 to LootBox");

  await mockERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");
  await mockERC1155.mint(await lootBox.getAddress(), 2, 50, "0x");
  console.log("Minted ERC1155 tokens to LootBox");

  console.log("\nAdding rewards to LootBox...");

  await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
  console.log("Added ERC20 reward: 10 tokens, weight 50");

  await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("50"), 20);
  console.log("Added ERC20 reward: 50 tokens, weight 20");

  await lootBox.addReward(1, await mockERC721.getAddress(), 1, 1, 15);
  console.log("Added ERC721 reward: NFT #1, weight 15");

  await lootBox.addReward(1, await mockERC721.getAddress(), 2, 1, 10);
  console.log("Added ERC721 reward: NFT #2, weight 10");

  await lootBox.addReward(2, await mockERC1155.getAddress(), 1, 5, 25);
  console.log("Added ERC1155 reward: 5 tokens of ID 1, weight 25");

  await lootBox.addReward(2, await mockERC1155.getAddress(), 2, 3, 30);
  console.log("Added ERC1155 reward: 3 tokens of ID 2, weight 30");

  console.log("\nDeployment completed!");
  console.log("\nContract addresses:");
  console.log("LootBox:", await lootBox.getAddress());
  console.log("MockVRFCoordinator:", await mockVRFCoordinator.getAddress());
  console.log("MockERC20:", await mockERC20.getAddress());
  console.log("MockERC721:", await mockERC721.getAddress());
  console.log("MockERC1155:", await mockERC1155.getAddress());

  console.log("\nLootBox configuration:");
  console.log("Price per loot box:", ethers.formatEther(LOOT_BOX_PRICE), "ETH");
  console.log("Total rewards:", await lootBox.totalRewards());
  console.log("Total weight:", await lootBox.totalWeight());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });