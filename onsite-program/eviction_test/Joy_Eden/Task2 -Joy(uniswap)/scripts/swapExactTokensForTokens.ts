import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);

  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("################### Initial Balance Info ###########################");
  console.log("User Initial USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("User Initial DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const amountIn = ethers.parseUnits("1000", 6);
  const path = [USDCAddress, DAIAddress];

  const amounts = await Router.getAmountsOut(amountIn, path);
  console.log("Expected DAI output:", ethers.formatUnits(amounts[1].toString(), 18));

  const approval = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn);
  await approval.wait();
  console.log("USDC approved for swap");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const amountOutMin = amounts[1] * BigInt(95) / BigInt(100);

  const swap = await Router.connect(impersonatedSigner).swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    impersonatedSigner.address,
    deadline
  );

  const tx = await swap.wait();
  console.log("Swap Receipt:", tx?.hash);

  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("User Final DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));

  console.log("################### Swap Summary ###########################");
  console.log("USDC Spent:", ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBalAfter - daiBal).toString(), 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});