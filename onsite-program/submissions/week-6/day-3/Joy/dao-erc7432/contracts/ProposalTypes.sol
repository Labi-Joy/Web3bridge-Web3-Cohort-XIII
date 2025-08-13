// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library ProposalTypes {
    enum ProposalState {
        Pending,   
        Active,     
        Succeeded,  
        Defeated,   
        Executed,  
        Canceled    
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct ProposalCore {
        address proposer;
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bytes32 descriptionHash;
    }

    struct Receipt {
        bool hasVoted;
        VoteType support;
        uint96 votes;
    }
}