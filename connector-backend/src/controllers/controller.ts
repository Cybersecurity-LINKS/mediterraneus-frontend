import { IotaDID, IotaDocument } from '@iota/identity-wasm/node'
import { getIdentity, insertIdentity, insertVCintoExistingIdentity } from '../models/db-operations'
import { createIdentity, resolveDID, signData } from '../services/identity'
import { privKeytoBytes, stringToBytes, buf2hex } from '../utils'

export interface TypedRequestBody<T> extends Express.Request {
    body: T
}

export class IdentityController {

    public async post(req: TypedRequestBody<{
        eth_address
    }>, res) {
        createIdentity().then(({did, keypair}) => {
            insertIdentity(
                req.body.eth_address.toString(),
                did.toString(), 
                keypair.private().toString(), 
            ).then( () => {
                res.status(201).send({did: did}).end();
            }).catch((error) => {
                console.log(error)
                res.status(400).send(error).end();
            })  
        }).catch((error) => {
            console.log(error)
            res.status(401).send(error).end();
        })
    }

    public async get(eth_address: string, res) {
        try {
            const did_get = (await getIdentity(eth_address));
            if(did_get?.did === undefined)
                throw Error("Could not retrieve any DID from the DB.");
            console.log("Resolving DID: ", did_get.did);
            const didDoc: IotaDocument = await resolveDID(IotaDID.parse(did_get.did)) 
            res.status(200).send({
                did: did_get.did,
                did_doc: didDoc,
                vc: did_get.vc
            }).end()
        } catch (error) {
            console.log(error)
            res.status(400).send(error).end();
        }
    }

    public async postSign(req: TypedRequestBody<{
        vchash,
        eth_address
    }>, res) {
        try {
            const identity = (await getIdentity(req.body.eth_address));
            if(identity === undefined)
                throw Error("Could retrieve any private key from the DB.");
            const ssi_signature = buf2hex(signData(stringToBytes(req.body.vchash), privKeytoBytes(identity!.privkey)));
            res.status(201).send({ssi_signature: `${ssi_signature}`}).end();
        } catch (error) {
            console.log(error);
            res.status(400).send(error).end();
        }
    }

    public async postStoreVC(req: TypedRequestBody<{
        vc,
        eth_address
    }>, res) {
        try {
            await insertVCintoExistingIdentity(req.body.eth_address, req.body.vc as JSON);
            res.status(201).end();
        } catch (error) {
            console.log(error);
            res.status(400).send(error).end();
        }
    }
}