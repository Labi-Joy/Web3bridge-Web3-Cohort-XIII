// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const EmployeeAccessModule = buildModule("EmployeeAccessModule", (m) => {
  

  const Employ = m.contract("EmployAccess");

  return { Employ };
});

export default EmployeeAccessModule;
