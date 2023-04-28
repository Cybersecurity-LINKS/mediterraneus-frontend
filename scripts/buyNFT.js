const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let rawdata = fs.readFileSync(__dirname.replace('scripts','addresses/contractAddresses.json'));
    let addresses = JSON.parse(rawdata);
    
    const erc721NFTAddress = addresses.addresses[2].deployedNFTContracts.NFTcontractAddress[0];
    const Box = await ethers.getContractFactory('ERC721Base');
    const box = await Box.attach(erc721NFTAddress);

    const [account] = await ethers.getSigners();
    console.log("Buying NFT with account:", account.address);
    console.log("Account available balance:", (await account.getBalance()).toString());

    await box.buyNFT(1, {value: ethers.utils.parseEther("1")});

    console.log("Account available balance after buy:", (await account.getBalance()).toString());
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})