// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC7432 {
    struct RoleData {
        address user;          
        uint64 expirationDate; 
        bool revocable;
        bytes data;             
    }

    /** Events **/
    event RoleGranted(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed grantor,
        address user,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed revoker,
        address user
    );

    
    //external functions
    function grantRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external;

    function revokeRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external;


    function hasRole(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view returns (bool);

    
    function roleData(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view returns (RoleData memory);

    function roleExpirationDate(
        bytes32 _role,
        uint256 _tokenId,
        address _user
    ) external view returns (uint64);
}