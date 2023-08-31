import * as dotenv from 'dotenv';
import { Account, AccountManager, AccountManagerOptions, Address, ClientOptions, CoinType } from '@iota/wallet'
import { SecretManager, Client } from '@iota/client-wasm/node/lib/index.js'
import { ensureAddressHasFunds } from './utils.js';
import { Bip39 } from "@iota/crypto.js";

dotenv.config()

export class ConnectorWallet {
    secret_manager: SecretManager | undefined;
    clientOptions: ClientOptions | undefined;
    client: Client | undefined;
    accountManager: AccountManager | undefined;
    connectorAccount: Account | undefined;
    accountAddress: Address | undefined;

    constructor() {}

    private setupSecretManager = () => {
        // const mnemonic = Bip39.randomMnemonic();
        // console.log(mnemonic)
        this.secret_manager = {
            mnemonic: `${process.env.NON_SECURE_MNEMONIC}`,
            // stronghold: {
            //     snapshotPath: `${process.env.STRONGHOLD_PATH}`,
            //     password: `${process.env.STRONGHOLD_PASSWORD}`,
            // },
        }
    }

    private setupClientOptions = () => {
        this.clientOptions = {
            primaryNode: `${process.env.NODE_URL}`,
            localPow: true
        }
        this.client = new Client({
            primaryNode: this.clientOptions.primaryNode,
            localPow: this.clientOptions.localPow
        })
    }

    private createAccountManager = async () => {
        try {
            const accountManagerOptions: AccountManagerOptions = {
                storagePath: './connector-database',
                clientOptions: this.clientOptions,
                coinType: CoinType.Shimmer,
                secretManager: this.secret_manager
            };
            this.accountManager = new AccountManager(accountManagerOptions);
            
            // const mnemonic = Bip39.randomMnemonic();
            // console.log(mnemonic)
            // await this.accountManager.storeMnemonic(`${process.env.NON_SECURE_MNEMONIC}`);
            // await this.accountManager.storeMnemonic(mnemonic);
        } catch (error) {
            console.log(error)
        }
    }

    private createConnectorAccount = async () => {
        try{
            this.connectorAccount = await this.accountManager?.createAccount({
                alias: 'Connector',
                bech32Hrp: await this.client?.getBech32Hrp()
            });
            console.log('Account created with alias:', this.connectorAccount?.getMetadata().alias);
            this.accountAddress = (await this.connectorAccount?.addresses())?.at(0);
            console.log("Funding address:", this.accountAddress)
            await ensureAddressHasFunds(this.client!, `${this.accountAddress?.address}`);
        } catch(error) {
            console.log(error)
            this.connectorAccount = await this.accountManager?.getAccount('Connector');
            this.accountAddress = (await this.connectorAccount?.addresses())?.at(0);
            console.log('Retrieved address from account: ', this.accountAddress)
        }
    }

    public initConnectorWallet = async () => {
        this.setupSecretManager();
        this.setupClientOptions();
        await this.createAccountManager();
        await this.createConnectorAccount();
    }
}