import { Client } from "@iota/client-wasm/web";
import { IotaDID, KeyPair, KeyType } from "@iota/identity-wasm/web";

const faucet_url = import.meta.env.VITE_FAUCET_URL as string;

/** Request funds from the faucet API, if needed, and wait for them to show in the wallet. */
export async function ensureAddressHasFunds(client: Client, addressBech32: string): Promise<Boolean> {
    let balance = await getAddressBalance(client, addressBech32);
    if (balance > 0) {
        return false;
    }

    await requestFundsFromFaucet(addressBech32);

    for (let i = 0; i < 9; i++) {
        // Wait for the funds to reflect.
        await new Promise(f => setTimeout(f, 5000));

        let balance = await getAddressBalance(client, addressBech32);
        if (balance > 0) {
            break;
        }
    }
    return true;
}

/** Returns the balance of the given Bech32-encoded address. */
async function getAddressBalance(client: Client, addressBech32: string): Promise<number> {
    // TODO: use the `addresses/ed25519/<addressHex>` API to get the balance?
    const outputIds = await client.basicOutputIds([
        { address: addressBech32 },
        { hasExpiration: false },
        { hasTimelock: false },
        { hasStorageDepositReturn: false },
    ]);
    const outputs = await client.getOutputs(outputIds);

    let totalAmount = 0;
    for (const output of outputs) {
        totalAmount += Number(output.output.amount);
    }

    return totalAmount;
}

/** Request tokens from the faucet API. */
async function requestFundsFromFaucet(addressBech32: string) {
    const requestObj = JSON.stringify({ address: addressBech32 });
    let errorMessage, data;
    try {
        const response = await fetch(faucet_url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: requestObj,
        });
        if (response.status === 202) {
            errorMessage = "OK";
        } else if (response.status === 429) {
            errorMessage = "too many requests, please try again later.";
        } else {
            data = await response.json();
            // @ts-ignore
            errorMessage = data.error.message;
        }
    } catch (error) {
        errorMessage = error;
    }

    if (errorMessage != "OK") {
        throw new Error(`failed to get funds from faucet: ${errorMessage}`);
    }
}

export interface holder_identityJSON {
    wallet_address: string, // bech32 wallet address
    mnemonic: string, // wallet mnemonic
    keypair: KeyPair,
    did: IotaDID
}

export class HolderIdentity implements holder_identityJSON {
    wallet_address: string;
    mnemonic: string;
    keypair: KeyPair;
    did: IotaDID;
    
    constructor(addr: string, mnemonic: string, keypair: KeyPair, did: IotaDID) {
        this.wallet_address = addr;
        this.mnemonic = mnemonic;
        this.keypair = keypair;
        this.did = did; 
    }
}

// Insecure implementation since stronghold bindings are not aligned with iota-idetity's bindings.
// Stronghold should be used as a  secure storage of private keys as well as other sensitive holder identity metadata. 
export async function store_holder_identity(addr: string, mnemonic: string, keypair: KeyPair, did: IotaDID) {
    var holder_metadata = new HolderIdentity(addr, mnemonic, keypair, did);

    const holder_metadataJSON = JSON.stringify({
        did: holder_metadata.did,
        mnemonic: holder_metadata.mnemonic,
        privkey: holder_metadata.keypair.private().toString(),
        pubkey: holder_metadata.keypair.public().toString(),
        wallet_address: holder_metadata.wallet_address
    })

    // request to the issuer
    const response = await fetch('http://localhost:1234/identity', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: holder_metadataJSON
    });
    return response.status;
}

// check if the holder already has an SSI for this given application.
// Returns true if the identity need to be created, otherwise it will be read from the 
// backend (insecure implementation)
export async function is_first_identity(): Promise<HolderIdentity | undefined> {
    try {
        const response = await fetch('http://localhost:1234/identity', {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    if(response.status != 200)
        throw Error("Could not get any identity");
    const json_resp: any[] = await response.json()
    if(json_resp.length == 0)
        return undefined
    return new HolderIdentity(json_resp[0].wallet_address, 
        json_resp[0].mnemonic, 
        KeyPair.fromKeys(KeyType.Ed25519, json_resp[0].pubkey, json_resp[0].privkey),
        json_resp[0].did)
    }catch(error) {
        throw error;
    }
}