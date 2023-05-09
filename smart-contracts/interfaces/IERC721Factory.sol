// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @dev Required interface of an ERC20 compliant contract.
 */
interface IERC721Factory {

    function deployERC20Contract(
        string memory name_,
        string memory symbol_,
        address minter_, // minter = DT owner = NFT owner
        // address erc721baseaddress_,
        uint256 maxSupply_,
        uint256 initialSupply_
    ) external returns (address erc20Instance);
}