import { Identity } from '../__generated__'
import { getIdentity, insertIdentity } from '../models/db-operations'
import { createIdentity } from '../services/create_identity'

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
        getIdentity().then((did_get: Identity[]) => {
            res.status(200)
            .send({did: did_get[0].did})
            .end();
        }).catch((error) => {
            console.log(error)
            res.status(400).send(error).end();
        });
    }
}