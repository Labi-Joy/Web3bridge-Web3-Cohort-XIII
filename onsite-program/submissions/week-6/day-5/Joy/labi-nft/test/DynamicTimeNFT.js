const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DynamicTimeNFT", function () {
  let dynamicTimeNFT;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
    dynamicTimeNFT = await DynamicTimeNFT.deploy();
    await dynamicTimeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await dynamicTimeNFT.name()).to.equal("Dynamic Time NFT");
      expect(await dynamicTimeNFT.symbol()).to.equal("DTNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT and assign to correct owner", async function () {
      const tokenId = await dynamicTimeNFT.mint(addr1.address);
      expect(await dynamicTimeNFT.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should increment token ID on multiple mints", async function () {
      await dynamicTimeNFT.mint(addr1.address);
      await dynamicTimeNFT.mint(owner.address);
      
      expect(await dynamicTimeNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await dynamicTimeNFT.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("TokenURI", function () {
    it("Should return valid tokenURI with time data", async function () {
      await dynamicTimeNFT.mint(addr1.address);
      const tokenURI = await dynamicTimeNFT.tokenURI(0);
      
      expect(tokenURI).to.include("data:application/json;base64,");
      
      // Decode and verify JSON structure
      const base64Data = tokenURI.split("data:application/json;base64,")[1];
      const jsonData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
      
      expect(jsonData.name).to.equal("Dynamic Time NFT #0");
      expect(jsonData.description).to.equal("An NFT that shows the current blockchain time");
      expect(jsonData.image).to.include("data:image/svg+xml;base64,");
    });

    it("Should fail for non-existent token", async function () {
      await expect(dynamicTimeNFT.tokenURI(999)).to.be.revertedWith("Token does not exist");
    });

    it("Should generate different SVG content over time", async function () {
      await dynamicTimeNFT.mint(addr1.address);
      
      const tokenURI1 = await dynamicTimeNFT.tokenURI(0);
      
      // Advance time by mining a new block
      await ethers.provider.send("evm_increaseTime", [60]); // 1 minute
      await ethers.provider.send("evm_mine");
      
      const tokenURI2 = await dynamicTimeNFT.tokenURI(0);
      
      // The URIs should be different due to timestamp change
      expect(tokenURI1).to.not.equal(tokenURI2);
    });
  });
});