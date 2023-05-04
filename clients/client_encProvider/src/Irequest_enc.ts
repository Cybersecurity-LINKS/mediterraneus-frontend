import { Account } from 'web3-core'
export interface IRequestEnc {
    evmAccount: Account;
    data: string;
    signature: string;
}
