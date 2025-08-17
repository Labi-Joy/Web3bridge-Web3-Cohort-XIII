const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IPFSTimeNFT", function () {
  let ipfsTimeNFT;
  let owner;
  let addr1;
  let addr2;

  const sampleIPFSHash = "QmYourSampleHashHere123456789";
  const sampleIPFSHash2 = "QmAnotherSampleHashHere987654321";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const IPFSTimeNFT = await ethers.getContractFactory("IPFSTimeNFT");
    ipfsTimeNFT = await IPFSTimeNFT.deploy();
    await ipfsTimeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await ipfsTimeNFT.name()).to.equal("IPFS Time NFT");
      expect(await ipfsTimeNFT.symbol()).to.equal("ITNFT");
    });

    it("Should set the right owner", async function () {
      expect(await ipfsTimeNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct base URI", async function () {
      expect(await ipfsTimeNFT.getBaseURI()).to.equal("https://gateway.pinata.cloud/ipfs/");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT with IPFS hash", async function () {
      await ipfsTimeNFT.mint(addr1.address, sampleIPFSHash);
      
      expect(await ipfsTimeNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await ipfsTimeNFT.totalSupply()).to.equal(1);
    });

    it("Should return correct tokenURI", async function () {
      await ipfsTimeNFT.mint(addr1.address, sampleIPFSHash);
      
      const expectedURI = `https://gateway.pinata.cloud/ipfs/${sampleIPFSHash}`;
      expect(await ipfsTimeNFT.tokenURI(0)).to.equal(expectedURI);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        ipfsTimeNFT.connect(addr1).mint(addr2.address, sampleIPFSHash)
      ).to.be.revertedWithCustomError(ipfsTimeNFT, "OwnableUnauthorizedAccount");
    });

    it("Should mint multiple NFTs in batch", async function () {
      const hashes = [sampleIPFSHash, sampleIPFSHash2];
      const tokenIds = await ipfsTimeNFT.mintBatch(addr1.address, hashes);
      
      expect(await ipfsTimeNFT.totalSupply()).to.equal(2);
      expect(await ipfsTimeNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await ipfsTimeNFT.ownerOf(1)).to.equal(addr1.address);
    });
  });

  describe("Token URI Management", function () {
    beforeEach(async function () {
      await ipfsTimeNFT.mint(addr1.address, sampleIPFSHash);
    });

    it("Should update token URI", async function () {
      await ipfsTimeNFT.setTokenURI(0, sampleIPFSHash2);
      
      const expectedURI = `https://gateway.pinata.cloud/ipfs/${sampleIPFSHash2}`;
      expect(await ipfsTimeNFT.tokenURI(0)).to.equal(expectedURI);
    });

    it("Should update base URI", async function () {
      const newBaseURI = "https://ipfs.io/ipfs/";
      await ipfsTimeNFT.setBaseURI(newBaseURI);
      
      expect(await ipfsTimeNFT.getBaseURI()).to.equal(newBaseURI);
      
      const expectedURI = `${newBaseURI}${sampleIPFSHash}`;
      expect(await ipfsTimeNFT.tokenURI(0)).to.equal(expectedURI);
    });

    it("Should fail for non-existent token", async function () {
      await expect(ipfsTimeNFT.tokenURI(999)).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set token URI", async function () {
      await ipfsTimeNFT.mint(addr1.address, sampleIPFSHash);
      
      await expect(
        ipfsTimeNFT.connect(addr1).setTokenURI(0, sampleIPFSHash2)
      ).to.be.revertedWithCustomError(ipfsTimeNFT, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set base URI", async function () {
      await expect(
        ipfsTimeNFT.connect(addr1).setBaseURI("https://example.com/")
      ).to.be.revertedWithCustomError(ipfsTimeNFT, "OwnableUnauthorizedAccount");
    });
  });
});