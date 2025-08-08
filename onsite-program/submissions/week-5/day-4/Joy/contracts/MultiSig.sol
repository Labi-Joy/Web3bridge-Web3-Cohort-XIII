// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MultiSig {
   address[] public owners; //since 3 people have to sign the contract
   uint public txCount;
   uint public required;

   struct Tx {             //tx means transaction
       address payable target;
       uint value;
       bool executed;
       bytes data;
   }

   mapping(uint => Tx) public txs;
   mapping(uint => mapping(address => bool)) public confirmedtxs;

   receive() payable external {}

   function executeTx(uint txId) public {
        require(isConfirmed(txId), "Transaction not confirmed");
        Tx storage _tx = txs[txId];
        require(!_tx.executed, "Transaction already executed");
        
        (bool success, ) = _tx.target.call{value: _tx.value}(_tx.data);
        require(success, "Transaction execution failed");
        _tx.executed = true;
   }

   function isConfirmed(uint txId) public view returns(bool) {
        return getConfirmedtxCount(txId) >= required;
   } 

   function getConfirmedtxCount(uint txId) public view returns(uint) {
        uint count = 0;
        for(uint i = 0; i < owners.length; i++) {
            if(confirmedtxs[txId][owners[i]]) {
                count++;
            }
        }
        return count;
   }

   function isOwner(address addr) public view returns(bool) {
        for(uint i = 0; i < owners.length; i++) {
            if(owners[i] == addr) {
                return true;
            }
        }
        return false;
   }

   function confirmTx(uint txId) public {
        require(isOwner(msg.sender), "Not an owner");
        require(txId < txCount, "Transaction does not exist");
        require(!confirmedtxs[txId][msg.sender], "Transaction already confirmed by sender");
        
        confirmedtxs[txId][msg.sender] = true;
        
        if(isConfirmed(txId)) {
            executeTx(txId);
        }
    }

    function addTx(address payable target, uint value, bytes calldata data) public returns(uint) {
        require(isOwner(msg.sender), "Not an owner");
        txs[txCount] = Tx(target, value, false, data);
        txCount += 1;
        return txCount - 1;
    }

    constructor(address[] memory _owners, uint _confirmedtxs) {
        require(_owners.length > 0, "Must have at least one owner");
        require(_confirmedtxs > 0, "Required confirmations must be greater than 0");
        require(_confirmedtxs <= _owners.length, "Required confirmations cannot exceed number of owners");
        
        // Check for duplicate owners
        for(uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            for(uint j = i + 1; j < _owners.length; j++) {
                require(_owners[i] != _owners[j], "Duplicate owner");
            }
        }
        
        owners = _owners;
        required = _confirmedtxs;
    }
}