import { CredentialSubject } from "@/types/connectorTypes";

export const issuerApiEndpoint = import.meta.env.VITE_ISSUER_API as string;

const getChallenge = async ( did: string ) => {
    
    const response = await fetch(`${issuerApiEndpoint}/challenges?did=${did}`);
    if (!response.ok) {
        console.log("Request already present");
        throw response.json();
    }
    // TODO: throw and catch error if response is not ok
    const nonce = (await response.json()).nonce as string;

    if(response.ok){
        console.log("challenge: ", nonce);
        return nonce;
    } else {
        const err = {status: response.status, errObj: nonce};
        throw err;  // An object with the error coming from the server
    }
}

// TODO: create structure DTOs
const requestCredential = async ( did: string, nonce: string, ssiSignature: string, walletSignature: string, credentialSubject: CredentialSubject ) => {
    const response = await fetch(`${issuerApiEndpoint}/credentials`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            did: did,
            nonce: nonce,
            identitySignature: ssiSignature,
            walletSignature: walletSignature,
            credentialSubject: credentialSubject
        })
    });  
    const json = await response.json();
    if(response.ok){
        return json; // the returned credential is not activated yet
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}
const issuerAPI = { getChallenge, requestCredential };
export default issuerAPI;