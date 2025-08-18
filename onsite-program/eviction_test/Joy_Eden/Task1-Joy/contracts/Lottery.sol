// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    mapping(address => bool) public hasEntered;
    address public winner;
    address public lastWinner;
    uint256 public round;
    
    event PlayerJoined(address indexed player, uint256 indexed round);
    event WinnerSelected(address indexed winner, uint256 prizePool, uint256 indexed round);
    event LotteryReset(uint256 indexed round);
    
    function enter() external payable {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(!hasEntered[msg.sender], "Already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, round);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");
        
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players
        ))) % players.length;
        
        winner = players[randomIndex];
        uint256 prizePool = address(this).balance;
        
        emit WinnerSelected(winner, prizePool, round);
        
        (bool success, ) = winner.call{value: prizePool}("");
        require(success, "Transfer failed");
        
        _reset();
    }
    
    function _reset() private {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        lastWinner = winner;
        delete players;
        winner = address(0);
        round++;
        
        emit LotteryReset(round);
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}