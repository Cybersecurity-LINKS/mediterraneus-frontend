const { ethers } = require("hardhat");

async function main() {
    const erc721BaseAddress = '0xf35b6df2c9e61eaef5aa41490bd62cb7a0648226';
    const Box = await ethers.getContractFactory('ERC721Base');
    const box = await Box.attach(erc721BaseAddress);

    const res = await box.changeNFTOwnership("0xfe67F0dCc01974c2CC79D9D019f8177624D2Af07", "0xF9692336D7f37336C2061a545D8b2895B1415EFe", 1);

    console.log(res);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})