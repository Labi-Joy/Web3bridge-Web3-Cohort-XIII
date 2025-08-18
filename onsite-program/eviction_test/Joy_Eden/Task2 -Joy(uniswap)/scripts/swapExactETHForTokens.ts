import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);

  const ethBal = await ethers.provider.getBalance(AssetHolder);
  const usdcBal = await USDC.balanceOf(AssetHolder);

  console.log("################### Initial Balance Info ###########################");
  console.log("User Initial ETH Balance:", ethers.formatEther(ethBal.toString()));
  console.log("User Initial USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const amountIn = ethers.parseEther("1.0");
  const path = [WETHAddress, USDCAddress];

  const amounts = await Router.getAmountsOut(amountIn, path);
  console.log("Expected USDC output:", ethers.formatUnits(amounts[1].toString(), 6));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const amountOutMin = amounts[1] * BigInt(95) / BigInt(100);

  const swap = await Router.connect(impersonatedSigner).swapExactETHForTokens(
    amountOutMin,
    path,
    impersonatedSigner.address,
    deadline,
    { value: amountIn }
  );

  const tx = await swap.wait();
  console.log("Swap Receipt:", tx?.hash);

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));

  console.log("################### Swap Summary ###########################");
  console.log("ETH Spent:", ethers.formatEther((ethBal - ethBalAfter).toString()));
  console.log("USDC Received:", ethers.formatUnits((usdcBalAfter - usdcBal).toString(), 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});