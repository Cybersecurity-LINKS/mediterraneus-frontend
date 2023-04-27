const { ethers } = require("hardhat");

async function deployERC721() {

}

async function main () {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
    const [deployer] = await ethers.getSigners();
    console.log("Contracts deployed by:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const erc721FactoryAddress = '0xb3445e3764e9BcA47F65419B9C430cA462ea0Dd9';
    const Box = await ethers.getContractFactory('ERC721Factory');
    const box = await Box.attach(erc721FactoryAddress);

    // const baseAddress = await box.getBaseContractAddress();
    // console.log("Base addres: ", baseAddress);

    // await box.deployERC721Contract(
    //     "Davide",
    //     "DVD",
    //     "ipfs://QmRzct2ifCgmLf51CXmnZPzr4euADsQsLn7drVLPnW5gc2",
    //     "0xfe67F0dCc01974c2CC79D9D019f8177624D2Af07"
    // ); 
    // console.log("New ERC721 NFT contract deployed successfully!", res);

    // const newNFTCount = await box.getNFTCreatedCount();
    // const newNFTaddresses = await box.getNFTCreatedAddress();
    // console.log("Deployed NFT addresses: " + newNFTaddresses.toString() + " Num: " + newNFTCount.toNumber());

    // const mintResult = await box.safeMint(deployer.address, "ipfs://QmRzct2ifCgmLf51CXmnZPzr4euADsQsLn7drVLPnW5gc2")
    // console.log("safeMint result: ", mintResult);

    // const nftCount = await box.getCurrentNFTCount();
    // console.log("Currently minted NFTs = ", nftCount.toNumber());

    // for(let i = 0; i < nftCount; i++ ){
    //     const tokenURI = await box.tokenURI(i);
    //     console.log("Token " + i + " URI = ", tokenURI.toString());
    // }
}
  
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})