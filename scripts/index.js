const { ethers } = require("hardhat");

async function main () {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
    const [deployer] = await ethers.getSigners();
    console.log("Contracts deployed by:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
}
  
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
})