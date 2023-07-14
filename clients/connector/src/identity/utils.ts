import { Client } from "@iota/client-wasm/web";

const faucet_url = import.meta.env.VITE_FAUCET_URL as string;

/** Request funds from the faucet API, if needed, and wait for them to show in the wallet. */
export async function ensureAddressHasFunds(client: Client, addressBech32: string) {
    let balance = await getAddressBalance(client, addressBech32);
    if (balance > 0) {
        return;
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