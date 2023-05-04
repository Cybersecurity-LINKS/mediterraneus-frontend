import { IRequestEnc } from "./Irequest_enc";
import Web3 from "web3";
import { Account } from 'web3-core'

export class EncRequest implements IRequestEnc {
    evmAccount: Account;
    data: string;
    signature: string;
    
    public async request_encryption(evmAccount: Account, data: string) {
        this.evmAccount = evmAccount;
        this.data = data;

        this.signature = new Web3().eth.accounts.sign(data, evmAccount.privateKey).signature;
        const response = await fetch('http://localhost:5555/api/encrypt', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                evmAddress: this.evmAccount.address,
                dataToEncrypt: this.data,
                signature: this.signature,
            })
        });
        const content = await response.json();
        console.log(content);
    }
}