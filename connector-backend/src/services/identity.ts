import {
    IotaDID,
    IotaDocument,
    IotaIdentityClient,
    IotaVerificationMethod,
    KeyPair,
    KeyType,
    MethodScope,
} from "@iota/identity-wasm/node";
import { Bech32Helper, IAliasOutput } from "@iota/iota.js";
import { connectorWallet } from "../app";
import { ensureAddressHasFunds } from "../utils";

 export async function createIdentity(): Promise<{
    did: IotaDID,
    keypair: KeyPair 
}> {
    const didClient = new IotaIdentityClient(connectorWallet.client!);
    // Get the Bech32 human-readable part (HRP) of the network.
    const networkHrp: string = await didClient.getNetworkHrp();

    // Create a new DID document with a placeholder DID.
    // The DID will be derived from the Alias Id of the Alias Output after publishing.
    const document = new IotaDocument(networkHrp);

    // Insert a new Ed25519 verification method in the DID document.
    let keypair = new KeyPair(KeyType.Ed25519);
    let method = new IotaVerificationMethod(document.id(), keypair.type(), keypair.public(), "#key-1");
    document.insertMethod(method, MethodScope.VerificationMethod());

    // Construct an Alias Output containing the DID document, with the wallet address
    // set as both the state controller and governor.
    // const new_address = await connectorWallet.connectorAccount?.generateAddress();
    // console.log(new_address)
    // const new_address = connectorWallet.accountAddress;
    await ensureAddressHasFunds(connectorWallet.client!, connectorWallet.accountAddress?.address!)
    const address = Bech32Helper.addressFromBech32(connectorWallet.accountAddress?.address!, networkHrp);
    const aliasOutput: IAliasOutput = await didClient.newDidOutput(address, document);

    // Publish the Alias Output and get the published DID document.
    const published = await didClient.publishDidOutput(connectorWallet.secret_manager!, aliasOutput);
    console.log("Published DID document:", JSON.stringify(published, null, 2));

    return {
        did: published.id(),
        keypair: keypair,
    }
 }

 export async function resolveDID(did: IotaDID): Promise<IotaDocument> {
    const didClient = new IotaIdentityClient(connectorWallet.client!);    
    // Resolve the associated Alias Output and extract the DID document from it.
    return await didClient.resolveDid(did);
 }