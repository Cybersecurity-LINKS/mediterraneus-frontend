// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ERC20Template is ERC20, ERC20Burnable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeMath for string;
    using SafeERC20 for IERC20;

    address private _erc721base;
    address private _allowedMinter;
    uint256 private _maxSupply;

    bool private initialized = false;

    mapping(address => uint256) public nonces_;

    modifier ifNotInitialized() {
        require(
            initialized == false,
            "ERC20Base: data fungible token already initalized!"
        );
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address minter_,
        address erc721baseaddress_,
        uint256 maxSupply_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) {
        require(minter_ != address(0), "Minter cannot be 0x00!");
        require(
            minter_ != address(this),
            "Minter cannot be the contract address itself"
        );
        require(
            erc721baseaddress_ != address(0),
            "ERC721Factory address cannot be 0x00!"
        );
        require(maxSupply_ > 0, "The maximum supply must be > 0");
        require(initialSupply_ >= 0, "The initial supply cannot be negative");

        _erc721base = erc721baseaddress_;
        _allowedMinter = minter_;
        _maxSupply = maxSupply_;
        _mint(_allowedMinter, initialSupply_);
        require(
            totalSupply() == initialSupply_,
            "Initial minting error: totalSupply does not match initialSuuply"
        );
        require(
            balanceOf(_allowedMinter) == initialSupply_,
            "Minting of datatoken failed"
        );
    }

    /*
        Support for EIP-2612 
        https://eips.ethereum.org/EIPS/eip-2612
        https://soliditydeveloper.com/erc20-permit
    */

    function DOMAIN_SEPARATOR() internal view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        bytes32 domain = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name())),
                keccak256(bytes("1")), // version, could be any other value
                chainId,
                address(this)
            )
        );
        return domain;
    }


    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.number, "ERC20DT EXPIRED");
        bytes32 domain_separator = DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(
            abi.encodePacked(
                hex"1901",
                domain_separator,
                keccak256(abi.encode(
                    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                    owner,
                    spender,
                    value,
                    nonces_[owner]++,
                    deadline
                ))
            )
        );

        address recoveredAddress = ecrecover(digest, v, r, s); 
        require(
            recoveredAddress != address(0) && recoveredAddress == owner, 
            "ERC20 datatoken: INVALID SIGNATURE IN ERC20-PERMIT"
        );

        _approve(owner, spender, value);
    }

}