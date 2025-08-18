#!/bin/bash

echo "=== Uniswap V2 Interactions Demo ==="
echo ""

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

echo "1. Running addLiquidity script..."
npx hardhat run scripts/addLiquidity.ts | tee screenshots/addLiquidity_output.txt

echo ""
echo "2. Running removeLiquidity script..."
npx hardhat run scripts/removeLiquidity.ts | tee screenshots/removeLiquidity_output.txt

echo ""
echo "3. Running swapExactTokensForTokens script..."
npx hardhat run scripts/swapExactTokensForTokens.ts | tee screenshots/swapExactTokensForTokens_output.txt

echo ""
echo "4. Running swapTokensForExactTokens script..."
npx hardhat run scripts/swapTokensForExactTokens.ts | tee screenshots/swapTokensForExactTokens_output.txt

echo ""
echo "5. Running swapExactETHForTokens script..."
npx hardhat run scripts/swapExactETHForTokens.ts | tee screenshots/swapExactETHForTokens_output.txt

echo ""
echo "6. Running swapTokensForExactETH script..."
npx hardhat run scripts/swapTokensForExactETH.ts | tee screenshots/swapTokensForExactETH_output.txt

echo ""
echo "7. Running swapExactTokensForETH script..."
npx hardhat run scripts/swapExactTokensForETH.ts | tee screenshots/swapExactTokensForETH_output.txt

echo ""
echo "8. Running swapETHForExactTokens script..."
npx hardhat run scripts/swapETHForExactTokens.ts | tee screenshots/swapETHForExactTokens_output.txt

echo ""
echo "9. Running getAmountOut script..."
npx hardhat run scripts/getAmountOut.ts | tee screenshots/getAmountOut_output.txt

echo ""
echo "10. Running getAmountIn script..."
npx hardhat run scripts/getAmountIn.ts | tee screenshots/getAmountIn_output.txt

echo ""
echo "=== All Uniswap V2 interactions completed! ==="
echo "Check the screenshots folder for output logs of each interaction."