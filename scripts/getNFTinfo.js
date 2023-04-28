const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let rawdata = fs.readFileSync(__dirname.replace('scripts','addresses/contractAddresses.json'));
    let addresses = JSON.parse(rawdata);
    
    const erc721NFTAddress = addresses.addresses[2].deployedNFTContracts.NFTcontractAddress[0];
    const Box = await ethers.getContractFactory('ERC721Base');
    const box = await Box.attach(erc721NFTAddress);

    const NFTowner = await box.getNFTOwner(1);
    const NFTname = await box.getNFTname();
    const NFTsymbol = await box.getNFTsymbol();
    const NFTprice = await box.getNFTprice();
    console.log("    NFT:");
    console.log("\towner: ", NFTowner);
    console.log("\tname: ", NFTname);
    console.log("\tsymbol: ", NFTsymbol);
    console.log("\tprice (wei): ", NFTprice.toNumber());
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})