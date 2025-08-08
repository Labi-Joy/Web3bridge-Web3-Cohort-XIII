import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSig } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MultiSig Contract", function () {
  let multiSig: MultiSig;
  let owner1: HardhatEthersSigner;
  let owner2: HardhatEthersSigner;
  let owner3: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();

    const MultiSigFactory = await ethers.getContractFactory("MultiSig");
    multiSig = await MultiSigFactory.deploy(
      [owner1.address, owner2.address, owner3.address],
      2 // require 2 out of 3 confirmations
    );
  });

  describe("Deployment", function () {
    it("should set owners correctly", async function () {
      expect(await multiSig.owners(0)).to.equal(owner1.address);
      expect(await multiSig.owners(1)).to.equal(owner2.address);
      expect(await multiSig.owners(2)).to.equal(owner3.address);
    });

    it("should set required confirmations correctly", async function () {
      expect(await multiSig.required()).to.equal(2);
    });

    it("should initialize transaction count to zero", async function () {
      expect(await multiSig.txCount()).to.equal(0);
    });
  });

  describe("Owner Management", function () {
    it("should identify owners correctly", async function () {
      expect(await multiSig.isOwner(owner1.address)).to.be.true;
      expect(await multiSig.isOwner(owner2.address)).to.be.true;
      expect(await multiSig.isOwner(owner3.address)).to.be.true;
      expect(await multiSig.isOwner(nonOwner.address)).to.be.false;
    });
  });

  describe("Transaction Creation", function () {
    it("should allow owners to add transactions", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      await expect(
        multiSig.connect(owner1).addTx(recipient.address, value, data)
      ).to.not.be.reverted;

      expect(await multiSig.txCount()).to.equal(1);
    });

    it("should not allow non-owners to add transactions", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      await expect(
        multiSig.connect(nonOwner).addTx(recipient.address, value, data)
      ).to.be.revertedWith("Not an owner");
    });

    it("should return correct transaction ID", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      const tx = await multiSig
        .connect(owner1)
        .addTx(recipient.address, value, data);
      const receipt = await tx.wait();

      // First transaction should have ID 0
      expect(await multiSig.txCount()).to.equal(1);
    });
  });

  describe("Transaction Confirmation", function () {
    beforeEach(async function () {
      // add ETH to the contract

      await owner1.sendTransaction({
        to: await multiSig.getAddress(),
        value: ethers.parseEther("5"),
      });

      const data = "0x"; // add a transaction
      const value = ethers.parseEther("1");
      await multiSig.connect(owner1).addTx(recipient.address, value, data);
    });

    it("should allow owners to confirm transactions", async function () {
      await expect(multiSig.connect(owner1).confirmTx(0)).to.not.be.reverted;

      expect(await multiSig.confirmedtxs(0, owner1.address)).to.be.true;
    });

    it("should not allow non-owners to confirm transactions", async function () {
      await expect(multiSig.connect(nonOwner).confirmTx(0)).to.be.revertedWith(
        "Not an owner"
      );
    });

    it("should not allow double confirmation by same owner", async function () {
      await multiSig.connect(owner1).confirmTx(0);

      await expect(multiSig.connect(owner1).confirmTx(0)).to.be.revertedWith(
        "Transaction already confirmed by sender"
      );
    });

    it("should count confirmations correctly", async function () {
      await multiSig.connect(owner1).confirmTx(0);
      expect(await multiSig.getConfirmedtxCount(0)).to.equal(1);

      await multiSig.connect(owner2).confirmTx(0);
      expect(await multiSig.getConfirmedtxCount(0)).to.equal(2);
    });
  });

  describe("Transaction Execution", function () {
    beforeEach(async function () {
      await owner1.sendTransaction({
        // adds ETH to the contract
        to: await multiSig.getAddress(),
        value: ethers.parseEther("5"),
      });
    });

    it("should execute transaction when enough confirmations reached", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      await multiSig.connect(owner1).addTx(recipient.address, value, data); // adds transaction

      const initialBalance = await ethers.provider.getBalance(
        recipient.address
      );

      await multiSig.connect(owner1).confirmTx(0); // first confirmation (not enough yet)
      const tx = await multiSig.txs(0);
      expect(tx.executed).to.be.false;

      await multiSig.connect(owner2).confirmTx(0); // second confirmation (should trigger execution)

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      const txAfter = await multiSig.txs(0);

      expect(txAfter.executed).to.be.true;
      expect(finalBalance - initialBalance).to.equal(value);
    });

    it("should not execute transaction without enough confirmations", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      await multiSig.connect(owner1).addTx(recipient.address, value, data);
      await multiSig.connect(owner1).confirmTx(0);

      const tx = await multiSig.txs(0);
      expect(tx.executed).to.be.false;
    });

    it("should not allow double execution", async function () {
      const data = "0x";
      const value = ethers.parseEther("1");

      await multiSig.connect(owner1).addTx(recipient.address, value, data);
      await multiSig.connect(owner1).confirmTx(0);
      await multiSig.connect(owner2).confirmTx(0);

      await expect(
        //try to execute again manually
        multiSig.connect(owner3).executeTx(0)
      ).to.be.revertedWith("Transaction already executed");
    });
  });

  describe("Contract Balance", function () {
    it("should receive ETH correctly", async function () {
      const value = ethers.parseEther("2");

      await owner1.sendTransaction({
        to: await multiSig.getAddress(),
        value: value,
      });

      const balance = await ethers.provider.getBalance(
        await multiSig.getAddress()
      );
      expect(balance).to.equal(value);
    });
  });

  describe("Edge Cases", function () {
    it("should handle non-existent transaction confirmation", async function () {
      await expect(multiSig.connect(owner1).confirmTx(999)).to.be.revertedWith(
        "Transaction does not exist"
      );
    });

    it("should check if transaction is confirmed correctly", async function () {
     
      await owner1.sendTransaction({   //the contract has to be funded first
        to: await multiSig.getAddress(),
        value: ethers.parseEther("5"),
      });

      const data = "0x";
      const value = ethers.parseEther("1");

      await multiSig.connect(owner1).addTx(recipient.address, value, data);

      expect(await multiSig.isConfirmed(0)).to.be.false;

      await multiSig.connect(owner1).confirmTx(0);
      expect(await multiSig.isConfirmed(0)).to.be.false; // still needs 1 more

      await multiSig.connect(owner2).confirmTx(0);
      expect(await multiSig.isConfirmed(0)).to.be.true;
    });
  });
});
