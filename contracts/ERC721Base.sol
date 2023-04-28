// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IERC721Base.sol";

contract ERC721Base is 
    ERC721("Base", "BaseSymbol"), 
    ERC721URIStorage, 
    ERC721Burnable {
    
    using SafeMath for uint256;

    address private _owner;
    string private _name;
    string private _symbol;
    address private _factory;
    bool private initialized = false;

    event NFTminted(
        address indexed owner,
        string name, 
        string symbol,
        address factory
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
        string memory _tokenURI
    ) external returns (bool) {
        require(owner != address(0), "Invalid NFT owner: zero address not valid!");
        require(!initialized, "ERC721 Token instance already initialized");

        _owner = owner;
        _name = name;
        _symbol = symbol;
        new ERC721(_name, _symbol);
        _factory = factory;
        safeMint(_owner, _tokenURI);
        initialized = true;

        emit NFTminted(_owner, _name, _symbol, _factory);
        return initialized;
    }

    function safeMint(address to, string memory _tokenURI) internal {
        require(!initialized, "ERC721 Token instance already initialized");
        _safeMint(to, 1);
        _setTokenURI(1, _tokenURI);
    }

    function getNFTname() external view returns(string memory) {
        return _name;
    }

    function getNFTsymbol() external view returns(string memory) {
        return _symbol;
    }

    function getNFTOwner(uint256 tokenID) external view returns(address){
        require(tokenID == 1, "Invalid NFT token ID");
        return ownerOf(tokenID);
    }

    function changeNFTOwnership(address from, address to, uint256 tokenId) external onlyNFTOwner {
        require(tokenId == 1, "Cannot transfer this tokenId");
        safeTransferFrom(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) onlyNFTOwner {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
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