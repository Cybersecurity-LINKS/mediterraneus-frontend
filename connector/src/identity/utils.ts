import { Client } from "@iota/client-wasm/web";
import { IotaDID, KeyPair } from "@iota/identity-wasm/web";
import * as fs from 'fs';

const faucet_url = import.meta.env.VITE_FAUCET_URL as string;
const holder_identity_file = import.meta.env.VITE_HOLDER_IDENTITY as string;

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
// Stronghold should be used to secure the storage of private keys as well as other sensitive holder identity metadata. 
export function store_holder_identity(addr: string, mnemonic: string, keypair: KeyPair, did: IotaDID) {
    var holder_metadata = new HolderIdentity(addr, mnemonic, keypair, did);

    const holder_metadataJSON = JSON.stringify(holder_metadata)
    fs.writeFileSync(holder_identity_file, holder_metadataJSON, 'utf-8');
}

// check if the holder already has an SSI for this given application.
// Returns true if the identity need to be created, otherwise it will be read from the 
// fs (insecure implementation)
export function is_first_identity(): HolderIdentity | undefined {
    const holder_identityJSON = fs.readFileSync(holder_identity_file, 'utf-8');
    const holder_identity: HolderIdentity | undefined = JSON.parse(holder_identityJSON);

    return holder_identity;
}