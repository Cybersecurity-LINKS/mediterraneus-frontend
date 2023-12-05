import isUrl from 'is-url';

const generatePresentation = async (connectorUrl: string, challenge: string, idenityId: number,) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/identities/${idenityId}/gen-presentation`, {
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
        const err = {status: response.status, errObj: presentation};
        throw err;  // An object with the error coming from the server
    }
}

const getIdentity = async (connectorUrl: string, ethAddress: string) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/identities?ethAddress=${ethAddress}`);
    const json = await response.json();

    if(response.ok){
        return json;
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const createDID = async (connectorUrl: string, ethAddress: string) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/identities`, {
        method: 'POST',
        headers: {
        "Content-type": "application/json"
        },
        body: JSON.stringify({ethAddress: ethAddress}) 
    });

    const response_json = await response.json();
    if(response.ok){
        const did = response_json.did;
        console.log(did);
        return did;
    } else {
        const err = {status: response.status, errObj: response_json.error};
        throw err;  // An object with the error coming from the server
    }
}

const storeCredential = async (connectorUrl: string, ethAddress: string, credential: JSON) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    // store VC in connector's backend.
    const response = await fetch(`${connectorUrl}/api/identities?ethAddress=${ethAddress}`, {
        method: 'PATCH',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            credentialJwt: credential,
        })
    });
    if(!response.ok){
        // Couldn't be able to store the credential
        const err = {status: response.status, errObj: response.json()};
        throw err;  // An object with the error coming from the server
    }
}

const signData = async (connectorUrl: string, idenityId: number, payload: string) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/identities/${idenityId}/sign-data`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({payload: payload, nonce: payload}) // TODO: add new parameter, understand if payload is still necessary
    });
    const json = await response.json();

    if(response.ok){
        console.log("ssi signature: ", json.ssiSignature);
        return json.ssiSignature;
    } else {
        const err = {status: response.status, errObj: json.error};
        throw err;  // An object with the error coming from the server
    }
}

const getChallenge = async (providerConnectorUrl: string, NFTname: string) => {
    if (!isUrl(providerConnectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${providerConnectorUrl}/api/assets/${NFTname}/challenge`);
    const json = await response.json();

    if(response.ok){
        return json.nonce;
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}


const uploadAsset = async (connectorUrl: string, offeringFile: Blob, assetFile: Blob, assetAlias: string, ethAddress: string) =>  {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
  
    const formData = new FormData();      

    formData.append("files", assetFile);
    formData.append("files", offeringFile);
    formData.append("ethAddress", ethAddress);
    formData.append("alias", assetAlias);
    const response = await fetch(`${connectorUrl}/api/assets`, {
        method: "POST",
        body: formData,
    });

    const json = await response.json();
    if(response.ok) {
        return json.cid; // return the whole object
    } else {
        const err = {status: response.status, errObj: json};
        throw err;
    }
    
}

//TODO: handle not only json file
const downloadAsset = async (providerConnectorUrl: string, NFTname: string, challenge: string, signature: string) =>  {
    if (!isUrl(providerConnectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${providerConnectorUrl}/api/assets/${NFTname}/download`, {
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
        const err = {status: response.status, errObj: challenge};
        throw err;  // An object with the error coming from the server
    }
}

const getAssetInfo = async (connectorUrl: string, chosen_alias: string, ethAddress: string) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/assets/${chosen_alias}?eth_address=${ethAddress}`)
    const json = await response.json();

    if(response.ok){
        return json.lad_entry; // TODO: return asset info
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const encryptCid = async (connectorUrl: string, NFTname: string, ethAddress: string ) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/assets/${NFTname}/encrypt-cid?ethAddress=${ethAddress}`);
    const json = await response.json();  

    if(response.ok){
        return json.encryptedCid; // TODO: return cid
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const connectorAPI = { createDID, getIdentity, storeCredential, generatePresentation, signData, getChallenge, uploadAsset, downloadAsset, encryptCid, getAssetInfo };
export default connectorAPI;