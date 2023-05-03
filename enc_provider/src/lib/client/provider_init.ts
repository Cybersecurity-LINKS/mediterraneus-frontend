import { NETWORKS } from '../constants';
import { IotaWallet, SendFundsTransaction } from '../faucet';
import {
    IndexerPluginClient,
    SingleNodeClient,
    type IClient,
} from '@iota/iota.js';
import Web3 from 'web3';
import { Account } from 'web3-core'
import { EVMAccount } from '../faucet';
import fs from 'fs';

export class ProviderInit {
  public client: IClient;
  public indexer: IndexerPluginClient;

  private evmAccount: Account;

  private evmAccountObj: EVMAccount = new EVMAccount();
  public isWalletInitialized;

  constructor() {
    let rawdata: string;
    try {
      rawdata = fs.readFileSync(__dirname.replace('/src/lib/client','/EVMaddress.json'), 'utf-8');
    }catch(err) {
      rawdata = undefined;
      console.log(err.message);
    }

    if(rawdata === undefined) {
      this.isWalletInitialized = false;
    } else {
      let account = JSON.parse(rawdata);
      let web3 = new Web3(new Web3.providers.HttpProvider(NETWORKS[0].networkUrl));

      this.evmAccountObj.address = account.address;
      this.evmAccountObj.private_key = account.private_key;
      this.evmAccount = web3.eth.accounts.privateKeyToAccount(this.evmAccountObj.private_key);

      this.isWalletInitialized = true;
    }
  }

  private async createWallet() {
    const client = new SingleNodeClient(NETWORKS[0].apiEndpoint);
    const indexerClient = new IndexerPluginClient(client);
    let wallet: IotaWallet = new IotaWallet(
        client,
        indexerClient,
        NETWORKS[0].faucetEndpoint,
      );
    await wallet.initialize();
    const balance = await wallet.requestFunds();

    console.log("Balance: ", Number(balance));

    const transaction = new SendFundsTransaction(wallet);
    await transaction.sendFundsToEVMAddress(
      this.evmAccount.address,
      NETWORKS[0].chainAddress,
      balance,
      BigInt(5000000),
    );
  }

  public async createEVMAccount(): Promise<boolean> {
    if(this.isWalletInitialized === false){
      let web3 = new Web3(new Web3.providers.HttpProvider(NETWORKS[0].networkUrl));
      let account = web3.eth.accounts.create();

      this.evmAccount = account;
      console.log(`address: ${this.evmAccount.address}`);
      console.log(`privateKey: ${this.evmAccount.privateKey}`);
      
      this.evmAccountObj.address = account.address;
      this.evmAccountObj.private_key = this.evmAccount.privateKey;

      await this.createWallet();

      this.isWalletInitialized = true;

      const json = JSON.stringify(this.evmAccountObj, null, 2);
      await fs.promises.writeFile(__dirname.replace('/src/lib/client','/EVMaddress.json'), json)
      .catch((err) => {
        console.log("Error in writing EVM address file!", err);
      });
      console.log("Addresses file correctly generated. Have a look in the root folder");
    }
    return this.isWalletInitialized;
  }

  get getEVMaddress() {
    return this.evmAccount.address;
  }
}