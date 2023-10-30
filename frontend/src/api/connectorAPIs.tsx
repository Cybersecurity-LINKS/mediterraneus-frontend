const generatePresentation = async (connectorUrl: string, challenge: string, ethAddress: string) => {
    
    const response = await fetch(`${connectorUrl}/identities/${ethAddress}/gen-presentation`, {
        method: "POST", // *GET, POST, PUT, DELETE, etc. ? LOL
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            challenge: challenge
        }), // body data type must match "Content-Type" header
      });
    const presentation = await response.json();

    if(response.ok){
        console.log(presentation);
        return presentation;
    } else {
        let err = {status: response.status, errObj: presentation};
        throw err;  // An object with the error coming from the server
    }
}

const getIdentity = async (connectorUrl: string, ethAddress: string) => {

    const response = await fetch(`${connectorUrl}/identities/${ethAddress}`);
    const json = await response.json();

    if(response.ok){
        console.log(json);
        return json;
    } else {
        let err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const createDID = async (connectorUrl: string, ethAddress: string) => {
    const response = await fetch(`${connectorUrl}/identities`, {
        method: 'POST',
        headers: {
        "Content-type": "application/json"
        },
        body: JSON.stringify({ethAddress: ethAddress}) 
    });
    
    const did = (await response.json()).did;

    if(response.ok){
        console.log(did);
        return did;
    } else {
        let err = {status: response.status, errObj: did};
        throw err;  // An object with the error coming from the server
    }
}

const storeCredential = async (connectorUrl: string, ethAddress: string, credential: JSON) => {
     // store VC in connector's backend.
     const response = await fetch(`${connectorUrl}/identities/${ethAddress}`, {
        method: 'PATCH',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            vc: credential,
        })
    });
    if(!response.ok){
        // Couldn't be able to store the credential
        let err = {status: response.status, errObj: response.json()};
        throw err;  // An object with the error coming from the server
    }
}

const signData = async (connectorUrl: string, ethAddress: string, payload: any) => {
    const response = await fetch(`${connectorUrl}/identities/${ethAddress}/sign-data`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({payload: payload}) 
    });
    const signature = (await response.json()).ssi_signature;
    if(response.ok){
        console.log("ssi signature: ", signature);
        return signature;
    } else {
        let err = {status: response.status, errObj: signature};
        throw err;  // An object with the error coming from the server
    }
}

const getChallenge = async (providerConnectorUrl: string, NFTname: string) => {
    
    const response = await fetch(`${providerConnectorUrl}/assets/${NFTname}/challenge`);
    const challenge = await response.json();

    if(response.ok){
        console.log(challenge);
        return challenge.challenge;
    } else {
        let err = {status: response.status, errObj: challenge};
        throw err;  // An object with the error coming from the server
    }
}

//TODO: handle not only json file
const downloadAsset = async (providerConnectorUrl: string, NFTname: string, challenge: string, signature: string) =>  {

    const response = await fetch(`${providerConnectorUrl}/assets/${NFTname}/download`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            h_nonce: challenge,
            eth_signature: signature
        })
    })
    const asset = await response.json();

    if(response.ok){
        const asset_json = asset["asset"];
        return new Blob([JSON.stringify(asset_json)], {type: "text/json;charset=utf-8"});
    } else {
        let err = {status: response.status, errObj: challenge};
        throw err;  // An object with the error coming from the server
    }
}

const coonectorAPI = { createDID, getIdentity, storeCredential, generatePresentation, signData, getChallenge, downloadAsset };
export default coonectorAPI;