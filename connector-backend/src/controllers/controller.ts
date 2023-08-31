import { IotaDID, IotaDocument } from '@iota/identity-wasm/node/index.js'
import { getIdentity, insertIdentity, insertLADentry, insertVCintoExistingIdentity } from '../models/db-operations.js'
import { createIdentity, resolveDID, signData } from '../services/identity.js'
import { privKeytoBytes, stringToBytes, buf2hex } from '../utils.js'
import { readFileSync } from 'fs';
import { create } from 'ipfs-http-client'
import { keccak256 } from 'ethers';

export interface TypedRequestBody<T> extends Express.Request {
    body: T
}

export class IdentityController {

    public async post(req: TypedRequestBody<{
        eth_address
    }>, res) {
        if(req.body.eth_address !== undefined) {
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
        } else {
            res.status(400).send({error: "Eth address undefined"}).end();
        }

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

    public async uploadOnLAD(
        req, res
    ) {
        try {
            let additional = JSON.parse(req.body.additional);
            /**  
             * load offering file's content of IPFS and get CID back
             */
            const asset_content = readFileSync(req.files[0].path, 'utf-8');
            const offering_content = readFileSync(req.files[1].path, 'utf-8');
            
            // connect to the default API address http://localhost:5001
            const client = create({
                    url: "http://127.0.0.1:5001/api/v0" 
            })
            // call Core API methods
            const { cid } = await client.add(offering_content)
    
            /**
             * compute the trust metadata 
            */ 
            const asset_hash = keccak256(Buffer.from(asset_content, 'utf-8'));
            const offering_hash = keccak256(Buffer.from(offering_content, 'utf-8'))

            const identity = await getIdentity(additional.eth_address);

            const tm_signature_hex = buf2hex(signData(stringToBytes(asset_hash.concat(offering_hash)), privKeytoBytes(identity!.privkey)))
            console.log(`Trust metadata:\n${asset_hash}\n${offering_hash}\n${tm_signature_hex}`);

            /**
             * update LAD 
            */
            await insertLADentry({
                nft_name: additional.asset_alias,
                asset_path: req.files[0].path,
                cid: cid.toString(),
                hash_asset: asset_hash,
                hash_offering: offering_hash,
                offering_path: req.files[1].path,
                sign: tm_signature_hex
            })
            
            res.status(200).send({ cid: cid.toString() }).end();
        } catch (error) {
            console.log(error.message)
            // remove just saved files
            // ...
            // error.code == 23505 => duplicate key value violates unique constraint "local_asset_db_pkey"
            res.status(500).send({error: error.message, error_code: error.code}).end();

        }
    }
}