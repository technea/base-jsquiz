// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "erc721a/contracts/ERC721A.sol";

contract GamifiedRewardNFT is ERC721A, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;

    // =============================================================
    //                         CONSTANTS
    // =============================================================
    
    uint256 public constant MAX_SUPPLY = 10000;
    
    // IMMEDIATE REWARDS (2,000 NFTs)
    uint256 public constant LEVEL_10_REWARD = 500;      // 500 NFTs for JS level 10
    uint256 public constant WEEKLY_TASK_REWARD = 1000;  // 1,000 NFTs for 5+ weeks
    uint256 public constant GM_STREAK_REWARD = 500;     // 500 NFTs for 7-day GM streak
    
    // FUTURE CAMPAIGNS (8,000 NFTs - Reserved)
    uint256 public constant FUTURE_CAMPAIGNS_RESERVE = 8000;
    
    // Token ID ranges
    uint256 public constant LEVEL_10_START_ID = 1;           // IDs 1-500
    uint256 public constant WEEKLY_START_ID = 501;           // IDs 501-1500
    uint256 public constant GM_STREAK_START_ID = 1501;       // IDs 1501-2000
    uint256 public constant FUTURE_CAMPAIGNS_START_ID = 2001; // IDs 2001-10000
    
    // =============================================================
    //                         STRUCTS
    // =============================================================
    
    struct UserProgress {
        // JavaScript Level Tracking
        uint256 jsLevel;
        uint256 jsCompletedAt;
        bool level10RewardClaimed;
        
        // Base Weekly Task Tracking (5+ weeks)
        uint256 weeklyTasksCompleted;
        uint256 lastWeeklyTaskTimestamp;
        bool weeklyRewardClaimed;
        
        // GM Streak Tracking (7 days)
        uint256 gmStreak;
        uint256 lastGMTime;
        bool gmRewardClaimed;
        
        // Future Campaigns Participation
        mapping(uint256 => bool) futureCampaignsJoined;
        uint256 futureCampaignsCount;
        
        // Earned NFTs
        uint256[] earnedNFTs;
    }
    
    struct FutureCampaign {
        string name;
        string description;
        uint256 nftAllocation;      // How many NFTs from the 8000 reserve
        uint256 nftMinted;          // How many already minted
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(address => bool) hasClaimed;
    }
    
    // =============================================================
    //                         STATE VARIABLES
    // =============================================================
    
    mapping(address => UserProgress) public userProgress;
    mapping(uint256 => uint8) public rewardCategory; // 0=Level10, 1=Weekly, 2=GM, 3=Future
    
    // Reward tracking
    uint256 public level10ClaimedCount = 0;
    uint256 public weeklyClaimedCount = 0;
    uint256 public gmClaimedCount = 0;
    uint256 public futureCampaignsMinted = 0;
    
    // Future campaigns
    mapping(uint256 => FutureCampaign) public futureCampaigns;
    uint256 public futureCampaignCount = 0;
    
    // Campaign requirements
    uint256 public constant MIN_WEEKS_REQUIRED = 5;
    uint256 public constant WEEK_IN_SECONDS = 7 days;
    uint256 public constant GM_STREAK_REQUIRED = 7;
    
    // =============================================================
    //                    PAYMENT SETTINGS
    // =============================================================
    
    // Payment receiver wallet - all mint fees go directly here
    address payable public paymentReceiver;
    
    // Mint fee in ETH (~$0.10 at current prices, adjustable by owner)
    uint256 public mintFee = 0.000042 ether; // ~$0.10 at ~$2400/ETH
    
    // Revenue tracking
    uint256 public totalRevenue = 0;
    uint256 public totalMintsPaid = 0;
    
    // Metadata URIs
    string private _level10BaseURI;
    string private _weeklyBaseURI;
    string private _gmBaseURI;
    string private _futureCampaignBaseURI;
    
    bool public rewardsActive = false;
    address public gameBackend; // Trusted backend for verification
    
    // =============================================================
    //                         MODIFIERS
    // =============================================================
    
    modifier onlyGameBackend() {
        require(msg.sender == gameBackend || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // =============================================================
    //                         EVENTS
    // =============================================================
    
    event Level10Completed(address indexed user, uint256 timestamp);
    event WeeklyTaskCompleted(address indexed user, uint256 weekNumber);
    event GMChecked(address indexed user, uint256 streak, uint256 timestamp);
    event RewardClaimed(address indexed user, uint256 rewardType, uint256 tokenId);
    event FutureCampaignCreated(uint256 campaignId, string name, uint256 allocation);
    event FutureCampaignJoined(address indexed user, uint256 campaignId);
    event FutureNFTClaimed(address indexed user, uint256 campaignId, uint256 tokenId);
    event MintFeePaid(address indexed user, uint256 amount, address indexed receiver);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================
    
    constructor(
        string memory level10URI,
        string memory weeklyURI,
        string memory gmURI,
        string memory futureCampaignURI,
        address _gameBackend
    ) ERC721A("Gamified Reward NFT", "GRNFT") Ownable(msg.sender) {
        _level10BaseURI = level10URI;
        _weeklyBaseURI = weeklyURI;
        _gmBaseURI = gmURI;
        _futureCampaignBaseURI = futureCampaignURI;
        gameBackend = _gameBackend;
        paymentReceiver = payable(0x0881e4c7b81dC36Fc4Fc1c82cE0e97bBB0134F93);
    }
    
    // =============================================================
    //                    INTERNAL PAYMENT HANDLER
    // =============================================================
    
    /// @dev Collects mint fee from user and sends it directly to paymentReceiver
    function _collectMintFee() internal {
        require(msg.value >= mintFee, "Insufficient mint fee");
        
        // Send fee directly to your wallet - no funds held in contract
        (bool success, ) = paymentReceiver.call{value: mintFee}("");
        require(success, "Payment transfer failed");
        
        totalRevenue += mintFee;
        totalMintsPaid++;
        
        // Refund excess ETH if user overpaid
        uint256 excess = msg.value - mintFee;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            require(refunded, "Refund failed");
        }
        
        emit MintFeePaid(msg.sender, mintFee, paymentReceiver);
    }
    
    // =============================================================
    //              JAVASCRIPT LEVEL TRACKING (10 LEVELS)
    // =============================================================
    
    function updateJSLevel(uint256 newLevel, bytes memory signature) external nonReentrant {
        // Verify backend signature for authenticity
        require(verifySignature(msg.sender, newLevel, signature), "Invalid signature");
        require(newLevel <= 10, "Max level is 10");
        
        UserProgress storage progress = userProgress[msg.sender];
        require(newLevel > progress.jsLevel, "Can only increase level");
        
        progress.jsLevel = newLevel;
        
        if (newLevel == 10 && progress.jsCompletedAt == 0) {
            progress.jsCompletedAt = block.timestamp;
            emit Level10Completed(msg.sender, block.timestamp);
        }
    }
    
    // =============================================================
    //              BASE WEEKLY TASK TRACKING (5+ WEEKS)
    // =============================================================
    
    function completeWeeklyTask(bytes memory signature) external nonReentrant {
        require(verifyWeeklyTask(msg.sender, signature), "Invalid signature");
        
        UserProgress storage progress = userProgress[msg.sender];
        
        if (progress.lastWeeklyTaskTimestamp > 0) {
            require(
                block.timestamp >= progress.lastWeeklyTaskTimestamp + WEEK_IN_SECONDS,
                "Must wait 1 week between tasks"
            );
        }
        
        progress.weeklyTasksCompleted++;
        progress.lastWeeklyTaskTimestamp = block.timestamp;
        
        emit WeeklyTaskCompleted(msg.sender, progress.weeklyTasksCompleted);
    }
    
    // =============================================================
    //              7-DAY GM STREAK TRACKING
    // =============================================================
    
    function checkGM(bytes memory signature) external nonReentrant {
        require(verifyGM(msg.sender, signature), "Invalid signature");
        
        UserProgress storage progress = userProgress[msg.sender];
        
        uint256 currentDay = block.timestamp / 1 days;
        uint256 lastGMDay = progress.lastGMTime / 1 days;
        
        require(lastGMDay != currentDay, "Already checked GM today");
        
        if (lastGMDay == currentDay - 1) {
            progress.gmStreak++;
        } else {
            progress.gmStreak = 1;
        }
        
        progress.lastGMTime = block.timestamp;
        
        emit GMChecked(msg.sender, progress.gmStreak, block.timestamp);
    }
    
    // =============================================================
    //                    REWARD CLAIMING
    // =============================================================
    
    function claimLevel10Reward() external payable nonReentrant {
        require(rewardsActive, "Rewards not active");
        _collectMintFee(); // User pays $0.10 → goes to your wallet
        
        UserProgress storage progress = userProgress[msg.sender];
        
        require(progress.jsLevel >= 8, "Must reach level 8");
        require(!progress.level10RewardClaimed, "Already claimed");
        require(level10ClaimedCount < LEVEL_10_REWARD, "No more level 10 rewards");
        
        progress.level10RewardClaimed = true;
        
        uint256 tokenId = LEVEL_10_START_ID + level10ClaimedCount;
        _safeMint(msg.sender, 1);
        
        progress.earnedNFTs.push(tokenId);
        rewardCategory[tokenId] = 0;
        level10ClaimedCount++;
        
        emit RewardClaimed(msg.sender, 0, tokenId);
    }
    
    function claimWeeklyReward() external payable nonReentrant {
        require(rewardsActive, "Rewards not active");
        _collectMintFee(); // User pays $0.10 → goes to your wallet
        
        UserProgress storage progress = userProgress[msg.sender];
        
        require(progress.weeklyTasksCompleted >= MIN_WEEKS_REQUIRED, "Need 5+ weeks");
        require(!progress.weeklyRewardClaimed, "Already claimed");
        require(weeklyClaimedCount < WEEKLY_TASK_REWARD, "No more weekly rewards");
        
        progress.weeklyRewardClaimed = true;
        
        uint256 tokenId = WEEKLY_START_ID + weeklyClaimedCount;
        _safeMint(msg.sender, 1);
        
        progress.earnedNFTs.push(tokenId);
        rewardCategory[tokenId] = 1;
        weeklyClaimedCount++;
        
        emit RewardClaimed(msg.sender, 1, tokenId);
    }
    
    function claimGMReward() external payable nonReentrant {
        require(rewardsActive, "Rewards not active");
        _collectMintFee(); // User pays $0.10 → goes to your wallet
        
        UserProgress storage progress = userProgress[msg.sender];
        
        require(progress.gmStreak >= GM_STREAK_REQUIRED, "Need 7-day GM streak");
        require(!progress.gmRewardClaimed, "Already claimed");
        require(gmClaimedCount < GM_STREAK_REWARD, "No more GM rewards");
        
        progress.gmRewardClaimed = true;
        
        uint256 tokenId = GM_STREAK_START_ID + gmClaimedCount;
        _safeMint(msg.sender, 1);
        
        progress.earnedNFTs.push(tokenId);
        rewardCategory[tokenId] = 2;
        gmClaimedCount++;
        
        emit RewardClaimed(msg.sender, 2, tokenId);
    }
    
    // =============================================================
    //              FUTURE CAMPAIGNS (8,000 RESERVED)
    // =============================================================
    
    function createFutureCampaign(
        string memory name,
        string memory description,
        uint256 nftAllocation,
        uint256 durationDays
    ) external onlyOwner {
        require(nftAllocation > 0, "Allocation must be > 0");
        require(futureCampaignsMinted + nftAllocation <= FUTURE_CAMPAIGNS_RESERVE, "Exceeds reserve");
        
        uint256 campaignId = futureCampaignCount++;
        FutureCampaign storage campaign = futureCampaigns[campaignId];
        
        campaign.name = name;
        campaign.description = description;
        campaign.nftAllocation = nftAllocation;
        campaign.nftMinted = 0;
        campaign.startTime = block.timestamp;
        campaign.endTime = block.timestamp + (durationDays * 1 days);
        campaign.isActive = true;
        
        emit FutureCampaignCreated(campaignId, name, nftAllocation);
    }
    
    function joinFutureCampaign(uint256 campaignId, bytes memory signature) external nonReentrant {
        require(campaignId < futureCampaignCount, "Campaign doesn't exist");
        FutureCampaign storage campaign = futureCampaigns[campaignId];
        
        require(campaign.isActive, "Campaign not active");
        require(block.timestamp >= campaign.startTime, "Campaign not started");
        require(block.timestamp <= campaign.endTime, "Campaign ended");
        require(!campaign.hasClaimed[msg.sender], "Already joined");
        
        // Verify user qualifies for campaign via backend
        require(verifyCampaignParticipation(msg.sender, campaignId, signature), "Not qualified");
        
        campaign.hasClaimed[msg.sender] = true;
        userProgress[msg.sender].futureCampaignsJoined[campaignId] = true;
        userProgress[msg.sender].futureCampaignsCount++;
        
        emit FutureCampaignJoined(msg.sender, campaignId);
    }
    
    function claimFutureCampaignNFT(uint256 campaignId) external payable nonReentrant {
        _collectMintFee(); // User pays $0.10 → goes to your wallet
        
        require(campaignId < futureCampaignCount, "Campaign doesn't exist");
        FutureCampaign storage campaign = futureCampaigns[campaignId];
        
        require(campaign.isActive, "Campaign not active");
        require(campaign.hasClaimed[msg.sender], "Haven't joined campaign");
        require(campaign.nftMinted < campaign.nftAllocation, "Campaign NFTs exhausted");
        
        uint256 tokenId = FUTURE_CAMPAIGNS_START_ID + futureCampaignsMinted;
        require(tokenId <= MAX_SUPPLY, "Max supply reached");
        
        _safeMint(msg.sender, 1);
        
        userProgress[msg.sender].earnedNFTs.push(tokenId);
        rewardCategory[tokenId] = 3; // Future campaign
        campaign.nftMinted++;
        futureCampaignsMinted++;
        
        emit FutureNFTClaimed(msg.sender, campaignId, tokenId);
    }
    
    // =============================================================
    //              3D HIGH QUALITY TOKEN URI
    // =============================================================
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        uint8 category = rewardCategory[tokenId];
        
        if (category == 0) {
            // Level 10 Reward - Legendary Gold 3D Model
            return string(abi.encodePacked(_level10BaseURI, tokenId.toString(), ".json"));
        } else if (category == 1) {
            // Weekly Reward - Rare Silver 3D Model with Animations
            return string(abi.encodePacked(_weeklyBaseURI, tokenId.toString(), ".json"));
        } else if (category == 2) {
            // GM Reward - Epic Diamond 3D Model with Special Effects
            return string(abi.encodePacked(_gmBaseURI, tokenId.toString(), ".json"));
        } else {
            // Future Campaign - Dynamic 3D Model based on campaign
            return string(abi.encodePacked(_futureCampaignBaseURI, tokenId.toString(), ".json"));
        }
    }
    
    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================
    
    function getUserProgress(address user) external view returns (
        uint256 jsLevel,
        uint256 weeklyTasks,
        uint256 gmStreak,
        bool level10Claimed,
        bool weeklyClaimed,
        bool gmClaimed,
        uint256 userFutureCampaigns
    ) {
        UserProgress storage progress = userProgress[user];
        return (
            progress.jsLevel,
            progress.weeklyTasksCompleted,
            progress.gmStreak,
            progress.level10RewardClaimed,
            progress.weeklyRewardClaimed,
            progress.gmRewardClaimed,
            progress.futureCampaignsCount
        );
    }
    
    function getUserEarnedNFTs(address user) external view returns (uint256[] memory) {
        return userProgress[user].earnedNFTs;
    }
    
    function getRemainingRewards() external view returns (
        uint256 level10Remaining,
        uint256 weeklyRemaining,
        uint256 gmRemaining,
        uint256 futureRemaining
    ) {
        return (
            LEVEL_10_REWARD - level10ClaimedCount,
            WEEKLY_TASK_REWARD - weeklyClaimedCount,
            GM_STREAK_REWARD - gmClaimedCount,
            FUTURE_CAMPAIGNS_RESERVE - futureCampaignsMinted
        );
    }
    
    function getCampaignInfo(uint256 campaignId) external view returns (
        string memory name,
        string memory description,
        uint256 allocation,
        uint256 minted,
        bool isActive,
        uint256 endTime
    ) {
        FutureCampaign storage campaign = futureCampaigns[campaignId];
        return (
            campaign.name,
            campaign.description,
            campaign.nftAllocation,
            campaign.nftMinted,
            campaign.isActive,
            campaign.endTime
        );
    }
    
    // =============================================================
    //                   VERIFICATION FUNCTIONS
    // =============================================================
    
    function verifySignature(address user, uint256 level, bytes memory signature) 
        internal view returns (bool) 
    {
        bytes32 messageHash = keccak256(abi.encodePacked(user, level, "JS_LEVEL"));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return recoverSigner(ethSignedMessageHash, signature) == gameBackend;
    }
    
    function verifyWeeklyTask(address user, bytes memory signature) 
        internal view returns (bool) 
    {
        bytes32 messageHash = keccak256(abi.encodePacked(user, block.timestamp / 1 weeks, "WEEKLY_TASK"));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return recoverSigner(ethSignedMessageHash, signature) == gameBackend;
    }
    
    function verifyGM(address user, bytes memory signature) 
        internal view returns (bool) 
    {
        bytes32 messageHash = keccak256(abi.encodePacked(user, block.timestamp / 1 days, "GM_CHECK"));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return recoverSigner(ethSignedMessageHash, signature) == gameBackend;
    }
    
    function verifyCampaignParticipation(address user, uint256 campaignId, bytes memory signature) 
        internal view returns (bool) 
    {
        bytes32 messageHash = keccak256(abi.encodePacked(user, campaignId, "CAMPAIGN_JOIN"));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return recoverSigner(ethSignedMessageHash, signature) == gameBackend;
    }
    
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) 
        internal pure returns (address) 
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
    
    function splitSignature(bytes memory sig) 
        internal pure returns (bytes32 r, bytes32 s, uint8 v) 
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // =============================================================
    //                      OWNER FUNCTIONS
    // =============================================================
    
    function setRewardsActive(bool active) external onlyOwner {
        rewardsActive = active;
    }
    
    function setGameBackend(address _gameBackend) external onlyOwner {
        gameBackend = _gameBackend;
    }
    
    /// @notice Update mint fee (in wei). Use this to keep price ~$0.10 as ETH price changes
    function setMintFee(uint256 newFee) external onlyOwner {
        emit MintFeeUpdated(mintFee, newFee);
        mintFee = newFee;
    }
    
    /// @notice Change the wallet that receives all mint fees
    function setPaymentReceiver(address payable newReceiver) external onlyOwner {
        require(newReceiver != address(0), "Invalid address");
        paymentReceiver = newReceiver;
    }
    
    function setBaseURIs(
        string memory level10URI,
        string memory weeklyURI,
        string memory gmURI,
        string memory futureURI
    ) external onlyOwner {
        _level10BaseURI = level10URI;
        _weeklyBaseURI = weeklyURI;
        _gmBaseURI = gmURI;
        _futureCampaignBaseURI = futureURI;
    }
    
    /// @notice Emergency withdraw - in case any ETH gets stuck in contract
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = paymentReceiver.call{value: balance}("");
        require(success, "Withdraw failed");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }
}
