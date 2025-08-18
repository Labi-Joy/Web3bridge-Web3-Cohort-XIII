import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  console.log("USDC/DAI Pair Address:", pairAddress);

  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
  const reserves = await Pair.getReserves();
  
  const token0 = await Pair.token0();
  const token1 = await Pair.token1();
  
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Reserve0:", reserves[0].toString());
  console.log("Reserve1:", reserves[1].toString());

  let reserveIn, reserveOut;
  if (token0.toLowerCase() === USDCAddress.toLowerCase()) {
    reserveIn = reserves[0];
    reserveOut = reserves[1];
    console.log("USDC is token0, DAI is token1");
  } else {
    reserveIn = reserves[1];
    reserveOut = reserves[0];
    console.log("DAI is token0, USDC is token1");
  }

  console.log("################### getAmountIn Test ###########################");
  
  const amountOut = ethers.parseUnits("1000", 18);
  console.log("Desired Output Amount (DAI):", ethers.formatUnits(amountOut.toString(), 18));

  const amountIn = await Router.getAmountIn(amountOut, reserveIn, reserveOut);
  console.log("Required Input Amount (USDC):", ethers.formatUnits(amountIn.toString(), 6));

  const path = [USDCAddress, DAIAddress];
  const amounts = await Router.getAmountsIn(amountOut, path);
  console.log("Expected amounts from getAmountsIn:");
  console.log("  Required Input (USDC):", ethers.formatUnits(amounts[0].toString(), 6));
  console.log("  Output (DAI):", ethers.formatUnits(amounts[1].toString(), 18));

  console.log("################### Reverse Direction Test ###########################");
  
  const daiAmount = ethers.parseUnits("500", 18);
  console.log("Desired Output Amount (USDC):", ethers.formatUnits(daiAmount.toString(), 6));

  let reserveInReverse, reserveOutReverse;
  if (token0.toLowerCase() === DAIAddress.toLowerCase()) {
    reserveInReverse = reserves[0];
    reserveOutReverse = reserves[1];
  } else {
    reserveInReverse = reserves[1];
    reserveOutReverse = reserves[0];
  }

  const daiInput = await Router.getAmountIn(ethers.parseUnits("500", 6), reserveInReverse, reserveOutReverse);
  console.log("Required DAI Input for 500 USDC:", ethers.formatUnits(daiInput.toString(), 18));

  const reversePath = [DAIAddress, USDCAddress];
  const reverseAmounts = await Router.getAmountsIn(ethers.parseUnits("500", 6), reversePath);
  console.log("Expected amounts from getAmountsIn (DAI->USDC):");
  console.log("  Required Input (DAI):", ethers.formatUnits(reverseAmounts[0].toString(), 18));
  console.log("  Output (USDC):", ethers.formatUnits(reverseAmounts[1].toString(), 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});