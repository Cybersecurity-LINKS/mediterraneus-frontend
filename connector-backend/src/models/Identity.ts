export class Identity {   
    ethAddress: string;
    did: string;
    privateKey: string;
    credential: JSON;

    constructor(ethAddress: string, did: string, privateKey: string, credential: JSON) {
        
        this.ethAddress = ethAddress;
        this.did = did;
        this.privateKey = privateKey;

        if (credential) {
            this.credential = credential;
        }
    }
}