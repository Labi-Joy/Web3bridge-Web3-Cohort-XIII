import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20 Token", function () {
  async function deployToken() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();
    
    const TOKEN_NAME = "MyToken";
    const TOKEN_SYMBOL = "MTK";
    const TOKEN_DECIMALS = 18;
    const INITIAL_SUPPLY = hre.ethers.parseEther("1000000"); // 1 million tokens
    
    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token = await ERC20.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY);

    // Cast token to any to avoid TypeScript errors for custom methods
    const typedToken = token as any;
    
    return { token: typedToken, owner, addr1, addr2, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY };
  }

  describe("Deployment", function () {
    it("Should set the right token name", async function () {
      const { token, TOKEN_NAME } = await loadFixture(deployToken);
      expect(await token.name()).to.equal(TOKEN_NAME);
    });

    it("Should set the right token symbol", async function () {
      const { token, TOKEN_SYMBOL } = await loadFixture(deployToken);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the right decimals", async function () {
      const { token, TOKEN_DECIMALS } = await loadFixture(deployToken);
      expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("Should set the right total supply", async function () {
      const { token, INITIAL_SUPPLY } = await loadFixture(deployToken);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should assign total supply to owner", async function () {
      const { token, owner, INITIAL_SUPPLY } = await loadFixture(deployToken);
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployToken);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Basic Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");
      
      await token.transfer(addr1.address, transferAmount);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");
      
      await expect(
        token.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail when transferring to zero address", async function () {
      const { token } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");
      
      await expect(
        token.transfer(hre.ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("Transfer to zero address");
    });
  });

  describe("Approvals", function () {
    it("Should approve tokens for spending", async function () {
      const { token, owner, addr1 } = await loadFixture(deployToken);
      const approveAmount = hre.ethers.parseEther("200");
      
      await token.approve(addr1.address, approveAmount);
      const allowance = await token.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(approveAmount);
    });

    it("Should fail when approving zero address", async function () {
      const { token } = await loadFixture(deployToken);
      const approveAmount = hre.ethers.parseEther("100");
      
      await expect(
        token.approve(hre.ethers.ZeroAddress, approveAmount)
      ).to.be.revertedWith("Approve to zero address");
    });
  });

  describe("TransferFrom", function () {
    it("Should allow approved transfers", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployToken);
      const approveAmount = hre.ethers.parseEther("200");
      const transferAmount = hre.ethers.parseEther("100");

      // Owner approves addr1 to spend tokens
      await token.approve(addr1.address, approveAmount);
      // addr1 transfers from owner to addr2
      await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if allowance is insufficient", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Insufficient allowance");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { token, addr1, INITIAL_SUPPLY } = await loadFixture(deployToken);
      const mintAmount = hre.ethers.parseEther("500");

      await token.mint(addr1.address, mintAmount);
      
      const addr1Balance = await token.balanceOf(addr1.address);
      const newTotalSupply = await token.totalSupply();
      
      expect(addr1Balance).to.equal(mintAmount);
      expect(newTotalSupply).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployToken);
      const mintAmount = hre.ethers.parseEther("500");

      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should fail when minting to zero address", async function () {
      const { token } = await loadFixture(deployToken);
      const mintAmount = hre.ethers.parseEther("500");

      await expect(
        token.mint(hre.ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Mint to zero address");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn tokens", async function () {
      const { token, owner, INITIAL_SUPPLY } = await loadFixture(deployToken);
      const burnAmount = hre.ethers.parseEther("1000");

      await token.burn(owner.address, burnAmount);
      
      const ownerBalance = await token.balanceOf(owner.address);
      const newTotalSupply = await token.totalSupply();
      
      expect(ownerBalance).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(newTotalSupply).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should fail if non-owner tries to burn", async function () {
      const { token, owner, addr1 } = await loadFixture(deployToken);
      const burnAmount = hre.ethers.parseEther("100");

      await expect(
        token.connect(addr1).burn(owner.address, burnAmount)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should fail when burning more than balance", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      const burnAmount = hre.ethers.parseEther("100");

      await expect(
        token.burn(addr1.address, burnAmount)
      ).to.be.revertedWith("Insufficient balance to burn");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      
      await token.transferOwnership(addr1.address);
      const newOwner = await token.owner();
      expect(newOwner).to.equal(addr1.address);
    });

    it("Should fail if non-owner tries to transfer ownership", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployToken);

      await expect(
        token.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should renounce ownership", async function () {
      const { token } = await loadFixture(deployToken);
      
      await token.renounceOwnership();
      const owner = await token.owner();
      expect(owner).to.equal(hre.ethers.ZeroAddress);
    });
  });

  describe("Balance Checks", function () {
    it("Should return correct balance for owner", async function () {
      const { token, owner, INITIAL_SUPPLY } = await loadFixture(deployToken);
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(INITIAL_SUPPLY);
    });

    it("Should return zero balance for new address", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(0);
    });
  });
});