// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const Erc_20Module = buildModule("Erc_20Module", (m) => {

  const _name = "LabiToken";
  const _symbol = "LABI";
  const _decimals = 18; 
  const _totalSupply = 100000

  const erc_20 = m.contract("ERC20", [_name, _symbol, _decimals, _totalSupply]);

  return { erc_20 };
});

export default Erc_20Module;
