import contractAddresses from '../../../../smart-contracts/addresses/contractAddresses.json'

const enum CONTRACT_ADRRESS{
  "Deployer" = 0,
  "ERC721Base" = 1,
  "ERC20Base" = 2,
  "ERC721Factory" = 3
}

export const formatBalance = (rawBalance: string) => {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(4)
  return balance
}

export const formatChainAsNum = (chainIdHex: string) => {
  const chainIdNum = parseInt(chainIdHex)
  return chainIdNum
}

export const formatAddress = (addr: string) => {
  return `${addr.substring(0, 8)}...`
}
export const formatAddress2 = (addr: string) => {
  return `${addr.substring(0, 5)}...${addr.substring(38, 42)}`
}

export const getContractABI = async (contractName: string) => {
  try {
    // dynamic import
    const contractArtifact = await import(`../../../../smart-contracts/artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const abi = contractArtifact.abi

    return abi
  } catch (e) {
    console.log(`e`, e)
  }
}

export const getContractAddress = (contractName: string) => {
  try {
    let enum_address: number = 0;
    if(contractName === "ERC721Factory") {
       enum_address = CONTRACT_ADRRESS.ERC721Factory
    }
    const address = contractAddresses.addresses[enum_address].ERC721Factory

    return address?.toString()
  } catch (e) {
    console.log(`e`, e)
  }
}