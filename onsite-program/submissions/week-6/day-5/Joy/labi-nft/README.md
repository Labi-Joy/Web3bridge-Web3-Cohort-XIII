# Dynamic Time NFT

A fully on-chain NFT that dynamically renders the current blockchain time as an SVG image. The image changes every second based on `block.timestamp`.

## Features

- **Dynamic SVG Generation**: Image updates in real-time based on blockchain timestamp
- **Fully On-Chain**: No external dependencies or IPFS
- **Time Display**: Shows hours:minutes:seconds and raw timestamp
- **Color Animation**: Background gradient changes every hour
- **Self-Contained**: Complete metadata and image encoded in contract

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Run Tests
```bash
npm run test
```

### 4. Start Local Blockchain
```bash
npm run node
```
Keep this terminal open - this runs a local Ethereum node on http://localhost:8545

### 5. Deploy Contract (New Terminal)
```bash
npm run deploy:localhost
```
Save the contract address from the output.

## Wallet Connection Setup

### MetaMask Configuration
1. Add Hardhat Network to MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import Test Account:
   - Use any private key from the Hardhat node output
   - Account will have 10,000 test ETH

### Viewing Your NFT
1. Add the contract address to MetaMask (Assets > Import Token)
2. View tokenURI in a browser or NFT viewer
3. The image updates every time you refresh/query

## Contract Functions

- `mint(address to)` - Mint new NFT to address
- `tokenURI(uint256 tokenId)` - Get complete NFT metadata with dynamic image

## Testing in Real-Time

1. Deploy contract: `npm run deploy:localhost`
2. Open browser console and try:
```javascript
// Connect to contract (replace with your deployed address)
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const abi = [...]; // Get from artifacts/contracts/DynamicTimeNFT.sol/DynamicTimeNFT.json

const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(contractAddress, abi, provider);

// Get dynamic tokenURI
const tokenURI = await contract.tokenURI(0);
console.log(tokenURI);

// Decode the image
const json = JSON.parse(atob(tokenURI.split(',')[1]));
console.log(json.image); // This is your dynamic SVG!
```

## Deployment Addresses

### Local Network (Hardhat)
- Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Network: Hardhat Local (Chain ID: 31337)  
- Deployer: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Testnet Deployment
To deploy on testnets, update `hardhat.config.js` with network configuration and run:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

## Project Structure

```
labi-nft/
├── contracts/
│   └── DynamicTimeNFT.sol    # Main NFT contract
├── test/
│   └── DynamicTimeNFT.js     # Contract tests
├── scripts/
│   └── deploy.js             # Deployment script
├── hardhat.config.js         # Hardhat configuration
└── package.json              # Dependencies and scripts
```

## How It Works

1. **Time Calculation**: `block.timestamp` is converted to hours:minutes:seconds
2. **Dynamic Colors**: HSL color changes based on current hour
3. **SVG Generation**: Complete SVG created with time display and animated background
4. **Base64 Encoding**: SVG encoded as data URI for full on-chain storage
5. **JSON Metadata**: Standard ERC721 metadata with embedded SVG image

The NFT image updates every time `tokenURI()` is called, making it truly dynamic!