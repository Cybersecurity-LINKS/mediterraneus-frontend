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
        insertIdentity(
            req.body.did, 
            req.body.mnemonic, 
            req.body.privkey, 
            req.body.pubkey, 
            req.body.wallet_address
        ).then( () => {
            res.status(201).end();
        }).catch((error) => {
            console.log(error)
            res.status(400).send(error).end();
        })
    }

    public async get(_, res) {
        getIdentity().then((did_get) => {
            console.log(did_get)
            res.status(200)
            .send(did_get)
            .end();
        }).catch((error) => {
            console.log(error)
            res.status(400).send(error).end();
        });
    }
}