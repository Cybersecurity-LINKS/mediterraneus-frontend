const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let rawdata = fs.readFileSync(__dirname.replace('scripts','addresses/contractAddresses.json'));
    let addresses = JSON.parse(rawdata);

    const erc721Factory = addresses.addresses[2].ERC721Factory;
    console.log("ERC721Factory address: ", erc721Factory);
    const Box = await ethers.getContractFactory('ERC721Factory');
    const box = await Box.attach(erc721Factory);

    await box.deployERC721Contract(
        "Davide",
        "DVD",
        "ipfs://QmV7QK5LHBG28R5aJW8R4oFGHpaNYrq9va89Lkhmw2cDvT",
        process.env.ADDRESS_DAVIDE_2.toString()
    ); 
    console.log("New ERC721 NFT contract deployed successfully!");

    const newNFTCount = await box.getNFTCreatedCount();
    const newNFTaddresses = await box.getNFTCreatedAddress();
    console.log("Deployed NFT addresses: " + newNFTaddresses.toString() + " Num: " + newNFTCount.toNumber());

    var newNFTcontract = {
        ERC721Factory: erc721Factory,
        deployedNFTContracts: {
            NFTowner: process.env.ADDRESS_DAVIDE_2.toString(),
            NFTcontractAddress: newNFTaddresses
        }
    };
    addresses.addresses[2] = newNFTcontract;

    rawdata = JSON.stringify(addresses, null, 2);
    await fs.promises.writeFile(__dirname.replace('scripts','addresses/contractAddresses.json'), rawdata)
    .catch((err) => {
      console.log("Error in writing addresses file!", err);
    });
    console.log("Addresses file correctly updated with new contract info. Have a look in the ../addresses folder");
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})