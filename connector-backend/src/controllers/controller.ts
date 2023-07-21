import { IotaDID, IotaDocument } from '@iota/identity-wasm/node'
import { Identity } from '../__generated__'
import { getIdentity, insertIdentity } from '../models/db-operations'
import { createIdentity, resolveDID } from '../services/identity'

export interface TypedRequestBody<T> extends Express.Request {
    body: T
}

export class IdentityController {

    public async post(_, res) {
        createIdentity().then(({did, keypair}) => {
            insertIdentity(
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

    public async get(_, res) {
        try {
            const did_get = (await getIdentity()).at(0);
            if(did_get?.did === undefined)
                throw Error("Could retrieve any DID from the DB.");
            console.log("Resolving DID: ", did_get.did);
            const didDoc: IotaDocument = await resolveDID(IotaDID.parse(did_get.did)) 
            res.status(200).send({
                did: did_get.did,
                did_doc: didDoc
            }).end()
        } catch (error) {
            console.log(error)
            res.status(400).send(error).end();
        }
    }
}