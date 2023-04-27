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
        string memory _tokenURI
    ) external returns (bool);

    function getNFTname() external view returns(string memory);
    function getNFTsymbol() external view returns(string memory);
    function getNFTOwner(uint256 tokenID) external view returns(address);
    function changeNFTOwnership(address from, address to, uint256 tokenId) external;
}