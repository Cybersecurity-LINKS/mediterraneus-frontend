const { ethers } = require("hardhat");

async function main() {
    const erc721Factory = '0xb3445e3764e9BcA47F65419B9C430cA462ea0Dd9';
    const Box = await ethers.getContractFactory('ERC721Factory');
    const box = await Box.attach(erc721Factory);

    console.log(res);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})