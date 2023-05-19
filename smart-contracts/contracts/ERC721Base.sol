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

    event TokenCreated(
        string name,
        string symbol,
        address owner,
        address erc721address_, 
        address newERC20Address,
        uint256 maxSupply_,
        uint256 initialSupply_
    );

    modifier onlyNFTOwner() {
        require(msg.sender == ownerOf(1), "Not the NFT owner!");
        _;
    }

    function initialize(
        address owner,
        string calldata name_, 
        string calldata symbol_,
        address factory,
        string memory _tokenURI,
        uint256 initialPrice
    ) external initializer returns(bool) {
        require(owner != address(0), "Invalid NFT owner: zero address not valid!");

        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        _factory = factory;
        _price = initialPrice;
        _safeMint(owner, 1);
        _setTokenURI(1, _tokenURI);
        emit NFTminted(owner, name_, symbol_, _factory);
        return true;
    }

    function createDataToken(
        string calldata name,
        string calldata symbol,
        // address owner should be already msg.sender
        // address erc721address_, // it is the NFT contract that is calling the factory function. So it will be msg.sender on the other side
        uint256 maxSupply_
    ) external onlyNFTOwner returns (address erc20token) {
        require(maxSupply_ > 0, "Cap and initial supply not valid");
        // already checked by the onlyNFTOwner modifier
        // require(msg.sender != address(0), "ERC721Base: Minter cannot be address(0)");

        erc20token = IERC721Factory(_factory).deployERC20Contract(
            name,
            symbol,
            msg.sender, // == new DT owner = NFTowner
            maxSupply_
        );
        deployedERC20Tokens.push(erc20token);
        emit TokenCreated(name, symbol, msg.sender, address(this), erc20token, 0, maxSupply_);
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

    function getDTaddress() external view returns (address erc20address) {
        return deployedERC20Tokens[0];
    }

    // The following functions are overrides required by Solidity.
    function burn(uint256 tokenId) external onlyNFTOwner {
        _burn(tokenId);
    }


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