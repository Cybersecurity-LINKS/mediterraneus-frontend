const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Deployer = await ethers.getContractFactory("Deployer");
    let token = await Deployer.deploy();
    console.log("Deployer address:", token.address);
    
    const ERC721Base = await ethers.getContractFactory("ERC721Base");
    const baseAddress = await ERC721Base.deploy();
    console.log("ERC721Base address:", baseAddress.address);

    const ERC721Factory = await ethers.getContractFactory("ERC721Factory");
    token = await ERC721Factory.deploy(baseAddress.address);
    console.log("ERC721Factory address:", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });