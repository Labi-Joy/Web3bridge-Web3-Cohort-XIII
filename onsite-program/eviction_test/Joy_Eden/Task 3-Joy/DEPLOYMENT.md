# Ludo Game Smart Contract Deployment Guide

This guide will walk you through deploying and verifying the Ludo Game smart contract on different networks.

## Prerequisites

1. **Node.js and npm installed**
2. **A wallet with some ETH for gas fees**
3. **API keys for RPC provider and Etherscan**

## Setup Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your actual values:
   ```env
   PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

   **Security Note**: Never share your private key or commit the `.env` file to version control.

## Install Dependencies

```bash
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
npm test
```

## Deployment

### Local Development (Hardhat Network)

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy to local network:
   ```bash
   npm run deploy:localhost
   ```

### Testnet Deployment (Sepolia)

1. Ensure you have Sepolia ETH in your wallet
2. Deploy to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

### Mainnet Deployment

1. Ensure you have ETH for gas fees
2. Deploy to mainnet:
   ```bash
   npx hardhat run scripts/deploy.ts --network mainnet
   ```

## Contract Verification

After deployment, verify your contract on Etherscan:

### Automatic Verification (Recommended)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "1000000000000000"
```

Replace:
- `sepolia` with your target network
- `DEPLOYED_CONTRACT_ADDRESS` with the actual deployed contract address
- `"1000000000000000"` with the constructor argument (minimum stake amount in wei, default is 0.01 ETH)

### Manual Verification

If automatic verification fails:

1. Go to Etherscan
2. Navigate to your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24
   - License: MIT
6. Copy and paste the contract source code
7. Add constructor arguments: `0000000000000000000000000000000000000000000000000de0b6b3a7640000` (for 0.01 ETH)

## Contract Interaction

After deployment, you can interact with the contract using:

### Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
const contractAddress = "YOUR_DEPLOYED_ADDRESS";
const LudoGame = await ethers.getContractFactory("LudoGame");
const ludoGame = LudoGame.attach(contractAddress);

// Register a player
await ludoGame.registerPlayer("PlayerName", 0, { value: ethers.parseEther("0.01") });

// Check game info
const gameInfo = await ludoGame.getGameInfo();
console.log(gameInfo);
```

### Web3 Frontend Integration

```javascript
const contractABI = [/* ABI from artifacts/contracts/LudoGame.sol/LudoGame.json */];
const contractAddress = "YOUR_DEPLOYED_ADDRESS";

const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Register player
await contract.connect(signer).registerPlayer("PlayerName", 0, { 
  value: ethers.parseEther("0.01") 
});

// Roll dice (when it's player's turn)
await contract.connect(signer).rollDice();
```

## Game Rules Summary

- **Players**: 2-4 players maximum
- **Colors**: RED (0), GREEN (1), BLUE (2), YELLOW (3)
- **Stake**: Minimum 0.01 ETH (configurable during deployment)
- **Objective**: First player to reach position 100 wins all staked tokens
- **Dice**: Generates random numbers 1-6
- **Turns**: Players take turns in registration order

## Contract Functions

### Player Functions
- `registerPlayer(string name, Color color)` - Register and stake tokens
- `rollDice()` - Roll dice when it's your turn
- `getPlayerInfo(address)` - Get player details
- `getGameInfo()` - Get current game state
- `getAllPlayers()` - Get list of all players

### Admin Functions
- `resetGame()` - Winner can reset the game (clears all data)

## Troubleshooting

### Common Issues

1. **"Insufficient stake amount"**
   - Ensure you're sending at least the minimum stake amount

2. **"Not your turn"**
   - Check current player with `getGameInfo()` before rolling dice

3. **"Game already started"**
   - Cannot register new players once game begins with 2+ players

4. **Gas estimation errors**
   - Increase gas limit manually: `{ gasLimit: 300000 }`

### Gas Optimization

The contract uses compiler optimization with 200 runs for balanced gas efficiency.

## Network Addresses

After deployment, add your contract addresses here:

- **Sepolia**: `TBD`
- **Mainnet**: `TBD`

## Security Considerations

- Contract uses pseudo-random number generation (not suitable for high-value games)
- Winner takes all mechanism - ensure players understand the risk
- No emergency stop mechanism - funds are locked until game completion
- Contract is not upgradeable - deploy new version for updates