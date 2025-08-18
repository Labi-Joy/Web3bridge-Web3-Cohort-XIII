import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  console.log("USDC/DAI Pair Address:", pairAddress);

  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);

  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);
  const lpBalance = await Pair.balanceOf(AssetHolder);

  console.log("################### Initial Balance Info ###########################");
  console.log("User Initial USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("User Initial DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log("User LP Token Balance:", ethers.formatUnits(lpBalance.toString(), 18));

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const liquidityToRemove = ethers.parseUnits("100000", 18);

  const approvalLP = await Pair.connect(impersonatedSigner).approve(UNIRouter, liquidityToRemove);
  const tx = await approvalLP.wait();
  console.log("LP Token approval receipt:", tx?.hash);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const removeLiquidity = await Router.connect(impersonatedSigner).removeLiquidity(
    USDCAddress,
    DAIAddress,
    liquidityToRemove,
    1,
    1,
    impersonatedSigner.address,
    deadline
  );

  const tx2 = await removeLiquidity.wait();
  console.log("Remove Liquidity Receipt:", tx2?.hash);

  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);
  const lpBalanceAfter = await Pair.balanceOf(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("User Final DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
  console.log("User Final LP Token Balance:", ethers.formatUnits(lpBalanceAfter.toString(), 18));

  console.log("################### Change in Balances ###########################");
  console.log("USDC Change:", ethers.formatUnits((usdcBalAfter - usdcBal).toString(), 6));
  console.log("DAI Change:", ethers.formatUnits((daiBalAfter - daiBal).toString(), 18));
  console.log("LP Token Change:", ethers.formatUnits((lpBalanceAfter - lpBalance).toString(), 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});