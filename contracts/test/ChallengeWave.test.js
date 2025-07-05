const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Challenge Wave Contracts", function () {
  let olymToken, gameContract;
  let owner, player1, player2, player3, player4;
  let roomId;

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy OLYM Token
    const OLYMToken = await ethers.getContractFactory("OLYMToken");
    olymToken = await OLYMToken.deploy();

    // Deploy Game Contract
    const ChallengeWaveGame = await ethers.getContractFactory("ChallengeWaveGame");
    gameContract = await ChallengeWaveGame.deploy();

    // Set up contract relationships
    await olymToken.setGameContract(await gameContract.getAddress());

    // Mint tokens to players for testing
    const mintAmount = ethers.parseEther("1000");
    await olymToken.mint(player1.address, mintAmount);
    await olymToken.mint(player2.address, mintAmount);
    await olymToken.mint(player3.address, mintAmount);
    await olymToken.mint(player4.address, mintAmount);
  });

  describe("OLYM Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await olymToken.name()).to.equal("OLYM Token");
      expect(await olymToken.symbol()).to.equal("OLYM");
    });

    it("Should have correct initial supply", async function () {
      const initialSupply = ethers.parseEther("1000000"); // 1 million
      expect(await olymToken.totalSupply()).to.equal(initialSupply);
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("100");
      await olymToken.mint(player1.address, mintAmount);
      expect(await olymToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("1100") // 1000 + 100
      );
    });

    it("Should allow game contract to mint rewards", async function () {
      const rewardAmount = ethers.parseEther("50");
      await olymToken.mintGameReward(player1.address, rewardAmount);
      expect(await olymToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("1050") // 1000 + 50
      );
    });

    it("Should not allow non-owner to mint", async function () {
      const mintAmount = ethers.parseEther("100");
      await expect(
        olymToken.connect(player1).mint(player2.address, mintAmount)
      ).to.be.revertedWithCustomError(olymToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow burning tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await olymToken.connect(player1).burn(burnAmount);
      expect(await olymToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("900") // 1000 - 100
      );
    });
  });

  describe("Challenge Wave Game", function () {
    const entryFee = ethers.parseEther("10");

    it("Should create a room successfully", async function () {
      const tx = await gameContract.connect(player1).createRoom(4, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();

      // Find RoomCreated event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      expect(event).to.not.be.undefined;

      const roomId = event.args[0];
      const room = await gameContract.getRoom(roomId);
      expect(room.creator).to.equal(player1.address);
      expect(room.maxPlayers).to.equal(4);
      expect(room.entryFee).to.equal(entryFee);
      expect(room.isActive).to.be.true;
    });

    it("Should allow players to join a room", async function () {
      // Create room
      const tx = await gameContract.connect(player1).createRoom(4, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      // Join room
      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      const room = await gameContract.getRoom(roomId);
      expect(room.players).to.include(player2.address);
      expect(await gameContract.isPlayerInRoom(roomId, player2.address)).to.be.true;
    });

    it("Should start game when enough players join", async function () {
      // Create room
      const tx = await gameContract.connect(player1).createRoom(2, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      // Join with second player (should auto-start)
      const joinTx = await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });
      const joinReceipt = await joinTx.wait();

      // Check for GameStarted event
      const gameStartedEvent = joinReceipt.logs.find(
        (log) => log.fragment && log.fragment.name === "GameStarted"
      );
      expect(gameStartedEvent).to.not.be.undefined;

      const room = await gameContract.getRoom(roomId);
      expect(room.isStarted).to.be.true;
    });

    it("Should not allow joining a full room", async function () {
      // Create room with 2 players max
      const tx = await gameContract.connect(player1).createRoom(2, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      // Join with second player
      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Try to join with third player
      await expect(
        gameContract.connect(player3).joinRoom(roomId, {
          value: entryFee,
        })
      ).to.be.revertedWith("Room is full");
    });

    it("Should allow leaving room before game starts", async function () {
      // Create room
      const tx = await gameContract.connect(player1).createRoom(4, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      // Join with second player
      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Leave room
      const initialBalance = await ethers.provider.getBalance(player2.address);
      await gameContract.connect(player2).leaveRoom(roomId);
      const finalBalance = await ethers.provider.getBalance(player2.address);

      expect(finalBalance).to.be.gt(initialBalance); // Should receive refund
      expect(await gameContract.isPlayerInRoom(roomId, player2.address)).to.be.false;
    });

    it("Should submit game result correctly", async function () {
      // Create and start a game
      const tx = await gameContract.connect(player1).createRoom(2, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Submit game result
      const zkProof = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));
      await gameContract.submitGameResult(roomId, player1.address, 100, zkProof);

      const room = await gameContract.getRoom(roomId);
      expect(room.isEnded).to.be.true;
      expect(room.winner).to.equal(player1.address);
      expect(room.winnerScore).to.equal(100);
      expect(room.zkProof).to.equal(zkProof);
    });

    it("Should allow winner to claim rewards", async function () {
      // Create and start a game
      const tx = await gameContract.connect(player1).createRoom(2, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Submit game result
      const zkProof = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));
      await gameContract.submitGameResult(roomId, player1.address, 100, zkProof);

      // Claim rewards
      const initialBalance = await ethers.provider.getBalance(player1.address);
      await gameContract.connect(player1).claimRewards(roomId);
      const finalBalance = await ethers.provider.getBalance(player1.address);

      expect(finalBalance).to.be.gt(initialBalance); // Should receive reward
    });

    it("Should not allow non-winner to claim rewards", async function () {
      // Create and start a game
      const tx = await gameContract.connect(player1).createRoom(2, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Submit game result
      const zkProof = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));
      await gameContract.submitGameResult(roomId, player1.address, 100, zkProof);

      // Try to claim rewards as non-winner
      await expect(
        gameContract.connect(player2).claimRewards(roomId)
      ).to.be.revertedWith("Not the winner");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete game flow", async function () {
      const entryFee = ethers.parseEther("5");

      // Create room
      const tx = await gameContract.connect(player1).createRoom(3, entryFee, {
        value: entryFee,
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "RoomCreated"
      );
      roomId = event.args[0];

      // Join with second player
      await gameContract.connect(player2).joinRoom(roomId, {
        value: entryFee,
      });

      // Join with third player (should start game)
      await gameContract.connect(player3).joinRoom(roomId, {
        value: entryFee,
      });

      // Submit game result
      const zkProof = ethers.keccak256(ethers.toUtf8Bytes("final-proof"));
      await gameContract.submitGameResult(roomId, player2.address, 150, zkProof);

      // Claim rewards
      await gameContract.connect(player2).claimRewards(roomId);

      // Verify final state
      const room = await gameContract.getRoom(roomId);
      expect(room.isEnded).to.be.true;
      expect(room.winner).to.equal(player2.address);
      expect(room.players).to.have.length(3);
    });
  });
}); 