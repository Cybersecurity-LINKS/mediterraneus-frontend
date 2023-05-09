// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./Deployer.sol";
import "../interfaces/IERC721Base.sol";
import "../interfaces/IERC20Base.sol";

contract ERC721Factory is Ownable, Deployer{
    using SafeMath for uint256;

    uint256 private currentNFTCount;
    mapping(address => address) public createdERC721List;
    mapping(address => address) public eRC721_to_owner;
    address[] public erc721addresses;

    mapping(address => address) public createdERC20List;
    mapping(address => address) public eRC20_to_owner;
    address[] public erc20addresses;

    struct ContractBase {
        address baseAddress;
        bool isActive;
    }
    ContractBase private base721ContractInfo;
    ContractBase private base20ContractInfo;

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

    // contract owner = minter
    event ERC20ContractDeployed(
        address contractAddress, 
        address contractOwner, 
        string name, 
        string symbol, 
        uint256 initialSupply
    );

    constructor(address _base721Address, address _base20Address) {
        require(_base721Address != address(0), "Invalid ERC721Base contract address");
        require(_base20Address != address(0), "Invalid ERC721Base contract address");
        currentNFTCount = 0;
        addERC721Basetemplate(_base721Address);
        addERC20Basetemplate(_base20Address);
    }

    function deployERC721Contract(
        string memory name,
        string memory symbol,
        string memory tokenURI,
        address owner
    ) public returns(address erc721Instance){
        require(base721ContractInfo.baseAddress != address(0), "DeployER721Contract: invalid base address");
        require(base721ContractInfo.isActive, "DeployERC721Contract: Base contract not active");
        require(owner != address(0), "address(0) cannot be an owner");

        erc721Instance = deploy(base721ContractInfo.baseAddress);
        require(erc721Instance != address(0), "deployERC721Contract: Failed to deploy new ERC721 contract");
        
        erc721addresses.push(erc721Instance);
        createdERC721List[erc721Instance] = erc721Instance;
        eRC721_to_owner[erc721Instance] = owner;
        currentNFTCount += 1;
        IERC721Base ierc721Instance = IERC721Base(erc721Instance);
        ierc721Instance.initialize(
            owner,
            name,
            symbol,
            address(this),
            tokenURI,
            1
        );
        emit NFTCreated(erc721Instance, base721ContractInfo.baseAddress, name, owner, symbol, tokenURI, msg.sender);
    }

    function deployERC20Contract(
        string memory name_,
        string memory symbol_,
        address minter_, // minter = DT owner = NFT owner
        // address erc721baseaddress_,
        uint256 maxSupply_,
        uint256 initialSupply_
    ) external returns (address erc20Instance) {
        require(createdERC721List[msg.sender] == msg.sender, "Call coming from a non existing NFT contract deployed by this factory");
        require(minter_ == IERC721Base(createdERC721List[msg.sender]).getNFTowner(), "Provided minter is not the NFT owner!");

        erc20Instance = deploy(base20ContractInfo.baseAddress);
        require(erc20Instance != address(0), "deployERC20Contract: Failed to deploy new ERC20 contract");

        erc20addresses.push(erc20Instance);
        createdERC20List[erc20Instance] = erc20Instance;
        eRC20_to_owner[erc20Instance] = minter_;

        IERC20Base ierc20Instance = IERC20Base(erc20Instance);
        ierc20Instance.initialize(
            name_,
            symbol_,
            minter_,
            base721ContractInfo.baseAddress,
            maxSupply_,
            initialSupply_
        );
        emit ERC20ContractDeployed(erc20Instance, minter_, name_, symbol_, initialSupply_);
    }

    function addERC721Basetemplate(address _baseAddress) internal onlyOwner {
        require(_baseAddress != address(0), "Address(0) NOT allowed for base NFTcontract");
        require(_isContract(_baseAddress), "Provided address is NOT a contract");
        base721ContractInfo = ContractBase(_baseAddress, true);
        emit Base721Added(base721ContractInfo.baseAddress, base721ContractInfo.isActive);
    }

    function addERC20Basetemplate(address _baseAddress) internal onlyOwner {
        require(_baseAddress != address(0), "Address(0) NOT allowed for base NFTcontract");
        require(_isContract(_baseAddress), "Provided address is NOT a contract");
        base20ContractInfo = ContractBase(_baseAddress, true);
        emit Base721Added(base20ContractInfo.baseAddress, base20ContractInfo.isActive);
    }

    function _isContract(address account) internal view onlyOwner returns (bool){
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

    function getBase721ContractAddress() external view returns(address) {
        return base721ContractInfo.baseAddress;
    }
    
    function getBase20ContractAddress() external view returns(address) {
        return base20ContractInfo.baseAddress;
    }
}
