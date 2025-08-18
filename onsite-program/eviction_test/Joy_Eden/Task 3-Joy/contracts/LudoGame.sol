// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LudoGame {
    enum Color { 
        RED, 
        GREEN, 
        BLUE, 
        YELLOW 
        }
    enum GameState { 
        WAITING_FOR_PLAYERS, 
        IN_PROGRESS, 
        FINISHED 
        }
    
    struct Player {
        address addr;
        string name;
        Color color;
        uint256 score;
        uint256 position;
        bool isRegistered;
        uint256 stakedAmount;
    }
    
    mapping(address => Player) public players;
    mapping(Color => address) public colorToPlayer;
    address[] public playerAddresses;
    
    GameState public gameState;
    address public winner;
    uint256 public totalStakedAmount;
    uint256 public minStakeAmount;
    address public currentPlayer;
    uint256 public currentPlayerIndex;
    
    event PlayerRegistered(address indexed player, string name, Color color);
    event DiceRolled(address indexed player, uint256 roll);
    event PlayerMoved(address indexed player, uint256 newPosition);
    event GameStarted();
    event GameEnded(address indexed winner, uint256 payout);
    event TokensStaked(address indexed player, uint256 amount);
    
    modifier onlyRegisteredPlayer() {
        require(players[msg.sender].isRegistered, "Player not registered");
        _;
    }
    
    modifier gameInProgress() {
        require(gameState == GameState.IN_PROGRESS, "Game not in progress");
        _;
    }
    
    modifier isCurrentPlayer() {
        require(msg.sender == currentPlayer, "Not your turn");
        _;
    }
    
    constructor(uint256 _minStakeAmount) {
        minStakeAmount = _minStakeAmount;
        gameState = GameState.WAITING_FOR_PLAYERS;
    }
    
    function registerPlayer(string memory _name, Color _color) external payable {
        require(gameState == GameState.WAITING_FOR_PLAYERS, "Game already started");
        require(!players[msg.sender].isRegistered, "Player already registered");
        require(colorToPlayer[_color] == address(0), "Color already taken");
        require(playerAddresses.length < 4, "Maximum 4 players allowed");
        require(msg.value >= minStakeAmount, "Insufficient stake amount");
        
        players[msg.sender] = Player({
            addr: msg.sender,
            name: _name,
            color: _color,
            score: 0,
            position: 0,
            isRegistered: true,
            stakedAmount: msg.value
        });
        
        colorToPlayer[_color] = msg.sender;
        playerAddresses.push(msg.sender);
        totalStakedAmount += msg.value;
        
        emit PlayerRegistered(msg.sender, _name, _color);
        emit TokensStaked(msg.sender, msg.value);
        
        if (playerAddresses.length >= 2) {
            startGame();
        }
    }
    
    function startGame() internal {
        require(playerAddresses.length >= 2, "Need at least 2 players");
        gameState = GameState.IN_PROGRESS;
        currentPlayer = playerAddresses[0];
        currentPlayerIndex = 0;
        emit GameStarted();
    }
    
    function rollDice() external onlyRegisteredPlayer gameInProgress isCurrentPlayer returns (uint256) {
        uint256 roll = _generateRandomNumber() % 6 + 1;
        emit DiceRolled(msg.sender, roll);
        
        _movePlayer(msg.sender, roll);
        _nextPlayer();
        
        return roll;
    }
    
    function _movePlayer(address playerAddr, uint256 diceRoll) internal {
        Player storage player = players[playerAddr];
        uint256 newPosition = player.position + diceRoll;
        
        if (newPosition >= 100) {
            newPosition = 100;
            _endGame(playerAddr);
        }
        
        player.position = newPosition;
        player.score += diceRoll;
        
        emit PlayerMoved(playerAddr, newPosition);
    }
    
    function _nextPlayer() internal {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerAddresses.length;
        currentPlayer = playerAddresses[currentPlayerIndex];
    }
    
    function _endGame(address winnerAddr) internal {
        gameState = GameState.FINISHED;
        winner = winnerAddr;
        
        uint256 payout = totalStakedAmount;
        totalStakedAmount = 0;
        
        (bool success, ) = winner.call{value: payout}("");
        require(success, "Payout failed");
        
        emit GameEnded(winner, payout);
    }
    
    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            blockhash(block.number - 1)
        )));
    }
    
    function getPlayerInfo(address playerAddr) external view returns (
        string memory name,
        Color color,
        uint256 score,
        uint256 position,
        bool isRegistered,
        uint256 stakedAmount
    ) {
        Player memory player = players[playerAddr];
        return (
            player.name,
            player.color,
            player.score,
            player.position,
            player.isRegistered,
            player.stakedAmount
        );
    }
    
    function getGameInfo() external view returns (
        GameState state,
        address currentTurn,
        uint256 totalStaked,
        uint256 playerCount,
        address gameWinner
    ) {
        return (
            gameState,
            currentPlayer,
            totalStakedAmount,
            playerAddresses.length,
            winner
        );
    }
    
    function getAllPlayers() external view returns (address[] memory) {
        return playerAddresses;
    }
    
    function resetGame() external {
        require(gameState == GameState.FINISHED, "Game not finished");
        require(msg.sender == winner, "Only winner can reset");
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address playerAddr = playerAddresses[i];
            Color playerColor = players[playerAddr].color;
            delete players[playerAddr];
            delete colorToPlayer[playerColor];
        }
        
        delete playerAddresses;
        gameState = GameState.WAITING_FOR_PLAYERS;
        winner = address(0);
        currentPlayer = address(0);
        currentPlayerIndex = 0;
        totalStakedAmount = 0;
    }
}