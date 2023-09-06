require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1,
    },
  },
  networks: {
    'shimmerevm-testnet': {
      url: 'https://json-rpc.evm.testnet.shimmer.network',
      chainId: 1072,
      gas: 2100000, 
      gasPrice: 8000000000,
      accounts: [process.env.PRIVATE_KEY],
    },
    'sepolia': {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2100000, 
      gasPrice: 10000000000,
      accounts: [process.env.SEPOLIA_PKEY]
    },
    'polygon_mumbai': {
      url: "https://rpc-mumbai.maticvigil.com",
      gas: 2100000, 
      gasPrice: 8000000000,
      accounts: [process.env.SEPOLIA_PKEY]
    }
    // 'shimmerevm-testnet2': {
    //   url: 'https://json-rpc.evm.testnet.shimmer.network',
    //   chainId: 1071,
    //   gas: 2100000, 
    //   gasPrice: 8000000000,
    //   accounts: [process.env.PRIVATE_KEY_2],
    // },
    // 'shimmerevm-testnet3': {
    //   url: 'https://json-rpc.evm.testnet.shimmer.network',
    //   chainId: 1071,
    //   gas: 2100000, 
    //   gasPrice: 8000000000,
    //   accounts: [process.env.PRIVATE_KEY_3],
    // },
  },
  etherscan: {
    apiKey: {
      'shimmerevm-testnet': 'ABCDE12345ABCDE12345ABCDE123456789',
      'polygon_mumbai': 'CJDGS5QWIIHRZPD127CXST931ZNJM3RQY9'
    },
    customChains: [
      {
        network: 'shimmerevm-testnet',
        chainId: 1072,
        urls: {
          apiURL: 'https://explorer.evm.testnet.shimmer.network/api',
          browserURL: 'https://explorer.evm.testnet.shimmer.network/'
        }
      }
    ]
  }
};


