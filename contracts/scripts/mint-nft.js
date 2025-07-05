const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting NFT minting process...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  // Get the NFT contract
  const nftContract = await ethers.getContractAt(
    "ChallengeWaveNFT",
    process.env.NFT_CONTRACT_ADDRESS
  );
  console.log("🎨 NFT Contract address:", await nftContract.getAddress());

  try {
    // Mint NFT to deployer
    console.log("⏳ Minting NFT to deployer...");
    const mintTx = await nftContract.mint(deployer.address);
    console.log("📋 Mint transaction hash:", mintTx.hash);

    // Wait for transaction to be mined
    const receipt = await mintTx.wait();
    console.log("✅ NFT minted successfully!");
    console.log("📊 Gas used:", receipt.gasUsed.toString());

    // Check NFT balance
    const balance = await nftContract.balanceOf(deployer.address);
    console.log("💰 NFT balance of deployer:", balance.toString());

    // Get token URI
    const tokenId = 0; // First token
    const tokenURI = await nftContract.tokenURI(tokenId);
    console.log("🔗 Token URI:", tokenURI);

  } catch (error) {
    console.error("❌ Error minting NFT:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 