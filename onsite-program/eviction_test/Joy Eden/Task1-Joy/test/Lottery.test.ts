import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery", function () {
  let lottery: any;
  let players: HardhatEthersSigner[];
  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    players = signers;
    
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("Entry Requirements", function () {
    it("Should allow entry with exact fee", async function () {
      await expect(lottery.connect(players[0]).enter({ value: ENTRY_FEE }))
        .to.not.be.reverted;
      
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(players[0].address);
    });

    it("Should reject entry with incorrect fee", async function () {
      await expect(lottery.connect(players[0]).enter({ value: ethers.parseEther("0.02") }))
        .to.be.revertedWith("Incorrect entry fee");
      
      await expect(lottery.connect(players[0]).enter({ value: ethers.parseEther("0.005") }))
        .to.be.revertedWith("Incorrect entry fee");
    });

    it("Should prevent double entry in same round", async function () {
      await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
      
      await expect(lottery.connect(players[0]).enter({ value: ENTRY_FEE }))
        .to.be.revertedWith("Already entered this round");
    });

    it("Should emit PlayerJoined event", async function () {
      await expect(lottery.connect(players[0]).enter({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 0);
    });
  });

  describe("Player Tracking", function () {
    it("Should correctly track multiple players", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(await lottery.players(i)).to.equal(players[i].address);
        expect(await lottery.hasEntered(players[i].address)).to.be.true;
      }
    });

    it("Should return correct players list", async function () {
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(3);
      expect(playersList[0]).to.equal(players[0].address);
      expect(playersList[1]).to.equal(players[1].address);
      expect(playersList[2]).to.equal(players[2].address);
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner after 10 players", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      expect(await lottery.winner()).to.equal(ethers.ZeroAddress);
      
      await expect(lottery.connect(players[9]).enter({ value: ENTRY_FEE }))
        .to.emit(lottery, "WinnerSelected");
      
      const winner = await lottery.winner();
      expect(winner).to.not.equal(ethers.ZeroAddress);
    });

    it("Should transfer entire prize pool to winner", async function () {
      const initialBalances: { [key: string]: bigint } = {};
      
      for (let i = 0; i < 10; i++) {
        initialBalances[players[i].address] = await ethers.provider.getBalance(players[i].address);
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      const winner = await lottery.winner();
      const finalBalance = await ethers.provider.getBalance(winner);
      
      expect(finalBalance).to.be.gt(initialBalances[winner]);
      expect(await lottery.getPrizePool()).to.equal(0);
    });

    it("Should prevent entry when lottery is full", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      await expect(lottery.connect(players[10]).enter({ value: ENTRY_FEE }))
        .to.be.revertedWith("Lottery is full");
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset after selecting winner", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.round()).to.equal(1);
      
      for (let i = 0; i < 10; i++) {
        expect(await lottery.hasEntered(players[i].address)).to.be.false;
      }
    });

    it("Should allow same players to enter new round", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(players[0].address);
    });

    it("Should emit LotteryReset event", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      await expect(lottery.connect(players[9]).enter({ value: ENTRY_FEE }))
        .to.emit(lottery, "LotteryReset")
        .withArgs(1);
    });
  });

  describe("View Functions", function () {
    it("Should return correct prize pool", async function () {
      expect(await lottery.getPrizePool()).to.equal(0);
      
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE * 5n);
    });

    it("Should track rounds correctly", async function () {
      expect(await lottery.round()).to.equal(0);
      
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }
      
      expect(await lottery.round()).to.equal(1);
    });
  });
});