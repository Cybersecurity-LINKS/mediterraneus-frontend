// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @dev Required interface of an ERC20 compliant contract.
 */
interface IERC721Factory {

    function deployERC20Contract(
        string memory name_,
        string memory symbol_,
        address owner_, // minter = DT owner = NFT owner
        // address erc721address_, // should be the calling NFT contract = msg.sender
        uint256 maxSupply_
    ) external returns (address erc20Instance);

    function createdERC20List(address erc20dt) external view returns(address);
    function eRC20_to_owner(address erc20dt) external view returns(address);
    
}