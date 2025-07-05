const { ethers } = require("hardhat");

async function main() {
  console.log("🎁 Starting NFT transfer process...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  // Get winner address from command line or environment
  const winnerAddress = process.argv[2] || process.env.WINNER_ADDRESS;
  if (!winnerAddress) {
    console.error("❌ Winner address required!");
    console.log("Usage: npx hardhat run scripts/transfer-nft.js --network olym3 <winner_address>");
    console.log("Or set WINNER_ADDRESS environment variable");
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(winnerAddress)) {
    console.error("❌ Invalid winner address format!");
    process.exit(1);
  }

  console.log("🏆 Winner address:", winnerAddress);

  // Get the NFT contract
  const nftContract = await ethers.getContractAt(
    "ChallengeWaveNFT",
    process.env.NFT_CONTRACT_ADDRESS
  );
  console.log("🎨 NFT Contract address:", await nftContract.getAddress());

  try {
    // Check deployer's NFT balance
    const deployerBalance = await nftContract.balanceOf(deployer.address);
    console.log("💰 Deployer NFT balance:", deployerBalance.toString());

    if (deployerBalance.toString() === "0") {
      console.error("❌ Deployer has no NFTs to transfer!");
      console.log("💡 Mint an NFT first using: npx hardhat run scripts/mint-nft.js --network olym3");
      process.exit(1);
    }

    // Get token ID (assuming we transfer the first token)
    const tokenId = 0;
    
    // Check if deployer owns this token
    const tokenOwner = await nftContract.ownerOf(tokenId);
    if (tokenOwner !== deployer.address) {
      console.error("❌ Deployer doesn't own token ID:", tokenId);
      process.exit(1);
    }

    console.log("📋 Token ID to transfer:", tokenId);

    // Transfer NFT to winner
    console.log("⏳ Transferring NFT to winner...");
    const transferTx = await nftContract.transferFrom(deployer.address, winnerAddress, tokenId);
    console.log("📋 Transfer transaction hash:", transferTx.hash);

    // Wait for transaction to be mined
    const receipt = await transferTx.wait();
    console.log("✅ NFT transferred successfully!");
    console.log("📊 Gas used:", receipt.gasUsed.toString());

    // Verify transfer
    const newOwner = await nftContract.ownerOf(tokenId);
    console.log("👑 New token owner:", newOwner);
    
    if (newOwner === winnerAddress) {
      console.log("✅ Transfer verification successful!");
    } else {
      console.log("⚠️ Transfer verification failed!");
    }

    // Check balances after transfer
    const deployerBalanceAfter = await nftContract.balanceOf(deployer.address);
    const winnerBalanceAfter = await nftContract.balanceOf(winnerAddress);
    
    console.log("💰 Final balances:");
    console.log("   Deployer:", deployerBalanceAfter.toString());
    console.log("   Winner:", winnerBalanceAfter.toString());

  } catch (error) {
    console.error("❌ Error transferring NFT:", error.message);
    
    if (error.message.includes("ERC721: caller is not token owner")) {
      console.log("💡 Make sure deployer owns the NFT");
    } else if (error.message.includes("ERC721: transfer caller is not owner")) {
      console.log("💡 Make sure deployer is the token owner");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 