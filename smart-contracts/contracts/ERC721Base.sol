// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../interfaces/IERC721Base.sol";
import "../interfaces/IERC721Factory.sol";

contract ERC721Base is 
    Initializable, 
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable {
    
    using SafeMathUpgradeable for uint256;

    address private _factory;
    uint256 private _price;

    address[] private deployedERC20Tokens;

    event NFTminted(
        address indexed owner,
        string name, 
        string symbol,
        address factory
    );  

    event NFTpriceUpdated(
        address indexed owner,
        string name, 
        string symbol,
        uint256 oldPrice,
        uint256 newPrice
    );  

    modifier onlyNFTOwner() {
        require(msg.sender == ownerOf(1), "Not the NFT owner!");
        _;
    }

    function initialize(
        address owner,
        string calldata name, 
        string calldata symbol,
        address factory,
        string memory _tokenURI,
        uint256 initialPrice
    ) external initializer {
        require(owner != address(0), "Invalid NFT owner: zero address not valid!");

        __ERC721_init(name, symbol);
        _factory = factory;
        _price = initialPrice;
        safeMint(owner, _tokenURI);

        emit NFTminted(owner, name, symbol, _factory);
    }

    function safeMint(address to, string memory _tokenURI) internal {
        _safeMint(to, 1);
        _setTokenURI(1, _tokenURI);
    }

    function createDataToken(
        string memory name,
        string memory symbol,
        // address owner should be already msg.sender
        // erc721baseaddress_ provided by the factory contract
        uint256 maxSupply_,
        uint256 initialSupply_
    ) external onlyNFTOwner returns (address erc20token) {
        require(maxSupply_ > 0 && initialSupply_ >= 0, "Cap and initial supply not valid");
        // already checked by the onlyNFTOwner modifier
        // require(msg.sender != address(0), "ERC721Base: Minter cannot be address(0)");

        erc20token = IERC721Factory(_factory).deployERC20Contract(
            name,
            symbol,
            msg.sender,
            maxSupply_,
            initialSupply_
        );
        deployedERC20Tokens.push(erc20token);
        return erc20token;
    }

    function setPrice(uint256 price_) external onlyNFTOwner {
        require(price_ >= 0, "NFT cost cannot be negative");
        require(price_!= _price, "New price equal to old price!");
        uint256 oldPrice = _price;
        _price = price_;
        emit NFTpriceUpdated(
            ownerOf(1),
            name(), 
            symbol(),
            oldPrice,
            _price
        ); 
    }

    function getNFTname() external view returns(string memory) {
        return name();
    }

    function getNFTsymbol() external view returns(string memory) {
        return symbol();
    }

    function getNFTowner() external view returns (address owner) {
        return ownerOf(1);
    }

    function buyNFT(uint256 tokenId) external payable{
        address _owner = ownerOf(1);
        require(msg.sender != address(0), "Invalid Address(0)");
        require(msg.sender != _owner, "Cannot sell NFT to myself");
        require(tokenId == 1, "Cannot transfer this tokenId");
        require(msg.value >= _price, "Not enough funds to buy this awesome NFT");
        _transfer(_owner, msg.sender, tokenId);
        _owner = msg.sender;
        payable(_owner).transfer(msg.value);
    }

    function getNFTprice() external view returns(uint256) {
        return _price;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721URIStorageUpgradeable, ERC721Upgradeable) onlyNFTOwner {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorageUpgradeable, ERC721Upgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
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