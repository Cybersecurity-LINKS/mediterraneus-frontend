// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./Deployer.sol";
import "../interfaces/IERC721Base.sol";

contract ERC721Factory is Ownable, Deployer{
    using SafeMath for uint256;

    uint256 private currentNFTCount;
    mapping(address => address) public createdERC721List;
    mapping(address => address) public eRC721_to_owner;
    address[] public erc721addresses;

    struct ContractBase {
        address baseAddress;
        bool isActive;
    }
    ContractBase private baseContractInfo;

    event Base721Added(address indexed _baseAddress, bool _isActive);

    event NFTCreated(
        address newTokenAddress,
        address indexed templateAddress,
        string tokenName,
        address indexed admin,
        string symbol,
        string tokenURI,
        address indexed creator
    );

    constructor(address _baseAddress) {
        require(_baseAddress != address(0), "Invalid ERC721Base contract address");
        currentNFTCount = 0;
        addERC721Basetemplate(_baseAddress);
    }

    function deployERC721Contract(
        string memory name,
        string memory symbol,
        string memory tokenURI,
        address owner
    ) public returns(address erc721Instance){
        require(baseContractInfo.baseAddress != address(0), "DeployER721Contract: invalid base address");
        require(baseContractInfo.isActive, "DeployERC721Contract: Base contract not active");
        require(owner != address(0), "address(0) cannot be an owner");

        erc721Instance = deploy(baseContractInfo.baseAddress);
        require(erc721Instance != address(0), "deployERC721Contract: Failed to deploy new ERC721 contract");
        
        erc721addresses.push(erc721Instance);
        createdERC721List[erc721Instance] = erc721Instance;
        eRC721_to_owner[erc721Instance] = owner;
        currentNFTCount += 1;
        IERC721Base ierc721Instance = IERC721Base(erc721Instance);
        require(ierc721Instance.initialize(
            owner,
            name,
            symbol,
            address(this),
            tokenURI,
            1
        ), "Unable to initialize erc721 NFT instance");
        emit NFTCreated(erc721Instance, baseContractInfo.baseAddress, name, owner, symbol, tokenURI, msg.sender);
    }

    function addERC721Basetemplate(address _baseAddress) internal onlyOwner {
        require(_baseAddress != address(0), "Address(0) NOT allowed for base NFTcontract");
        require(_isContract(_baseAddress), "Provided address is NOT a contract");
        baseContractInfo = ContractBase(_baseAddress, true);
        emit Base721Added(baseContractInfo.baseAddress, baseContractInfo.isActive);
    }

    function _isContract(address account) internal view returns (bool){
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function getNFTCreatedCount() external view returns(uint256) {
        return currentNFTCount;
    }

    function getAllNFTCreatedAddress() external view returns(address[] memory) {
        return erc721addresses;
    }

    function getNFTCreatedAddress(address creator) external view returns(address[] memory ret) {
        for(uint256 i = 0; i < currentNFTCount; i++) {
            if(creator == eRC721_to_owner[erc721addresses[i]])
                ret[i] = erc721addresses[i];
        }
        return ret;
    }

    function getBaseContractAddress() external view returns(address) {
        return baseContractInfo.baseAddress;
    }
}
