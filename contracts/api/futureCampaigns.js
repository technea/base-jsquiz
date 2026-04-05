// futureCampaigns.js
const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Campaign types for the 8000 reserved NFTs
const CAMPAIGN_TEMPLATES = [
  {
    name: "JavaScript Master Challenge",
    description: "Complete advanced JS challenges to earn exclusive 3D NFTs",
    allocation: 2000,
    requirements: { minLevel: 8, minScore: 5000 }
  },
  {
    name: "Base Ecosystem Contributor",
    description: "Participate in Base governance and earn rewards",
    allocation: 1500,
    requirements: { minTransactions: 50, minVolume: 1 }
  },
  {
    name: "Community Builder",
    description: "Invite friends and build the community",
    allocation: 1500,
    requirements: { referrals: 10 }
  },
  {
    name: "DeFi Explorer",
    description: "Explore DeFi protocols on Base",
    allocation: 2000,
    requirements: { protocolsUsed: 5, minTVL: 1000 }
  },
  {
    name: "NFT Collector",
    description: "Collect specific NFTs from partner collections",
    allocation: 1000,
    requirements: { nftHoldings: 20 }
  }
];

// API endpoint to create new campaign (admin only)
router.post('/api/admin/create-campaign', async (req, res) => {
  const { name, description, allocation, durationDays } = req.body;
  
  try {
    const tx = await contract.createFutureCampaign(
      name,
      description,
      allocation,
      durationDays
    );
    await tx.wait();
    
    res.json({ success: true, message: "Campaign created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to check user eligibility for campaign
router.post('/api/campaign/check-eligibility', async (req, res) => {
  const { walletAddress, campaignId } = req.body;
  
  // Check user progress in database
  const user = await User.findOne({ walletAddress });
  
  const campaign = CAMPAIGN_TEMPLATES[campaignId];
  let eligible = false;
  
  switch(campaignId) {
    case 0: // JavaScript Master
      eligible = user.jsLevel >= 8 && user.totalScore >= 5000;
      break;
    case 1: // Base Ecosystem
      eligible = user.baseTransactions >= 50 && user.totalVolume >= 1;
      break;
    case 2: // Community Builder
      eligible = user.referralCount >= 10;
      break;
    case 3: // DeFi Explorer
      eligible = user.defiProtocolsUsed >= 5 && user.defiTVL >= 1000;
      break;
    case 4: // NFT Collector
      eligible = user.nftHoldings.length >= 20;
      break;
  }
  
  if (eligible) {
    // Generate signature for on-chain verification
    const signature = await generateCampaignSignature(walletAddress, campaignId);
    res.json({ eligible: true, signature });
  } else {
    res.json({ eligible: false });
  }
});

// Auto-claim rewards when conditions are met
async function checkAndAutoClaim(walletAddress) {
  const user = await User.findOne({ walletAddress });
  const contractWithSigner = contract.connect(walletSigner);
  
  // Check level 10 reward
  if (user.jsLevel >= 10 && !user.rewardsClaimed.level10) {
    const signature = await generateLevel10Signature(walletAddress);
    await contractWithSigner.claimLevel10Reward(signature);
    user.rewardsClaimed.level10 = true;
  }
  
  // Check weekly reward
  if (user.weeklyTasks.length >= 5 && !user.rewardsClaimed.weekly) {
    const signature = await generateWeeklySignature(walletAddress);
    await contractWithSigner.claimWeeklyReward(signature);
    user.rewardsClaimed.weekly = true;
  }
  
  // Check GM reward
  if (user.gmStreak >= 7 && !user.rewardsClaimed.gm) {
    const signature = await generateGMSignature(walletAddress);
    await contractWithSigner.claimGMReward(signature);
    user.rewardsClaimed.gm = true;
  }
  
  await user.save();
}

module.exports = router;
