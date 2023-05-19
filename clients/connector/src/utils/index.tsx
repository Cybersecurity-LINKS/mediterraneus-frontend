import { AbiCoder, BigNumberish, keccak256, solidityPacked, toUtf8Bytes } from 'ethers'
import contractAddresses from '../../../../smart-contracts/addresses/contractAddresses.json'

const enum CONTRACT_ADRRESS{
  "Deployer" = 0,
  "ERC721Base" = 1,
  "ERC20Base" = 2,
  "RouterFactory" = 3,
  "ERC721Factory" = 4,
  "FixedRateExchange" = 5
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
    let ret;
    switch (contractName) {
      case "Deployer":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.Deployer].Deployer?.toString()
        break;
      case "ERC721Base":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.ERC721Base].ERC721Base?.toString()
        break;
      case "ERC20Base":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.ERC20Base].ERC20Base?.toString()
        break;
      case "ERC721Factory":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.ERC721Factory].ERC721Factory?.toString()
        break;
      case "RouterFactory":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.RouterFactory].RouterFactory?.toString()
        break;
      case "FixedRateExchange":
        ret = contractAddresses.addresses[CONTRACT_ADRRESS.FixedRateExchange].FixedRateExchange?.toString()
        break;
      default:
        ret = "";
    }
    return ret;
  } catch (e) {
    console.log(`e`, e)
  }
}

export const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
export function getPermitDigest(
  name: string,
  address: string,
  chainId: number,
  approve: {
    owner: string
    spender: string
    value: BigNumberish
  },
  nonce: BigNumberish,
  deadline: BigNumberish
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId)
  return keccak256(
    solidityPacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          new AbiCoder().encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        ),
      ]
    )
  )
}

// Gets the EIP712 domain separator
export function getDomainSeparator(name: string, contractAddress: string, chainId: number) {
  const h1 = keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'));
  const h2 = keccak256(toUtf8Bytes(name));
  const h3 = keccak256(toUtf8Bytes('1'));

  console.log(h1, h2, h3, chainId, contractAddress);
  return keccak256(
    new AbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        h1,
        h2,
        h3,
        chainId,
        contractAddress,
      ]
    )
  )
}

export function getSemiPermitDigest(
  approve: {
    owner: string
    spender: string
    value: BigNumberish
  },
  nonce: BigNumberish,
  deadline: BigNumberish
) {
  return keccak256(
    new AbiCoder().encode(
      ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
      [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
    )
  )
}