import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigModule = buildModule("MultiSigModule", (m) => {
 
  const owners = [
    "0xacD18FaF6466690Da79927398E0B6C58c35Dd530", // Owner 1
    "0xD3a17f1d2F28B14B93617e578C7C1297C5C6F7a4", // Owner 2  
    "0xe2dEA9139685C07e0723aD51a071EFDd3642ba8d", // Owner 3
  ];

  const requiredConfirmations = 2;    // Number of required confirmations (e.g., 2 out of 3 owners must confirm)

  const multiSig = m.contract("MultiSig", [owners, requiredConfirmations]);

  return { multiSig };
});

export default MultiSigModule;