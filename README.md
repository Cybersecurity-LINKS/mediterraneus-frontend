# SC_DataMarketplace_samples
Simple SCs for implementing a decentralized marketplace. Training repo 
First sample implementation for what regards the external services (verification GW + sqlite db running bare)

## Requirements
1. Solidity compiler
2. NPM

Clone the repository and install the dependecies. 
```
$ cd SC_DataMarketplace_samples
$ npm install --save-dev
```

Compile the contracts
```
$ npx hardhat compile
```

## Prepare environment
1. Create a .env file and where o save the private key of your wallet.
The .env file should look like this:
```
PRIVATE_KEY='<priv_key1>'
PRIVATE_KEY_2='<priv_key2>'
```
2. In the hardhat.config.js specify the various networks to play around with different wallets
```js
  'shimmerevm-testnet': {
    url: 'https://json-rpc.evm.testnet.shimmer.network',
    chainId: 1071,
    gas: 2100000, 
    gasPrice: 8000000000,
    accounts: [process.env.PRIVATE_KEY],
```

## Run the scripts
1. Deploy the contracts
```sh
$ npx hardhat run --network <your-network> scripts/deploy.js
```
2. Run the various scripts to play with the contracts
```sh
npx hardhat run --network <your-network> scripts/<script.js>
```
