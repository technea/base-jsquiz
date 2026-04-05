const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("========================================");
  console.log("  Gamified Reward NFT - Deployment");
  console.log("========================================");
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("Network:", hre.network.name);
  console.log("========================================\n");

  // Constructor arguments
  const level10URI = "https://metadata.jazzmini.xyz/level10/";
  const weeklyURI = "https://metadata.jazzmini.xyz/weekly/";
  const gmURI = "https://metadata.jazzmini.xyz/gm/";
  const futureCampaignURI = "https://metadata.jazzmini.xyz/campaigns/";
  
  // Game backend = deployer for now (can change later)
  const gameBackend = deployer.address;

  console.log("Deploying GamifiedRewardNFT...\n");

  const GamifiedRewardNFT = await hre.ethers.getContractFactory("GamifiedRewardNFT");
  const nft = await GamifiedRewardNFT.deploy(
    level10URI,
    weeklyURI,
    gmURI,
    futureCampaignURI,
    gameBackend
  );

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();

  console.log("✅ GamifiedRewardNFT deployed to:", contractAddress);
  console.log("   Payment Receiver:", await nft.paymentReceiver());
  console.log("   Mint Fee:", hre.ethers.formatEther(await nft.mintFee()), "ETH");
  console.log("   Max Supply:", (await nft.MAX_SUPPLY()).toString());
  console.log("   Game Backend:", gameBackend);

  // Activate rewards
  console.log("\n⚡ Activating rewards...");
  const tx = await nft.setRewardsActive(true);
  await tx.wait();
  console.log("✅ Rewards activated!\n");

  console.log("========================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("Contract:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("========================================");
  
  // Save contract address
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    paymentReceiver: await nft.paymentReceiver(),
    gameBackend: gameBackend,
    mintFee: hre.ethers.formatEther(await nft.mintFee()),
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n📄 Deployment info saved to deployment-${hre.network.name}.json`);
  
  // Verify contract
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting 30s before verification...");
    await new Promise(r => setTimeout(r, 30000));
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          level10URI,
          weeklyURI,
          gmURI,
          futureCampaignURI,
          gameBackend,
        ],
      });
      console.log("✅ Contract verified on BaseScan!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
      console.log("   You can verify manually later.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
