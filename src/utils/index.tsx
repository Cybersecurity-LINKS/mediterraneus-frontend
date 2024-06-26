// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { InterfaceAbi, ethers } from 'ethers'
// import { AbiCoder, BigNumberish, keccak256, solidityPacked, toUtf8Bytes } from 'ethers'
import { Credential } from "@iota/identity-wasm/web";
import contractAddresses from '../addresses/contractAddresses.json'

const EVM_EXPLORER = import.meta.env.VITE_EVM_EXPLORER as string;

export const NETWORKS: { [k: string]: string } = {
  1: "Ethereum Main Network",
  1072: "Shimmer Testnet Network",
  31337: "Hardhat Network",
  11155111: "Sepolia Network",
};

export const NETWORK_SYMBOL: { [k: string]: string } = {
  1: "ETH",
  1072: "SMR",
  31337: "TST",
  11155111: "SepoliaETH",
};

export const NETWORK_IMAGE: { [k: string]: string } = {
  1: "ETH",
  1072: "../images/shimmerlogo.svg",
  31337: "../images/hardhat-seeklogo.com.svg",
  11155111: "../images/sepolia.png"
};

export const NETWORK_BGCOLOR: { [k: string]: string } = {
  1: "ETH",
  1072: "green",
  31337: "white",
};

export const NETWORK_WIDTH: { [k: string]: number } = {
  1072: 25,
  31337: 80,
  11155111: 80,
};

export const NETWORK_HEIGHT: { [k: string]: number } = {
  1072: 30,
  31337: 60,
  11155111: 80,
};

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
export const formatDid = (did: string | undefined) => {
  return `${did?.substring(0, 25)}...${did?.substring(70, did.length)}`
}

export const removeCenterOfStr= (str: string, a: number, b: number) => {
  return `${str.substring(0, a)}...${str.substring(b, str.length)}`
}

export const getContractABI = async (contractName: string) => {
  try {
    // dynamic import
    const contractArtifact = await import(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
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
        ret = contractAddresses.addresses.Deployer?.toString()
        break;
      case "ServiceBase":
        ret = contractAddresses.addresses.ServiceBase?.toString()
        break;
      case "AccessTokenBase":
        ret = contractAddresses.addresses.AccessTokenBase?.toString()
        break;
      case "Factory":
        ret = contractAddresses.addresses.Factory?.toString()
        break;
      case "RouterFactory":
        ret = contractAddresses.addresses.RouterFactory?.toString()
        break;
      case "FixedRateExchange":
        ret = contractAddresses.addresses.FixedRateExchange?.toString()
        break;
      case "Identity":
          ret = contractAddresses.addresses.Identity?.toString()
          break;
      default:
        ret = "";
    }
    return ret;
  } catch (e) {
    console.log(`e`, e)
  }
}

// export const PERMIT_TYPEHASH = keccak256(
//   toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
// )

// // Returns the EIP712 hash which should be signed by the user
// // in order to make a call to `permit`
// export function getPermitDigest(
//   name: string,
//   address: string,
//   chainId: number,
//   approve: {
//     owner: string
//     spender: string
//     value: BigNumberish
//   },
//   nonce: BigNumberish,
//   deadline: BigNumberish
// ) {
//   const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId)
//   return keccak256(
//     solidityPacked(
//       ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
//       [
//         '0x19',
//         '0x01',
//         DOMAIN_SEPARATOR,
//         keccak256(
//           new AbiCoder().encode(
//             ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
//             [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
//           )
//         ),
//       ]
//     )
//   )
// }

// // Gets the EIP712 domain separator
// export function getDomainSeparator(name: string, contractAddress: string, chainId: number) {
//   const h1 = keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'));
//   const h2 = keccak256(toUtf8Bytes(name));
//   const h3 = keccak256(toUtf8Bytes('1'));

//   console.log(h1, h2, h3, chainId, contractAddress);
//   return keccak256(
//     new AbiCoder().encode(
//       ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
//       [
//         h1,
//         h2,
//         h3,
//         chainId,
//         contractAddress,
//       ]
//     )
//   )
// }

// export function getSemiPermitDigest(
//   approve: {
//     owner: string
//     spender: string
//     value: BigNumberish
//   },
//   nonce: BigNumberish,
//   deadline: BigNumberish
// ) {
//   return keccak256(
//     new AbiCoder().encode(
//       ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
//       [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
//     )
//   )
// }

export const privKeytoBytes = (text: string): Uint8Array => {
  const buffer = text.split(",");
  const result = new Uint8Array(buffer.length);
  for (let i = 0; i < buffer.length; ++i) {
      result[i] = buffer[i] as unknown as number;
  }
  return result;
};

export const fetchIDentityABI = async () => {
  const identityAddr = getContractAddress("Identity");
  console.log(`${EVM_EXPLORER}/api?module=contract&action=getabi&address=${identityAddr}`);

  // TODO: SEPOLIA etherscan needs an API key
  const response = await fetch(`${EVM_EXPLORER}/api?module=contract&action=getabi&address=${identityAddr}`);
  const json = await response.json();
  return json.result;
}

export const getIdentitySC = async (provider: ethers.BrowserProvider) => {
    const identityAddr = getContractAddress("Identity");
    // let abi: InterfaceAbi = await fetchIDentityABI();
    // if(abi == null)
    //TODO: remove or fix the abi fetch
    // console.log(`${EVM_EXPLORER}/api?module=contract&action=getabi&address=${ientityAddr}`);

    const abi: InterfaceAbi = await getContractABI("Identity")
    return new ethers.Contract(`${identityAddr}`, abi, await provider.getSigner())
}

export const extractNumberFromVCid = (credential: Credential): number => {
  const id = credential.id();
  if(id === undefined)
      return -1;
  const spliced = id.split("/");
  const lastString = spliced[spliced.length - 1];
  return parseInt(lastString);
}

export function parseJwtSubStr (base64Url: string) {

  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

export function parseJwt (token: string) {
  // This is for display purposes only and is not verified.
  const [header, payload, signature] = token.split('.');
  const parsedCredential = 
  "------------------------ JWT header -----------------------\n" + 
  JSON.stringify(parseJwtSubStr(header), null, 2) +
  "\n------------------------ JWT Payload ----------------------\n" +
  JSON.stringify(parseJwtSubStr(payload), null, 2) +
  "\n------------------------ signature ------------------------\n" +
  signature;
  return parsedCredential;
}