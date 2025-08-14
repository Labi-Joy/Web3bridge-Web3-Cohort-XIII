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

contract MockVRFCoordinator is IVRFCoordinator {
    uint256 private _requestCounter = 1;
    mapping(uint256 => address) private _requestToConsumer;
    
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external override returns (uint256 requestId) {
        requestId = _requestCounter++;
        _requestToConsumer[requestId] = msg.sender;
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = _requestToConsumer[requestId];
        require(consumer != address(0), "Invalid request ID");
        (bool success,) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "Callback failed");
    }
}