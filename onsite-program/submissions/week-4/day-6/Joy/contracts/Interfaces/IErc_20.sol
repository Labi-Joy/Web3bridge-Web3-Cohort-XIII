// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint256); //to check total number of tokens in circulation

    function balanceOf(address account) external view returns (uint256); //to check the token balance of a specific account

    function transfer( //transfer tokens from the sender to a recipient
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance( //to check the amount of tokens that an owner has allowed a spender to use
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool); //gives permission to a spender to transfer tokens on behalf of the owner

    function transferFrom( //allows spending of tokens on behalf of the owner
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    // Additional functions for your contract
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function owner() external view returns (address);
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}