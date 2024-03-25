import isUrl from 'is-url';

const generatePresentation = async (connectorUrl: string, challenge: string, idenityId: number, ethSignature: string | null ) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }

    const body = ethSignature ? {challenge: challenge, ethSignature: ethSignature} : {challenge: challenge};

    const response = await fetch(`${connectorUrl}/api/identities/${idenityId}/gen-presentation`, {
        method: "POST", // *GET, POST, PUT, DELETE, etc. ? LOL
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
    });
    const presentation = await response.json();

    if(response.ok){
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

const getChallenge = async (providerConnectorUrl: string, userDid: string) => {
    if (!isUrl(providerConnectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${providerConnectorUrl}/api/challenges?did=${userDid}`);
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
const downloadAsset = async (providerConnectorUrl: string, assetAlias: string, presentation: string) =>  {
    if (!isUrl(providerConnectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${providerConnectorUrl}/api/assets/download?alias=${assetAlias}`, {
        method: 'GET',
        headers: {
            "Content-type": "application/json", 
            "Authorization": `Bearer ${presentation}`,
        }
    });
    const asset = await response.json();
    
    if(response.ok){
        const asset_json = asset["asset"];
        return new Blob([JSON.stringify(asset_json)], {type: "text/json;charset=utf-8"});
    } else {
        const err = {status: response.status, errObj: asset};
        throw err;  // An object with the error coming from the server
    }
}

const getAssetInfo = async (connectorUrl: string, chosenAssetAlias: string) => {
    if (!isUrl(connectorUrl)) {
        throw "Connector url undefined";
    }
    const response = await fetch(`${connectorUrl}/api/assets?alias=${chosenAssetAlias}`)
    const json = await response.json();

    if(response.ok){
        return json; // TODO: return asset info, maybe define a type
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const getAssetAliases = async (connectorUrl: string, ethAddress: string) => {

    const response = await fetch(`${connectorUrl}/api/assets/aliases?ethAddress=${ethAddress}`);
    const json = await response.json();

    if(response.ok){
        console.log("Available asset inside Connector:", json.aliases);
        return json.aliases; 
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const setAssetNftAddress = async (connectorUrl: string, assetAlias: string, nftAddress: string) => {
    
    const response = await fetch(`${connectorUrl}/api/assets?alias=${assetAlias}`, {
        method: 'PATCH',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            nftAddress: nftAddress,
        })
    });
    const json = await response.json();    
    
    if(response.ok){
        console.log("Updated asset:", json);
        return json; 
    } else {
        console.log("Cannot update nft address");
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const getCidContent = async (connectorUrl: string, cid: string) => {
    const response = await fetch(`${connectorUrl}/api/cids/${cid}`);
    const json = await response.json();

    if(response.ok){
        return json; 
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const connectorAPI = { createDID, getIdentity, storeCredential, generatePresentation, signData, getChallenge, uploadAsset, downloadAsset, getAssetInfo, getAssetAliases, setAssetNftAddress, getCidContent };
export default connectorAPI;