// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721Base {
    event NFTminted(
        address indexed owner,
        string name, 
        string symbol,
        address factory
    ); 

    function initialize(
        address owner,
        string calldata name, 
        string calldata symbol,
        address factory,
        string memory _tokenURI,
        uint256 initialPrice
    ) external;

    function getNFTname() external view returns(string memory);
    function getNFTsymbol() external view returns(string memory);
    function getNFTowner() external view returns (address owner);
}