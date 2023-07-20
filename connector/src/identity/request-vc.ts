import { Client, MnemonicSecretManager, SecretManager } from "@iota/client-wasm/web";
import { Bip39 } from "@iota/crypto.js";
import {
    IotaDID,
    IotaDocument,
    IotaIdentityClient,
    IotaVerificationMethod,
    KeyPair,
    KeyType,
    MethodScope,
} from "@iota/identity-wasm/web";
import { Bech32Helper, IAliasOutput } from "@iota/iota.js";
import { ensureAddressHasFunds, store_holder_identity, is_first_identity, HolderIdentity } from "./utils";

const node_url = import.meta.env.VITE_NODE_URL as string;

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";
import { useMetaMask } from "@/hooks/useMetaMask";

// Calling identity.init().then(<callback>) or await identity.init() is required to load the Wasm file from the server if not available, 
// because of that it will only be slow for the first time.
client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));

type ResponseVC1 = {
    vchash: string;
}
/**
 * If user has already created its identity, get from the backend the DID
 * otherwise create one, save it in the db and send the request to the issuer.
 * @returns The first step returns the VC hash that the holder has to sign both with the DID-related private key
 *          but also with (evm) wallet private key. 
 */
export async function send_vc_request1(): Promise<string> {
    try {
        let holder_identity: HolderIdentity | undefined = await is_first_identity();
        let holder_did = holder_identity?.did;
        if(holder_identity === undefined)
            holder_did = (await createIdentity()).did;
        else 
            console.log("Identity already created. Proceeding... ");
        // request to the issuer
        const response = await fetch('http://localhost:3213/requestVC1', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                did: holder_did
            })
        });
        const responseVC1: ResponseVC1 = await response.json() as ResponseVC1;
        return response.ok ? responseVC1.vchash : "";
    } catch(error) {
        throw error;
    }
}

/**
 * Prepare and send the second request for VC issuance. 
 * First sign the the vchash using the remote provider, secondly, sign the same digest using the SSI private key
 * @param vchash hash of vc received from request 1.
 */
export async function send_vc_request2(vchash: string) {
    const { provider } = useMetaMask();
    const signer = await provider?.getSigner();

    // retreive SSI priv key
    const identity = await fetch("http://localhost:1234/identity", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });


    const signedVChash_W = await signer?.signMessage(vchash);
    const signedVChash_SSi = "";
}

export async function createIdentity(): Promise<{
    didClient: IotaIdentityClient;
    secretManager: SecretManager;
    walletAddressBech32: string;
    did: IotaDID;
}> {
    const client = new Client({
        primaryNode: node_url,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Get the Bech32 human-readable part (HRP) of the network.
    const networkHrp: string = await didClient.getNetworkHrp();

    // Generate a random mnemonic for our wallet.
    const mnemonic = Bip39.randomMnemonic();
    const secretManager: MnemonicSecretManager = {
        mnemonic: mnemonic,
    };
    const walletAddressBech32 = (await client.generateAddresses(secretManager, {
        accountIndex: 0,
        range: {
            start: 0,
            end: 1,
        },
    }))[0];
    console.log("Wallet address Bech32:", walletAddressBech32);

    // Request funds for the wallet, if needed - only works on development networks.
    if (await ensureAddressHasFunds(client, walletAddressBech32) == true ){
        console.log("Address funded");
    }

    // Create a new DID document with a placeholder DID.
    // The DID will be derived from the Alias Id of the Alias Output after publishing.
    const document = new IotaDocument(networkHrp);
    
    // Insert a new Ed25519 verification method in the DID document.
    let keypair = new KeyPair(KeyType.Ed25519);
    console.log("pub: " + keypair.public() + " priv: " + keypair.private())
    let method = new IotaVerificationMethod(document.id(), keypair.type(), keypair.public(), "#key-1");
    document.insertMethod(method, MethodScope.VerificationMethod());

    // Construct an Alias Output containing the DID document, with the wallet address
    // set as both the state controller and governor.
    const address = Bech32Helper.addressFromBech32(walletAddressBech32, networkHrp);
    const aliasOutput: IAliasOutput = await didClient.newDidOutput(address, document);
    // console.log("Alias Output:", JSON.stringify(aliasOutput, null, 2));

    // Publish the Alias Output and get the published DID document.
    const published = await didClient.publishDidOutput(secretManager, aliasOutput);
    console.log("Published DID document:", JSON.stringify(published, null, 2));

    const store_res = await store_holder_identity(walletAddressBech32, mnemonic, keypair, published.id())
    if(store_res != 201) {
        throw Error("Identity storing failed");
    }
    
    return {
        didClient,
        secretManager,
        walletAddressBech32,
        did: published.id(),
    };
}

// import * as path from 'path'
// import * as dotenv from 'dotenv'
// import { AccountManager, AccountManagerOptions, CoinType } from "@iota/wallet"

// dotenv.config({path: path.resolve(__dirname, '.env')});

// export async function createIdentity_wallet() {
//     try {
//         const client = new Client({
//             primaryNode: node_url,
//             localPow: true,
//         });
//         const didClient = new IotaIdentityClient(client);

//         const manager = await createAccountManager();
//         const account = await manager.createAccount({
//             alias: 'connector',
//         })
//         console.log('Account created:', account);
//         const address = await account.generateAddress();
//         console.log('New address:', address.address);
//         // Request funds for the wallet, if needed - only works on development networks.
//         // if (await ensureAddressHasFunds(client, address.address) == true ){
//         //     console.log("Address funded");
//         // }
        
//         // Create a new DID document with a placeholder DID.
//         // The DID will be derived from the Alias Id of the Alias Output after publishing.
//         // const document = new IotaDocument(await didClient.getNetworkHrp());

//     } catch (error) {
//         throw error;
//     }
// }

// async function createAccountManager() {
//     const accountManagerOptions: AccountManagerOptions = {
//         storagePath: './alice-database',
//         clientOptions: {
//             nodes: [node_url || "https://api.testnet.shimmer.network"],
//             localPow: true,
//         },
//         coinType: CoinType.Shimmer,
//         secretManager: {
//             stronghold: {
//                 snapshotPath: `./wallet.stronghold`,
//                 password: `${sh_password}`,
//             },
//         },
//     };

//     const manager = new AccountManager(accountManagerOptions);
//     await manager.storeMnemonic(`${env_mnemonic}`);
//     return manager;
// }