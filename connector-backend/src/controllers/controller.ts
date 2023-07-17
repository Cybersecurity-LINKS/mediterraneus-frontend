import { Identity_InsertParameters } from '../__generated__';
import db from '../dbconfig/dbconnector';
import { getIdentity, insertIdentity } from '../models/db-operations'

export interface TypedRequestBody<T> extends Express.Request {
    body: T
}

export class IdentityController {

    public async post(req: TypedRequestBody<{
        did: string,
        mnemonic: string,
        privkey: string,
        pubkey: string,
        wallet_address: string
    }>, res) {
        try {
            console.log(req.body)
            return await insertIdentity(
                req.body.did, 
                req.body.mnemonic, 
                req.body.privkey, 
                req.body.pubkey, 
                req.body.wallet_address
            )
            res.send(200);
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async get(req: TypedRequestBody<{did: string}>, res) {
        try {
            return await getIdentity(req.body.did)
        } catch (error) {
            res.status(400).send(error);
        }
    }
}