import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

type LootBox = any;
type MockVRFCoordinator = any;
type MockERC20 = any;
type MockERC721 = any;
type MockERC1155 = any;

describe("LootBox", function () {
  let lootBox: LootBox;
  let mockVRFCoordinator: MockVRFCoordinator;
  let mockERC20: MockERC20;
  let mockERC721: MockERC721;
  let mockERC1155: MockERC1155;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let otherUser: SignerWithAddress;

  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef";
  const LOOT_BOX_PRICE = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
    mockVRFCoordinator = await MockVRFCoordinator.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy("Test Token", "TEST", ethers.parseEther("1000"));

    const MockERC721 = await ethers.getContractFactory("MockERC721");
    mockERC721 = await MockERC721.deploy("Test NFT", "TNFT");

    const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    mockERC1155 = await MockERC1155.deploy("https://test.com/{id}");

    const LootBox = await ethers.getContractFactory("LootBox");
    lootBox = await LootBox.deploy(
      await mockVRFCoordinator.getAddress(),
      SUBSCRIPTION_ID,
      KEY_HASH,
      LOOT_BOX_PRICE
    );

    await mockERC20.transfer(await lootBox.getAddress(), ethers.parseEther("100"));
    await mockERC721.mintTokenId(await lootBox.getAddress(), 1);
    await mockERC1155.mint(await lootBox.getAddress(), 1, 10, "0x");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lootBox.owner()).to.equal(owner.address);
    });

    it("Should set the correct loot box price", async function () {
      expect(await lootBox.lootBoxPrice()).to.equal(LOOT_BOX_PRICE);
    });

    it("Should initialize with zero rewards", async function () {
      expect(await lootBox.totalRewards()).to.equal(0);
      expect(await lootBox.totalWeight()).to.equal(0);
    });
  });

  describe("Reward Management", function () {
    it("Should allow owner to add ERC20 reward", async function () {
      await expect(
        lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50)
      ).to.emit(lootBox, "RewardAdded")
        .withArgs(0, 0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);

      expect(await lootBox.totalRewards()).to.equal(1);
      expect(await lootBox.totalWeight()).to.equal(50);

      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(0);
      expect(reward.tokenAddress).to.equal(await mockERC20.getAddress());
      expect(reward.amount).to.equal(ethers.parseEther("10"));
      expect(reward.weight).to.equal(50);
      expect(reward.active).to.be.true;
    });

    it("Should allow owner to add ERC721 reward", async function () {
      await expect(
        lootBox.addReward(1, await mockERC721.getAddress(), 1, 1, 30)
      ).to.emit(lootBox, "RewardAdded")
        .withArgs(0, 1, await mockERC721.getAddress(), 1, 1, 30);

      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(1);
      expect(reward.tokenId).to.equal(1);
    });

    it("Should allow owner to add ERC1155 reward", async function () {
      await expect(
        lootBox.addReward(2, await mockERC1155.getAddress(), 1, 5, 20)
      ).to.emit(lootBox, "RewardAdded")
        .withArgs(0, 2, await mockERC1155.getAddress(), 1, 5, 20);

      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(2);
      expect(reward.tokenId).to.equal(1);
      expect(reward.amount).to.equal(5);
    });

    it("Should not allow non-owner to add rewards", async function () {
      await expect(
        lootBox.connect(user).addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50)
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });

    it("Should revert when adding reward with zero weight", async function () {
      await expect(
        lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 0)
      ).to.be.revertedWith("Weight must be greater than 0");
    });

    it("Should revert when adding reward with zero address", async function () {
      await expect(
        lootBox.addReward(0, ethers.ZeroAddress, 0, ethers.parseEther("10"), 50)
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should allow owner to remove rewards", async function () {
      await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
      
      await expect(lootBox.removeReward(0))
        .to.emit(lootBox, "RewardRemoved")
        .withArgs(0);

      expect(await lootBox.totalWeight()).to.equal(0);
      const reward = await lootBox.getReward(0);
      expect(reward.active).to.be.false;
    });

    it("Should revert when removing invalid reward ID", async function () {
      await expect(lootBox.removeReward(0)).to.be.revertedWith("Invalid reward ID");
    });

    it("Should revert when removing already inactive reward", async function () {
      await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
      await lootBox.removeReward(0);
      
      await expect(lootBox.removeReward(0)).to.be.revertedWith("Reward already inactive");
    });

    it("Should return active reward IDs", async function () {
      await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
      await lootBox.addReward(1, await mockERC721.getAddress(), 1, 1, 30);
      await lootBox.addReward(2, await mockERC1155.getAddress(), 1, 5, 20);
      
      await lootBox.removeReward(1);
      
      const activeIds = await lootBox.getActiveRewardIds();
      expect(activeIds).to.have.length(2);
      expect(activeIds[0]).to.equal(0);
      expect(activeIds[1]).to.equal(2);
    });
  });

  describe("Loot Box Opening", function () {
    beforeEach(async function () {
      await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
      await lootBox.addReward(1, await mockERC721.getAddress(), 1, 1, 30);
      await lootBox.addReward(2, await mockERC1155.getAddress(), 1, 5, 20);
    });

    it("Should allow user to open loot box with correct payment", async function () {
      await expect(lootBox.connect(user).openLootBox({ value: LOOT_BOX_PRICE }))
        .to.emit(lootBox, "LootBoxOpened")
        .and.to.emit(lootBox, "RandomnessRequested");
    });

    it("Should revert if payment is insufficient", async function () {
      await expect(
        lootBox.connect(user).openLootBox({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if no rewards are available", async function () {
      const emptyLootBox = await ethers.getContractFactory("LootBox");
      const empty = await emptyLootBox.deploy(
        await mockVRFCoordinator.getAddress(),
        SUBSCRIPTION_ID,
        KEY_HASH,
        LOOT_BOX_PRICE
      );

      await expect(
        empty.connect(user).openLootBox({ value: LOOT_BOX_PRICE })
      ).to.be.revertedWith("No rewards available");
    });

    it("Should refund excess payment", async function () {
      const excessAmount = ethers.parseEther("0.2");
      const balanceBefore = await ethers.provider.getBalance(user.address);
      
      const tx = await lootBox.connect(user).openLootBox({ value: excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(user.address);
      const expectedBalance = balanceBefore - LOOT_BOX_PRICE - gasUsed;
      
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });

    it("Should fulfill random words and grant ERC20 reward", async function () {
      const tx = await lootBox.connect(user).openLootBox({ value: LOOT_BOX_PRICE });
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          const parsed = lootBox.interface.parseLog({ topics: log.topics as string[], data: log.data });
          return parsed?.name === "RandomnessRequested";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = lootBox.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
      const requestId = parsedEvent!.args[0];

      await expect(
        mockVRFCoordinator.fulfillRandomWords(requestId, [0])
      ).to.emit(lootBox, "RewardGranted");

      expect(await mockERC20.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should fulfill random words and grant ERC721 reward", async function () {
      const tx = await lootBox.connect(user).openLootBox({ value: LOOT_BOX_PRICE });
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          const parsed = lootBox.interface.parseLog({ topics: log.topics as string[], data: log.data });
          return parsed?.name === "RandomnessRequested";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = lootBox.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
      const requestId = parsedEvent!.args[0];

      await expect(
        mockVRFCoordinator.fulfillRandomWords(requestId, [51])
      ).to.emit(lootBox, "RewardGranted");

      expect(await mockERC721.ownerOf(1)).to.equal(user.address);
    });

    it("Should fulfill random words and grant ERC1155 reward", async function () {
      const tx = await lootBox.connect(user).openLootBox({ value: LOOT_BOX_PRICE });
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          const parsed = lootBox.interface.parseLog({ topics: log.topics as string[], data: log.data });
          return parsed?.name === "RandomnessRequested";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = lootBox.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
      const requestId = parsedEvent!.args[0];

      await expect(
        mockVRFCoordinator.fulfillRandomWords(requestId, [81])
      ).to.emit(lootBox, "RewardGranted");

      expect(await mockERC1155.balanceOf(user.address, 1)).to.equal(5);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update loot box price", async function () {
      const newPrice = ethers.parseEther("0.2");
      
      await expect(lootBox.updateLootBoxPrice(newPrice))
        .to.emit(lootBox, "LootBoxPriceUpdated")
        .withArgs(newPrice);

      expect(await lootBox.lootBoxPrice()).to.equal(newPrice);
    });

    it("Should not allow non-owner to update loot box price", async function () {
      await expect(
        lootBox.connect(user).updateLootBoxPrice(ethers.parseEther("0.2"))
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update VRF settings", async function () {
      await lootBox.updateVRFSettings(2, KEY_HASH, 200000, 5);
    });

    it("Should not allow non-owner to update VRF settings", async function () {
      await expect(
        lootBox.connect(user).updateVRFSettings(2, KEY_HASH, 200000, 5)
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw ETH", async function () {
      await lootBox.connect(user).openLootBox({ value: LOOT_BOX_PRICE });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await lootBox.getAddress());
      
      const tx = await lootBox.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + contractBalance - gasUsed);
    });

    it("Should allow owner to withdraw tokens", async function () {
      const amount = ethers.parseEther("50");
      
      await lootBox.withdrawToken(await mockERC20.getAddress(), amount);
      
      expect(await mockERC20.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(lootBox.connect(user).withdraw()).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
      await expect(
        lootBox.connect(user).withdrawToken(await mockERC20.getAddress(), ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should revert when getting invalid reward ID", async function () {
      await expect(lootBox.getReward(0)).to.be.revertedWith("Invalid reward ID");
    });

    it("Should return empty array for active reward IDs when no rewards exist", async function () {
      const activeIds = await lootBox.getActiveRewardIds();
      expect(activeIds).to.have.length(0);
    });
  });

  describe("Token Reception", function () {
    it("Should properly implement ERC721 receiver", async function () {
      expect(
        await lootBox.onERC721Received(owner.address, owner.address, 1, "0x")
      ).to.equal("0x150b7a02");
    });

    it("Should properly implement ERC1155 receiver", async function () {
      expect(
        await lootBox.onERC1155Received(owner.address, owner.address, 1, 1, "0x")
      ).to.equal("0xf23a6e61");
    });

    it("Should properly implement ERC1155 batch receiver", async function () {
      expect(
        await lootBox.onERC1155BatchReceived(owner.address, owner.address, [1], [1], "0x")
      ).to.equal("0xbc197c81");
    });
  });
});