const { ethers } = require("hardhat");

async function main() {
    const erc721BaseAddress = '0xf35b6df2c9e61eaef5aa41490bd62cb7a0648226';
    const Box = await ethers.getContractFactory('ERC721Base');
    const box = await Box.attach(erc721BaseAddress);

    const res = await box.changeNFTOwnership("0xfe67F0dCc01974c2CC79D9D019f8177624D2Af07", "0x648D9eC3a95521258fa50a4d19CCAC0e7D92a8aa", 1);

    console.log(res);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})