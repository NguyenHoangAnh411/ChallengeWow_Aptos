const { ethers } = require("hardhat");

async function main() {
  // Get the deployed contract addresses from environment or deployment
  const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "0xF94f1C185e5F5150f2CA0F57473Bbfd03aC02a99";
  const GAME_CONTRACT_ADDRESS = process.env.GAME_CONTRACT_ADDRESS || "0x871dB7dbF4F3933f1a5B9A81a89D2ae7E950418D";

  console.log("Setting Game Contract in NFT Contract...");
  console.log("NFT Contract Address:", NFT_CONTRACT_ADDRESS);
  console.log("Game Contract Address:", GAME_CONTRACT_ADDRESS);

  // Get the NFT contract
  const NFTContract = await ethers.getContractFactory("ChallengeWaveNFT");
  const nftContract = NFTContract.attach(NFT_CONTRACT_ADDRESS);

  // Set the game contract
  const tx = await nftContract.setGameContract(GAME_CONTRACT_ADDRESS);
  await tx.wait();

  console.log("Game contract set successfully!");
  console.log("Transaction hash:", tx.hash);

  // Verify the setting
  const gameContractAddress = await nftContract.gameContract();
  console.log("Verified Game Contract Address:", gameContractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 