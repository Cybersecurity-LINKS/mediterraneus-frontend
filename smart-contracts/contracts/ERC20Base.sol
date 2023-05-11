// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "../interfaces/IERC721Base.sol";

contract ERC20Base is
    Initializable,
    ERC20Upgradeable {

    using SafeMathUpgradeable for uint256;

    address private _erc721address;
    address private _allowedMinter;
    uint256 private _maxSupply;
    
    // token price for SMR
    uint256 public tokensPerSMR = 100;

    event BuyDT(address from, address buyer, uint256 amountOfSMR, uint256 amountOfTokens);
    event InitializedDT(string name, string symbol, address owner, uint256 initialSupply);
    event NewMint(address to, uint256 amount);

    mapping(address => uint256) public nonces_;

    modifier onlyNFTOwner() {
        require(msg.sender == IERC721Base(_erc721address).getNFTowner());
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address minter_, // minter = DT owner = NFT owner
        address erc721address_,
        uint256 maxSupply_,
        uint256 initialSupply_
    ) external initializer returns (bool){
        require(minter_ != address(0), "Minter cannot be 0x00!");
        require(
            minter_ != address(this),
            "Minter cannot be the contract address itself"
        );
        require(minter_ == IERC721Base(erc721address_).getNFTowner(), "NOT THE NFT OWNER");
        require(
            erc721address_ != address(0),
            "ERC721Factory address cannot be 0x00!"
        );
        require(maxSupply_ > 0, "The maximum supply must be > 0");
        require(initialSupply_ >= 0, "The initial supply cannot be negative");
        require(initialSupply_ <= maxSupply_, "The initial supply cannot exeed the total cap");

        __ERC20_init(name_, symbol_);
        _erc721address = erc721address_;
        _allowedMinter = minter_;
        _maxSupply = maxSupply_;
        /**
         * minting is safe because we first check that the provided
         * minter_ address is actually also the NFT owner.
         * ERC20 tokens have 18 decimals => Number of tokens minted = n * 10^18
         * This way the decimals are transparent to the clients.
         */
        _mint(_allowedMinter, initialSupply_ * 10 ** decimals());
        require(
            totalSupply() == initialSupply_ * 10 ** decimals(),
            "Initial minting error: totalSupply does not match initialSupply"
        );
        require(
            balanceOf(_allowedMinter) == initialSupply_ * 10 ** decimals(),
            "Minting of datatoken failed"
        );
        nonces_[_allowedMinter] = 0;
        emit InitializedDT(name_, symbol_, minter_, initialSupply_);
        return true;
    }

    function myMint(address account, uint256 amount) external {
        require(account == IERC721Base(_erc721address).getNFTowner(), "NOT THE NFT OWNER = NOT A MINTER");
        require(totalSupply().add(amount) <= _maxSupply, "Cannot exeed the cap");
        _mint(account, amount * 10 ** decimals());
        emit NewMint(account, amount);
    }

    /**
    *  Allow users to buy data tokens for SMR
    */
    function buyDT() public payable returns (uint256 amountToBuy) {
        require(msg.sender != address(0), "Invalid 0 address");
        require(msg.value > 0, "Send SMR to buy Data Tokens. Received 0 SMR");

        amountToBuy = msg.value * tokensPerSMR;
        // TODO: If not enough minted DTs trigger the minting of some tokens
        // only if the MAX_SUPPLY has not been reached yet.
        require(
            balanceOf(_allowedMinter) >= amountToBuy, 
            "Not enough remained minted Data Tokens. Cannot sell user's requested amount"
        );

        (bool sent) = transfer(msg.sender, amountToBuy);
        require(sent, "Failed to transfer Data Tokens to user");

        emit BuyDT(_allowedMinter, msg.sender, msg.value, amountToBuy);
        return amountToBuy;
    }

    function getAllowedMinter() external view returns (address) {
        return _allowedMinter;
    } 

    /**
    * Allow the (NFT owner/DT owner) of the contract to withdraw SMR
    */
    function withdraw() public onlyNFTOwner {
        require(address(this).balance > 0, "No balance to withdraw");
        (bool sent,) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to withdraw");
    }

    function burn(uint256 amount) external {
        require(msg.sender == _allowedMinter, "NOT ALLOWED TO BURN");
        _burn(msg.sender, amount);
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
        (bytes32 domain) = keccak256(
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
        require(owner == IERC721Base(_erc721address).getNFTowner(), "Owner not the NFT owner");
        uint256 nonceBefore = nonces_[owner];
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
                    nonceBefore,
                    deadline
                ))
            )
        );
        nonces_[owner] += 1;
        require(nonces_[owner] == nonceBefore + 1, "ERC20Base: permit did not succeed. Nonce mismatch!");

        address recoveredAddress = ecrecover(digest, v, r, s); 
        require(
            recoveredAddress != address(0) && recoveredAddress == owner, 
            "ERC20 datatoken: INVALID SIGNATURE IN ERC20-PERMIT"
        );

        _approve(owner, spender, value);
    }

    /**
     * @dev fallback function
     *      this is a default fallback function in which receives
     *      the collected ether.
     */
    fallback() external payable {}

    /**
     * @dev receive function
     *      this is a default receive function in which receives
     *      the collected ether.
     */
    receive() external payable {}
}