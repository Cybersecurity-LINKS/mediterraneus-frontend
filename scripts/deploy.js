const { ethers } = require("hardhat");
const { fs } = require("fs");

async function main() {
    var obtainedAddresses = {
      addresses: []
    };

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Deployer = await ethers.getContractFactory("Deployer");
    let token = await Deployer.deploy();
    obtainedAddresses.addresses.push({contract: "Deployer", address: token});
    console.log("Deployer address:", token.address);
    
    const ERC721Base = await ethers.getContractFactory("ERC721Base");
    const baseAddress = await ERC721Base.deploy();
    obtainedAddresses.addresses.push({contract: "ERC721Base", address: baseAddress});
    console.log("ERC721Base address:", baseAddress.address);

    const ERC721Factory = await ethers.getContractFactory("ERC721Factory");
    token = await ERC721Factory.deploy(baseAddress.address);
    obtainedAddresses.addresses.push({contract: "ERC721Factory", address: token});
    console.log("ERC721Factory address:", token.address);

    const json = JSON.stringify(obtainedAddresses);
    fs.writeFile('../addresses/contractAddresses.json', json, 'utf8');
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });