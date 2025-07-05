const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Olym3 Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "OLYM");

  // Deploy OLYM Token first
  console.log("\n📦 Deploying OLYM Token...");
  const OLYMToken = await ethers.getContractFactory("OLYMToken");
  const olymToken = await OLYMToken.deploy();
  await olymToken.waitForDeployment();
  const olymTokenAddress = await olymToken.getAddress();
  console.log("✅ OLYM Token deployed to:", olymTokenAddress);

  // Deploy Challenge Wave Game contract
  console.log("\n🎮 Deploying Challenge Wave Game contract...");
  const ChallengeWaveGame = await ethers.getContractFactory("ChallengeWaveGame");
  const challengeWaveGame = await ChallengeWaveGame.deploy();
  await challengeWaveGame.waitForDeployment();
  const gameContractAddress = await challengeWaveGame.getAddress();
  console.log("✅ Challenge Wave Game deployed to:", gameContractAddress);

  // Deploy NFT contract
  console.log("\n🖼️ Deploying Challenge Wave NFT contract...");
  const ChallengeWaveNFT = await ethers.getContractFactory("ChallengeWaveNFT");
  const challengeWaveNFT = await ChallengeWaveNFT.deploy();
  await challengeWaveNFT.waitForDeployment();
  const nftContractAddress = await challengeWaveNFT.getAddress();
  console.log("✅ Challenge Wave NFT deployed to:", nftContractAddress);

  // Set up contract relationships
  console.log("\n🔗 Setting up contract relationships...");
  
  // Set game contract in OLYM token
  const setGameContractTx = await olymToken.setGameContract(gameContractAddress);
  await setGameContractTx.wait();
  console.log("✅ Game contract set in OLYM token");

  // Set game contract in NFT contract
  const setGameContractNFTTx = await challengeWaveNFT.setGameContract(gameContractAddress);
  await setGameContractNFTTx.wait();
  console.log("✅ Game contract set in NFT contract");

  // Set NFT contract in game contract
  const setNFTContractTx = await challengeWaveGame.setNFTContract(nftContractAddress);
  await setNFTContractTx.wait();
  console.log("✅ NFT contract set in game contract");

  // Mint some tokens to the deployer for testing
  console.log("\n🪙 Minting initial tokens for testing...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 OLYM
  const mintTx = await olymToken.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minted", ethers.formatEther(mintAmount), "OLYM to deployer");

  // Verify contracts on explorer (if API key is available)
  console.log("\n🔍 Verifying contracts on explorer...");
  try {
    await hre.run("verify:verify", {
      address: olymTokenAddress,
      constructorArguments: [],
    });
    console.log("✅ OLYM Token verified on explorer");
  } catch (error) {
    console.log("⚠️ Could not verify OLYM Token:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: gameContractAddress,
      constructorArguments: [],
    });
    console.log("✅ Challenge Wave Game verified on explorer");
  } catch (error) {
    console.log("⚠️ Could not verify Challenge Wave Game:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: nftContractAddress,
      constructorArguments: [],
    });
    console.log("✅ Challenge Wave NFT verified on explorer");
  } catch (error) {
    console.log("⚠️ Could not verify Challenge Wave NFT:", error.message);
  }

  // Print deployment summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=".repeat(50));
  console.log("📋 Deployment Summary:");
  console.log("Network: Olym3 Testnet");
  console.log("Deployer:", deployer.address);
  console.log("OLYM Token:", olymTokenAddress);
  console.log("Game Contract:", gameContractAddress);
  console.log("NFT Contract:", nftContractAddress);
  console.log("=".repeat(50));

  // Save deployment info to file
  const deploymentInfo = {
    network: "olym3-testnet",
    deployer: deployer.address,
    contracts: {
      olymToken: olymTokenAddress,
      gameContract: gameContractAddress,
      nftContract: nftContractAddress,
    },
    timestamp: new Date().toISOString(),
    blockNumber: await deployer.provider.getBlockNumber(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to deployment-info.json");

  // Print next steps
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend constants with contract addresses");
  console.log("2. Test contract interactions");
  console.log("3. Set up faucet for test tokens");
  console.log("4. Deploy to mainnet when ready");
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 