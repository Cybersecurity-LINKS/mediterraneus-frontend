const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let rawdata = fs.readFileSync(__dirname.replace('scripts','addresses/contractAddresses.json'));
    let addresses = JSON.parse(rawdata);

    const erc721Factory = addresses.addresses[2].ERC721Factory;
    console.log("ERC721Factory address: ", erc721Factory);
    const Box = await ethers.getContractFactory('ERC721Factory');
    const box = await Box.attach(erc721Factory);

    const baseContractAddress = await box.getBaseContractAddress();
    console.log("BaseContract addres: ", baseContractAddress);

    await box.deployERC721Contract(
        "Davide",
        "DVD",
        "ipfs://QmV7QK5LHBG28R5aJW8R4oFGHpaNYrq9va89Lkhmw2cDvT",
        "0xfe67F0dCc01974c2CC79D9D019f8177624D2Af07"
    ); 
    console.log("New ERC721 NFT contract deployed successfully!");

    const newNFTCount = await box.getNFTCreatedCount();
    const newNFTaddresses = await box.getNFTCreatedAddress();
    console.log("Deployed NFT addresses: " + newNFTaddresses.toString() + " Num: " + newNFTCount.toNumber());
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})