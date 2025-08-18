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

  const amountOut = ethers.parseEther("0.5");
  const path = [USDCAddress, WETHAddress];

  const amounts = await Router.getAmountsIn(amountOut, path);
  console.log("Required USDC input:", ethers.formatUnits(amounts[0].toString(), 6));

  const amountInMax = amounts[0] * BigInt(105) / BigInt(100);

  const approval = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountInMax);
  await approval.wait();
  console.log("USDC approved for swap");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const swap = await Router.connect(impersonatedSigner).swapTokensForExactETH(
    amountOut,
    amountInMax,
    path,
    impersonatedSigner.address,
    deadline
  );

  const tx = await swap.wait();
  console.log("Swap Receipt:", tx?.hash);

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));

  console.log("################### Swap Summary ###########################");
  console.log("USDC Spent:", ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6));
  console.log("ETH Received:", ethers.formatEther((ethBalAfter - ethBal).toString()));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});