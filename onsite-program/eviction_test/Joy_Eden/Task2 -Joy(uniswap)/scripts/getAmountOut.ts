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

  console.log("################### getAmountOut Test ###########################");
  
  const amountIn = ethers.parseUnits("1000", 6);
  console.log("Input Amount (USDC):", ethers.formatUnits(amountIn.toString(), 6));

  const amountOut = await Router.getAmountOut(amountIn, reserveIn, reserveOut);
  console.log("Output Amount (DAI):", ethers.formatUnits(amountOut.toString(), 18));

  const path = [USDCAddress, DAIAddress];
  const amounts = await Router.getAmountsOut(amountIn, path);
  console.log("Expected amounts from getAmountsOut:");
  console.log("  Input (USDC):", ethers.formatUnits(amounts[0].toString(), 6));
  console.log("  Output (DAI):", ethers.formatUnits(amounts[1].toString(), 18));

  console.log("################### Price Impact Analysis ###########################");
  const smallAmount = ethers.parseUnits("100", 6);
  const mediumAmount = ethers.parseUnits("1000", 6);
  const largeAmount = ethers.parseUnits("10000", 6);

  const smallAmountOut = await Router.getAmountOut(smallAmount, reserveIn, reserveOut);
  const mediumAmountOut = await Router.getAmountOut(mediumAmount, reserveIn, reserveOut);
  const largeAmountOut = await Router.getAmountOut(largeAmount, reserveIn, reserveOut);

  console.log("Small swap (100 USDC):", ethers.formatUnits(smallAmountOut.toString(), 18), "DAI");
  console.log("Medium swap (1000 USDC):", ethers.formatUnits(mediumAmountOut.toString(), 18), "DAI");
  console.log("Large swap (10000 USDC):", ethers.formatUnits(largeAmountOut.toString(), 18), "DAI");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});