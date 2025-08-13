// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC7432.sol";


contract RoleableNFT is ERC721, ERC721Enumerable, Ownable, IERC7432 {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;

    // Mapping from role => tokenId => user => RoleData
    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roleData;

    // DAO role identifiers
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

   
    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

  
    function batchMint(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i]);
        }
    }

   
    function grantRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external override {
        require(_exists(_tokenId), "RoleableNFT: token does not exist");
        require(
            _isApprovedOrOwner(_msgSender(), _tokenId) || owner() == _msgSender(),
            "RoleableNFT: caller is not owner nor approved"
        );
        require(_user != address(0), "RoleableNFT: user cannot be zero address");
        require(
            _expirationDate == 0 || _expirationDate > block.timestamp,
            "RoleableNFT: expiration date must be in the future or zero (permanent)"
        );

        _roleData[_role][_tokenId][_user] = RoleData({
            user: _user,
            expirationDate: _expirationDate,
            revocable: _revocable,
            data: _data
        });

        emit RoleGranted(_role, _tokenId, _msgSender(), _user, _expirationDate, _revocable, _data);
    }

 
    function revokeRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external override {
        require(_exists(_tokenId), "RoleableNFT: token does not exist");
        
        RoleData storage role = _roleData[_role][_tokenId][_user];
        require(role.user == _user, "RoleableNFT: role does not exist");
        require(role.revocable, "RoleableNFT: role is not revocable");
        require(
            _isApprovedOrOwner(_msgSender(), _tokenId) || 
            owner() == _msgSender() || 
            _msgSender() == _user,
            "RoleableNFT: caller is not authorized to revoke"
        );

        delete _roleData[_role][_tokenId][_user];
        emit RoleRevoked(_role, _tokenId, _msgSender(), _user);
    }

   
    function hasRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view override returns (bool) {
        if (!_exists(_tokenId)) return false;
        
        RoleData storage role = _roleData[_role][_tokenId][_user];
        if (role.user != _user) return false;
        
        // Check if role has expired
        if (role.expirationDate != 0 && role.expirationDate <= block.timestamp) {
            return false;
        }
        
        return true;
    }

   
    function roleData(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view override returns (RoleData memory) {
        return _roleData[_role][_tokenId][_user];
    }

    
    function roleExpirationDate(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view override returns (uint64) {
        return _roleData[_role][_tokenId][_user].expirationDate;
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return 
            interfaceId == type(IERC7432).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}