// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC7432.sol";
import "./ProposalTypes.sol";


contract DAOGovernance is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    using ProposalTypes for ProposalTypes.ProposalCore;

    // The NFT contract implementing ERC-7432
    IERC7432 public immutable nftContract;
    
    // Role identifiers (should match those in RoleableNFT)
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    Counters.Counter private _proposalIds;


    uint256 public votingDelay = 1 days;       
    uint256 public votingPeriod = 7 days;      
    uint256 public proposalThreshold = 1;      
    uint256 public quorumNumerator = 30;       

   
    mapping(uint256 => ProposalTypes.ProposalCore) public proposals;
    mapping(uint256 => mapping(address => ProposalTypes.Receipt)) public proposalReceipts;

   
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        ProposalTypes.VoteType support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    modifier onlyRole(bytes32 role) {
        require(hasAnyTokenWithRole(msg.sender, role), "DAOGovernance: insufficient role");
        _;
    }

    modifier onlyAdmin() {
        require(
            hasAnyTokenWithRole(msg.sender, ADMIN_ROLE) || msg.sender == owner(),
            "DAOGovernance: admin role required"
        );
        _;
    }

    constructor(address _nftContract) {
        require(_nftContract != address(0), "DAOGovernance: invalid NFT contract");
        nftContract = IERC7432(_nftContract);
    }

  
    function propose(
        string memory _title,
        string memory _description,
        address[] memory _targets,
        uint256[] memory _values,
        bytes[] memory _calldatas
    ) external onlyRole(PROPOSER_ROLE) returns (uint256) {
        require(bytes(_title).length > 0, "DAOGovernance: empty title");
        require(bytes(_description).length > 0, "DAOGovernance: empty description");
        require(_targets.length == _values.length, "DAOGovernance: length mismatch");
        require(_values.length == _calldatas.length, "DAOGovernance: length mismatch");
        require(_targets.length > 0, "DAOGovernance: empty proposal");

        uint256 proposalId = _proposalIds.current();
        _proposalIds.increment();

        uint256 startTime = block.timestamp + votingDelay;
        uint256 endTime = startTime + votingPeriod;

        bytes32 descriptionHash = keccak256(bytes(_description));

        proposals[proposalId] = ProposalTypes.ProposalCore({
            proposer: msg.sender,
            id: proposalId,
            title: _title,
            description: _description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            canceled: false,
            targets: _targets,
            values: _values,
            calldatas: _calldatas,
            descriptionHash: descriptionHash
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _description,
            startTime,
            endTime
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param _proposalId The ID of the proposal
     * @param _support The vote type (0=Against, 1=For, 2=Abstain)
     */
    function castVote(
        uint256 _proposalId,
        uint8 _support
    ) external onlyRole(VOTER_ROLE) returns (uint256) {
        require(_support <= 2, "DAOGovernance: invalid vote type");
        
        return _castVote(_proposalId, msg.sender, ProposalTypes.VoteType(_support));
    }

  
    function execute(uint256 _proposalId) external payable onlyRole(EXECUTOR_ROLE) {
        ProposalTypes.ProposalState state = getProposalState(_proposalId);
        require(state == ProposalTypes.ProposalState.Succeeded, "DAOGovernance: proposal not succeeded");

        ProposalTypes.ProposalCore storage proposal = proposals[_proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "DAOGovernance: execution failed");
        }

        emit ProposalExecuted(_proposalId);
    }

    function cancel(uint256 _proposalId) external {
        ProposalTypes.ProposalCore storage proposal = proposals[_proposalId];
        require(
            msg.sender == proposal.proposer || hasAnyTokenWithRole(msg.sender, ADMIN_ROLE),
            "DAOGovernance: unauthorized to cancel"
        );
        require(!proposal.executed, "DAOGovernance: cannot cancel executed proposal");

        proposal.canceled = true;
        emit ProposalCanceled(_proposalId);
    }


    function getProposalState(uint256 _proposalId) public view returns (ProposalTypes.ProposalState) {
        ProposalTypes.ProposalCore storage proposal = proposals[_proposalId];
        
        if (proposal.canceled) {
            return ProposalTypes.ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalTypes.ProposalState.Executed;
        }

        if (block.timestamp < proposal.startTime) {
            return ProposalTypes.ProposalState.Pending;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalTypes.ProposalState.Active;

        if (_quorumReached(_proposalId) && _voteSucceeded(_proposalId)) {
            return ProposalTypes.ProposalState.Succeeded;
        } else {
            return ProposalTypes.ProposalState.Defeated;
        }
    }

   
    function getVotingPower(address _account) public view returns (uint256) {
        uint256 votingPower = 0;
    
        if (hasAnyTokenWithRole(_account, VOTER_ROLE)) {
            votingPower = 1; // Each voter role gives 1 vote
        }
        
        return votingPower;
    }

    function hasAnyTokenWithRole(address _account, bytes32 _role) public view returns (bool) {
       
        for (uint256 tokenId = 0; tokenId < 1000; tokenId++) {
            try nftContract.