const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking account balance on Olym3 Testnet...");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Account:", signer.address);

  // Get balance
  const balance = await signer.provider.getBalance(signer.address);
  console.log("💎 Balance:", ethers.formatEther(balance), "OLYM");

  // Get network info
  const network = await signer.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);

  // Get current block
  const blockNumber = await signer.provider.getBlockNumber();
  console.log("📦 Current Block:", blockNumber);

  // Get gas price
  const gasPrice = await signer.provider.getFeeData();
  console.log("⛽ Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");

  // Estimate deployment cost
  const ChallengeWaveGame = await ethers.getContractFactory("ChallengeWaveGame");
  const deploymentData = ChallengeWaveGame.interface.encodeDeploy();
  const deploymentGas = await signer.provider.estimateGas({
    from: signer.address,
    data: deploymentData,
  });

  const deploymentCost = deploymentGas * gasPrice.gasPrice;
  console.log("🚀 Estimated deployment cost:", ethers.formatEther(deploymentCost), "OLYM");
  console.log("⛽ Estimated gas:", deploymentGas.toString());

  // Check if enough balance for deployment
  if (balance > deploymentCost) {
    console.log("✅ Sufficient balance for deployment");
  } else {
    console.log("❌ Insufficient balance for deployment");
    console.log("💡 You need at least", ethers.formatEther(deploymentCost), "OLYM");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 