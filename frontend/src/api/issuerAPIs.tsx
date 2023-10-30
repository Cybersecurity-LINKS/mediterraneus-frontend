export const issuerApiEndpoint = import.meta.env.VITE_ISSUER_API as string;

const getChallenge = async ( did: string ) => {
    
    const response = await fetch(`${issuerApiEndpoint}/challenges?did=${did}`);
    if (!response.ok) {
        console.log("Request already present");
        throw response.json();
    }
    // TODO: throw and catch error if response is not ok
    const nonce = (await response.json()).nonce;

    if(response.ok){
        console.log("challenge: ", nonce);
        return nonce;
    } else {
        let err = {status: response.status, errObj: nonce};
        throw err;  // An object with the error coming from the server
    }
}

// TODO: create structure DTOs
const requestCredential = async ( did: string, nonce: string, ssiSignature: string, walletSignature: string ) => {
    const response = await fetch(`${issuerApiEndpoint}/credentials`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            did: did,
            nonce: nonce,
            ssi_signature: ssiSignature,
            pseudo_sign: walletSignature
        })
    });  
    const credential: JSON = JSON.parse((await response.json()).vc); // the returned credential is not activated yet
    if(response.ok){
        console.log(credential);
        return credential;
    } else {
        let err = {status: response.status, errObj: credential};
        throw err;  // An object with the error coming from the server
    }
}
const issuerAPI = { getChallenge, requestCredential };
export default issuerAPI;