const verifier = import.meta.env.VITE_VERIFIER_BACKEND as string;

const getChallenge = async (did: string) => {
   
    const response = await fetch(`${verifier}/api/challenges/?did=${did}`);
    const json = await response.json();
    if(response.ok){
        return json.challenge[0].nonce; // TODO: modify return value
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const helloWorld = async (presentationJwt: string) => {
    
    const response = await fetch(`${verifier}/api/hello-world`, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Authorization': `Bearer ${presentationJwt}`, 
            "Content-Type": "application/json",
        }
    });
    const json = await response.json();

    if(response.ok){
        console.log(json);
        return true;
    } else {
        const err = {status: response.status, errObj: json};
        throw err;  // An object with the error coming from the server
    }
}

const verifierAPI = { getChallenge, helloWorld };
export default verifierAPI;