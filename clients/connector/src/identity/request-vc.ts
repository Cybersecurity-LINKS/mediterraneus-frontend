import { Client, MnemonicSecretManager, SecretManager } from "@iota/client-wasm/web";
import { Bip39 } from "@iota/crypto.js";
import {
    IotaDID,
    IotaDocument,
    IotaIdentityClient,
    JwkMemStore,
    JwsAlgorithm,
    KeyIdMemStore,
    MethodScope,
    Storage,
} from "@iota/identity-wasm/web";
import { Bech32Helper, IAliasOutput } from "@iota/iota.js";
import { ensureAddressHasFunds } from "./utils";

const node_url = import.meta.env.VITE_NODE_URL as string;

import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";

// Calling identity.init().then(<callback>) or await identity.init() is required to load the Wasm file from the server if not available, 
// because of that it will only be slow for the first time.
client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));

export async function send_vc_request() {
    let res = await createIdentity();
    const response = await fetch('http://localhost:1234/resolveDID', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(res.did)
    });
    console.log(response);
}

export async function createIdentity(): Promise<{
    didClient: IotaIdentityClient;
    secretManager: SecretManager;
    walletAddressBech32: string;
    did: IotaDID;
}> {
    console.log(node_url)
    const client = new Client({
        primaryNode: node_url,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Get the Bech32 human-readable part (HRP) of the network.
    const networkHrp: string = await didClient.getNetworkHrp();

    // Generate a random mnemonic for our wallet.
    const secretManager: MnemonicSecretManager = {
        mnemonic: Bip39.randomMnemonic(),
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
    await ensureAddressHasFunds(client, walletAddressBech32);

    // Create a new DID document with a placeholder DID.
    // The DID will be derived from the Alias Id of the Alias Output after publishing.
    const document = new IotaDocument(networkHrp);
    const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());

    // Insert a new Ed25519 verification method in the DID document.
    await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        "#key-1",
        MethodScope.VerificationMethod(),
    );

    // Construct an Alias Output containing the DID document, with the wallet address
    // set as both the state controller and governor.
    const address = Bech32Helper.addressFromBech32(walletAddressBech32, networkHrp);
    const aliasOutput: IAliasOutput = await didClient.newDidOutput(address, document);
    console.log("Alias Output:", JSON.stringify(aliasOutput, null, 2));

    // Publish the Alias Output and get the published DID document.
    const published = await didClient.publishDidOutput(secretManager, aliasOutput);
    console.log("Published DID document:", JSON.stringify(published, null, 2));

    return {
        didClient,
        secretManager,
        walletAddressBech32,
        did: published.id(),
    };
}

