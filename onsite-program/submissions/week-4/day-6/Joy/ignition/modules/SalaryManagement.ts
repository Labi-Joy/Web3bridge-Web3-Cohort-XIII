// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SalaryManagementModule = buildModule("SalaryManagementModule", (m) => {

  const manageSalary = m.contract("StaffManagement");

  return { manageSalary };
});

export default SalaryManagementModule;
