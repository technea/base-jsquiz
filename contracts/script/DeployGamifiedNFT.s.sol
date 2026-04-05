// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../GamifiedRewardNFT.sol";

contract DeployGamifiedNFT is Script {
    function run() external {
        // Load environment variables
        string memory level10URI = vm.envString("LEVEL10_BASE_URI");
        string memory weeklyURI = vm.envString("WEEKLY_BASE_URI");
        string memory gmURI = vm.envString("GM_BASE_URI");
        string memory futureCampaignURI = vm.envString("FUTURE_CAMPAIGN_BASE_URI");
        address gameBackend = vm.envAddress("GAME_BACKEND_ADDRESS");

        vm.startBroadcast();

        GamifiedRewardNFT nft = new GamifiedRewardNFT(
            level10URI,
            weeklyURI,
            gmURI,
            futureCampaignURI,
            gameBackend
        );

        // Activate rewards
        nft.setRewardsActive(true);

        console.log("GamifiedRewardNFT deployed at:", address(nft));
        console.log("Game Backend:", gameBackend);
        console.log("Max Supply:", nft.MAX_SUPPLY());

        vm.stopBroadcast();
    }
}
