// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IPFSTimeNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to IPFS hash
    mapping(uint256 => string) private _tokenURIs;
    
    // Base URI for IPFS gateway
    string private _baseTokenURI = "https://gateway.pinata.cloud/ipfs/";
    
    constructor() ERC721("IPFS Time NFT", "ITNFT") Ownable(msg.sender) {}
    
    function mint(address to, string memory ipfsHash) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        return tokenId;
    }
    
    function mintBatch(address to, string[] memory ipfsHashes) public onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](ipfsHashes.length);
        
        for (uint256 i = 0; i < ipfsHashes.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, ipfsHashes[i]);
            tokenIds[i] = tokenId;
        }
        
        return tokenIds;
    }
    
    function _setTokenURI(uint256 tokenId, string memory ipfsHash) internal {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = ipfsHash;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory ipfsHash = _tokenURIs[tokenId];
        require(bytes(ipfsHash).length > 0, "Token URI not set");
        
        return string(abi.encodePacked(_baseTokenURI, ipfsHash));
    }
    
    function setTokenURI(uint256 tokenId, string memory ipfsHash) public onlyOwner {
        _setTokenURI(tokenId, ipfsHash);
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    function getBaseURI() public view returns (string memory) {
        return _baseTokenURI;
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}