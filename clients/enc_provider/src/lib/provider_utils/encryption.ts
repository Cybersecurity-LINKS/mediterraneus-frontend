import { encrypt, decrypt } from 'eciesjs'
import { SimpleBufferCursor } from '../faucet'
import { Converter } from '@iota/util.js';
import { privateToPublic } from 'ethereumjs-util';

export class EncryptData {

    public _encrypt(private_key: string, data: string): string {
        let privKeyB = Converter.hexToBytes(private_key);
        new SimpleBufferCursor().writeUint8Array(privKeyB);
        let pubKey = privateToPublic(Buffer.from(privKeyB));

        let encryptedData = encrypt(pubKey, Buffer.from(data));

        return encryptedData.toString('hex');
    }
}