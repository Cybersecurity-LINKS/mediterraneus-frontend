const catalogue_backend = import.meta.env.VITE_CATALOGUE_BACKEND as string;

const getChallenge = async (eth_address: string) => {
    
    const response = await fetch(`${catalogue_backend}/challenge/${eth_address}`);
    const challenge = await response.json();

    if(response.ok){
        console.log(challenge);
        return challenge;
    } else {
        let err = {status: response.status, errObj: challenge};
        throw err;  // An object with the error coming from the server
    }
}

const login = async (signed_vp: string, eth_addrres: string) => {
    
    const response = await fetch(`${catalogue_backend}/login`, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            eth_address: eth_addrres,
            signed_vp: signed_vp
        }), // body data type must match "Content-Type" header
    });
    const result = await response.text();

    if(response.ok){
        return true;
    } else {
        let err = {status: response.status, errObj: result};
        throw err;  // An object with the error coming from the server
    }
}

const getOfferingContent = async (encryptedCID: string, ownerDID: string) => {
    // need the owner pub key and the gc priv key to derive the shared key and decrypt the cid
    const response = await fetch(`${catalogue_backend}/offerings?ecid=${encodeURIComponent(encryptedCID)}&owner=${ownerDID}`);
    const offering = await response.json();
    
    if (response.ok){
        return offering.offering;
    } else {
        let err = {status: response.status, errObj: offering};
        throw err;  // An object with the error coming from the server
    }
    
}


const catalogueAPI = { getChallenge, login, getOfferingContent };
export default catalogueAPI;