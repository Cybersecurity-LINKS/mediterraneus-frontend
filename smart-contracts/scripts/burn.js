const { ethers } = require("hardhat");

async function main() {
    const NFTAddress = "0xd02621efdc4ee38f41a237ddcb23a2fd27511c86";
    const Box = await ethers.getContractFactory('ERC20Base');
    const box = await Box.attach(NFTAddress);

    const [account] = await ethers.getSigners();
    console.log("Burning NFT with account:", account.address);
    
    const res = await box.burn(account.address, 1);
    console.log(res);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})