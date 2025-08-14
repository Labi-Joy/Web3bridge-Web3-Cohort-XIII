// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVRFCoordinator {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LootBox is Ownable, ReentrancyGuard {
    IVRFCoordinator private immutable vrfCoordinator;
    
    uint64 private subscriptionId;
    bytes32 private keyHash;
    uint32 private callbackGasLimit = 100000;
    uint16 private requestConfirmations = 3;
    
    uint256 public lootBoxPrice;
    uint256 private requestCounter;
    
    enum RewardType { ERC20, ERC721, ERC1155 }
    
    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        uint256 weight;
        bool active;
    }
    
    struct PendingRequest {
        address user;
        bool fulfilled;
    }
    
    mapping(uint256 => Reward) public rewards;
    mapping(uint256 => PendingRequest) public pendingRequests;
    uint256 public totalRewards;
    uint256 public totalWeight;
    
    event LootBoxOpened(address indexed user, uint256 requestId);
    event RewardGranted(address indexed user, uint256 rewardId, RewardType rewardType, address tokenAddress, uint256 tokenId, uint256 amount);
    event RandomnessRequested(uint256 requestId, address indexed user);
    event RewardAdded(uint256 rewardId, RewardType rewardType, address tokenAddress, uint256 tokenId, uint256 amount, uint256 weight);
    event RewardRemoved(uint256 rewardId);
    event LootBoxPriceUpdated(uint256 newPrice);
    
    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint256 _lootBoxPrice
    ) Ownable(msg.sender) {
        vrfCoordinator = IVRFCoordinator(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        lootBoxPrice = _lootBoxPrice;
    }
    
    function openLootBox() external payable nonReentrant {
        require(msg.value >= lootBoxPrice, "Insufficient payment");
        require(totalRewards > 0, "No rewards available");
        
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );
        
        pendingRequests[requestId] = PendingRequest({
            user: msg.sender,
            fulfilled: false
        });
        
        if (msg.value > lootBoxPrice) {
            payable(msg.sender).transfer(msg.value - lootBoxPrice);
        }
        
        emit LootBoxOpened(msg.sender, requestId);
        emit RandomnessRequested(requestId, msg.sender);
    }
    
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(msg.sender == address(vrfCoordinator), "Only VRF Coordinator can call");
        fulfillRandomWords(requestId, randomWords);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal {
        require(!pendingRequests[requestId].fulfilled, "Request already fulfilled");
        require(pendingRequests[requestId].user != address(0), "Invalid request");
        
        uint256 randomValue = randomWords[0] % totalWeight;
        uint256 cumulativeWeight = 0;
        uint256 selectedRewardId = 0;
        
        for (uint256 i = 0; i < totalRewards; i++) {
            if (rewards[i].active) {
                cumulativeWeight += rewards[i].weight;
                if (randomValue < cumulativeWeight) {
                    selectedRewardId = i;
                    break;
                }
            }
        }
        
        _grantReward(pendingRequests[requestId].user, selectedRewardId);
        pendingRequests[requestId].fulfilled = true;
    }
    
    function _grantReward(address user, uint256 rewardId) internal {
        Reward memory reward = rewards[rewardId];
        
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenAddress).transfer(user, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenAddress).safeTransferFrom(address(this), user, reward.tokenId);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenAddress).safeTransferFrom(address(this), user, reward.tokenId, reward.amount, "");
        }
        
        emit RewardGranted(user, rewardId, reward.rewardType, reward.tokenAddress, reward.tokenId, reward.amount);
    }
    
    function addReward(
        RewardType _rewardType,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight
    ) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_weight > 0, "Weight must be greater than 0");
        
        rewards[totalRewards] = Reward({
            rewardType: _rewardType,
            tokenAddress: _tokenAddress,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight,
            active: true
        });
        
        totalWeight += _weight;
        
        emit RewardAdded(totalRewards, _rewardType, _tokenAddress, _tokenId, _amount, _weight);
        totalRewards++;
    }
    
    function removeReward(uint256 rewardId) external onlyOwner {
        require(rewardId < totalRewards, "Invalid reward ID");
        require(rewards[rewardId].active, "Reward already inactive");
        
        totalWeight -= rewards[rewardId].weight;
        rewards[rewardId].active = false;
        
        emit RewardRemoved(rewardId);
    }
    
    function updateLootBoxPrice(uint256 _newPrice) external onlyOwner {
        lootBoxPrice = _newPrice;
        emit LootBoxPriceUpdated(_newPrice);
    }
    
    function updateVRFSettings(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
    
    function getReward(uint256 rewardId) external view returns (Reward memory) {
        require(rewardId < totalRewards, "Invalid reward ID");
        return rewards[rewardId];
    }
    
    function getActiveRewardIds() external view returns (uint256[] memory) {
        uint256[] memory activeIds = new uint256[](totalRewards);
        uint256 count = 0;
        
        for (uint256 i = 0; i < totalRewards; i++) {
            if (rewards[i].active) {
                activeIds[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeIds[i];
        }
        
        return result;
    }
    
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}