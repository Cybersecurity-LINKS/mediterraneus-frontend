import { NETWORKS } from '../constants';
import { IotaWallet, SendFundsTransaction } from '../faucet';
import {
    IndexerPluginClient,
    SingleNodeClient,
    type IClient,
} from '@iota/iota.js';
import Web3 from 'web3';
import { Account } from 'web3-core'

export class ProviderInit {
    public client: IClient;
    public indexer: IndexerPluginClient;

    private evmAccount: Account;
  
    public async createWallet() {
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

    public createEVMaddress() {
        let web3 = new Web3(new Web3.providers.HttpProvider(NETWORKS[0].networkUrl));

        let account = web3.eth.accounts.create();

        this.evmAccount = account;
        console.log(`address: ${this.evmAccount.address}`);
        console.log(`privateKey: ${this.evmAccount.privateKey}`);
    }
  }