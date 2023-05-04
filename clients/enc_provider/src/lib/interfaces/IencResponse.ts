export interface IEncResponse {
    from: string;
    encryptedData: string;
}

export class EncResponse implements IEncResponse {
    from: string;
    encryptedData: string;
}