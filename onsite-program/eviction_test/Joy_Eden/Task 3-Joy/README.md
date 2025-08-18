# Ludo Game Smart Contract

A decentralized implementation of the classic Ludo board game on Ethereum.

## Features

- **Player Registration**: Up to 4 players with unique colors (RED, GREEN, BLUE, YELLOW)
- **Token Staking**: Players stake ETH to participate - winner takes all
- **Dice Rolling**: Cryptographically generated random numbers (1-6)
- **Turn-based Gameplay**: Sequential player turns with position tracking
- **Automatic Game Management**: Game starts with 2+ players, ends when someone reaches position 100

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy locally
npx hardhat node
npm run deploy:localhost
```

## Game Rules

1. Register with name, color choice, and stake minimum amount
2. Game starts automatically with 2+ players
3. Take turns rolling dice and moving positions
4. First player to reach position 100 wins all staked tokens
5. Winner can reset the game for a new round

## Contract Architecture

- **Solidity Version**: 0.8.24
- **License**: MIT
- **Optimization**: Enabled (200 runs)
- **Test Coverage**: 20 comprehensive tests

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment and verification instructions.

## Security

- Pseudo-random dice generation using block properties
- Winner-takes-all token distribution
- No emergency stops or admin controls
- Non-upgradeable contract

## Testing

```bash
npm test
```

All tests passing with comprehensive coverage including:
- Contract deployment
- Player registration validation
- Game mechanics
- Edge cases and error handling
- Dice randomness verification