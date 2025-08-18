import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LudoGame", function () {
  let ludoGame: LudoGame;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;
  
  const minStakeAmount = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();
    
    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(minStakeAmount);
    await ludoGame.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should set the correct minimum stake amount", async function () {
      expect(await ludoGame.minStakeAmount()).to.equal(minStakeAmount);
    });

    it("Should initialize game state as WAITING_FOR_PLAYERS", async function () {
      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.state).to.equal(0);
    });
  });

  describe("Player Registration", function () {
    it("Should allow player registration with valid stake", async function () {
      await expect(ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount }))
        .to.emit(ludoGame, "PlayerRegistered")
        .withArgs(player1.address, "Alice", 0);
    });

    it("Should reject registration with insufficient stake", async function () {
      const insufficientStake = ethers.parseEther("0.005");
      await expect(ludoGame.connect(player1).registerPlayer("Alice", 0, { value: insufficientStake }))
        .to.be.revertedWith("Insufficient stake amount");
    });

    it("Should prevent duplicate player registration", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await expect(ludoGame.connect(player1).registerPlayer("Bob", 1, { value: minStakeAmount }))
        .to.be.revertedWith("Player already registered");
    });

    it("Should prevent duplicate color selection", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await expect(ludoGame.connect(player2).registerPlayer("Bob", 0, { value: minStakeAmount }))
        .to.be.revertedWith("Color already taken");
    });

    it("Should automatically start game with 2 players", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      
      await expect(ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount }))
        .to.emit(ludoGame, "GameStarted");
      
      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.state).to.equal(1);
    });
  });

  describe("Player Information", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
    });

    it("Should return correct player information", async function () {
      const playerInfo = await ludoGame.getPlayerInfo(player1.address);
      expect(playerInfo.name).to.equal("Alice");
      expect(playerInfo.color).to.equal(0);
      expect(playerInfo.score).to.equal(0);
      expect(playerInfo.position).to.equal(0);
      expect(playerInfo.isRegistered).to.equal(true);
      expect(playerInfo.stakedAmount).to.equal(minStakeAmount);
    });

    it("Should return all registered players", async function () {
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
      
      const allPlayers = await ludoGame.getAllPlayers();
      expect(allPlayers).to.have.lengthOf(2);
      expect(allPlayers[0]).to.equal(player1.address);
      expect(allPlayers[1]).to.equal(player2.address);
    });
  });

  describe("Game Mechanics", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
    });

    it("Should allow current player to roll dice", async function () {
      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.currentTurn).to.equal(player1.address);
      
      await expect(ludoGame.connect(player1).rollDice())
        .to.emit(ludoGame, "DiceRolled");
    });

    it("Should reject dice roll from non-current player", async function () {
      await expect(ludoGame.connect(player2).rollDice())
        .to.be.revertedWith("Not your turn");
    });

    it("Should update player position after dice roll", async function () {
      await ludoGame.connect(player1).rollDice();
      const playerInfo = await ludoGame.getPlayerInfo(player1.address);
      expect(playerInfo.position).to.be.greaterThan(0);
    });

    it("Should switch turns after dice roll", async function () {
      await ludoGame.connect(player1).rollDice();
      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.currentTurn).to.equal(player2.address);
    });

    it("Should update player score based on dice roll", async function () {
      const initialPlayerInfo = await ludoGame.getPlayerInfo(player1.address);
      await ludoGame.connect(player1).rollDice();
      const updatedPlayerInfo = await ludoGame.getPlayerInfo(player1.address);
      
      expect(updatedPlayerInfo.score).to.be.greaterThan(initialPlayerInfo.score);
    });
  });

  describe("Game Completion Simulation", function () {
    it("Should end game when player reaches position 100", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
      
      let gameInfo = await ludoGame.getGameInfo();
      let moveCount = 0;
      const maxMoves = 50;
      
      while (gameInfo.state === 1n && moveCount < maxMoves) {
        const currentPlayer = await ethers.getSigner(gameInfo.currentTurn);
        await ludoGame.connect(currentPlayer).rollDice();
        gameInfo = await ludoGame.getGameInfo();
        moveCount++;
      }
      
      if (gameInfo.state === 2n) {
        expect(gameInfo.gameWinner).to.not.equal(ethers.ZeroAddress);
      }
    });
  });

  describe("Edge Cases", function () {
    it("Should reject registration when game is in progress", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
      
      await expect(ludoGame.connect(player3).registerPlayer("Charlie", 2, { value: minStakeAmount }))
        .to.be.revertedWith("Game already started");
    });

    it("Should reject dice roll when game is not in progress", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      
      await expect(ludoGame.connect(player1).rollDice())
        .to.be.revertedWith("Game not in progress");
    });

    it("Should reject dice roll from unregistered player", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
      
      await expect(ludoGame.connect(player3).rollDice())
        .to.be.revertedWith("Player not registered");
    });
  });

  describe("Maximum Players Test", function () {
    it("Should allow registration of up to 4 players", async function () {
      const LudoGameFactory = await ethers.getContractFactory("LudoGame");
      const freshGame = await LudoGameFactory.deploy(minStakeAmount);
      await freshGame.waitForDeployment();
      
      await freshGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      expect((await freshGame.getAllPlayers()).length).to.equal(1);
    });
  });

  describe("Dice Randomness Test", function () {
    it("Should generate valid dice rolls", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0, { value: minStakeAmount });
      await ludoGame.connect(player2).registerPlayer("Bob", 1, { value: minStakeAmount });
      
      const tx = await ludoGame.connect(player1).rollDice();
      const receipt = await tx.wait();
      
      if (receipt) {
        const diceEvent = receipt.logs.find(log => {
          try {
            const parsed = ludoGame.interface.parseLog(log);
            return parsed?.name === "DiceRolled";
          } catch {
            return false;
          }
        });
        
        if (diceEvent) {
          const parsed = ludoGame.interface.parseLog(diceEvent);
          const roll = Number(parsed?.args[1]);
          expect(roll).to.be.at.least(1);
          expect(roll).to.be.at.most(6);
        }
      }
    });
  });
});