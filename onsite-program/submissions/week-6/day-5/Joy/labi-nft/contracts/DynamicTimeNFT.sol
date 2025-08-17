// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicTimeNFT is ERC721 {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("Dynamic Time NFT", "DTNFT") {}
    
    function mint(address to) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name": "Dynamic Time NFT #', tokenId.toString(), '",',
                            '"description": "An NFT that shows the current blockchain time",',
                            '"image": "', _generateSVG(), '"}'
                        )
                    )
                )
            )
        );
    }
    
    function _generateSVG() internal view returns (string memory) {
        uint256 timestamp = block.timestamp;
        uint256 h = (timestamp / 3600) % 24;
        uint256 m = (timestamp / 60) % 60;
        uint256 s = timestamp % 60;
        uint256 hue = (h * 15) % 360;
        
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                            '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                            '<stop offset="0%" style="stop-color:hsl(', hue.toString(), ',70%,40%);stop-opacity:1" />',
                            '<stop offset="100%" style="stop-color:hsl(', ((hue + 60) % 360).toString(), ',70%,60%);stop-opacity:1" />',
                            '</linearGradient></defs>',
                            '<rect width="400" height="400" fill="url(#bg)" />',
                            '<circle cx="200" cy="200" r="120" fill="none" stroke="white" stroke-width="4" opacity="0.3"/>',
                            '<text x="200" y="180" text-anchor="middle" font-family="monospace" font-size="32" fill="white" font-weight="bold">',
                            _padZero(h), ':', _padZero(m), ':', _padZero(s),
                            '</text>',
                            '<text x="200" y="220" text-anchor="middle" font-family="monospace" font-size="16" fill="white" opacity="0.8">',
                            'Block Time: ', timestamp.toString(),
                            '</text>',
                            '<text x="200" y="280" text-anchor="middle" font-family="monospace" font-size="14" fill="white" opacity="0.6">',
                            'Dynamic Time NFT',
                            '</text>',
                            '</svg>'
                        )
                    )
                )
            )
        );
    }
    
    function _padZero(uint256 value) internal pure returns (string memory) {
        if (value < 10) {
            return string(abi.encodePacked("0", value.toString()));
        }
        return value.toString();
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}