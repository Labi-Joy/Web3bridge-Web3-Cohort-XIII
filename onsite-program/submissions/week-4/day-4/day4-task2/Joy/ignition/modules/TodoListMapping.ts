// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TodoListMappingModule = buildModule("TodoListMappingModule", (m) => {
  

  const todolistmap = m.contract("TodoList");

  return {todolistmap };
});

export default TodoListMappingModule;
