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
        string calldata name_, 
        string calldata symbol_,
        address factory,
        string memory _tokenURI
    ) external returns(bool);

    function getNFTowner() external view returns (address owner);
}