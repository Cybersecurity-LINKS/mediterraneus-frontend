import { IotaDID, IotaDocument, Presentation, Credential, ProofOptions } from '@iota/identity-wasm/node/index.js'
import * as DbOperations from '../models/db-operations.js'
import * as IdentityService from '../services/identity.js'
import { privKeytoBytes, stringToBytes, buf2hex, getIotaDIDfromString } from '../utils.js'
import Identity from '../__generated__/identity.js';

import {Request, Response} from 'express';

async function createIdentity(req: Request, res: Response) {
    const eth_address = req.body.eth_address;
    if(eth_address !== undefined) {
        IdentityService.createIdentity().then(({did, keypair}) => {
            DbOperations.insertIdentity(
                eth_address.toString(),
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

async function getIdentity(req: Request, res: Response) {
    const eth_address = req.params.eth_address;
    try {
        // console.log(ethers.getAddress(eth_address));
        const did_get = await DbOperations.getIdentity(eth_address);
        if(did_get?.did === undefined)
            throw Error("Could not retrieve any DID from the DB.");
        console.log("Resolving DID: ", did_get.did);
        const didDoc: IotaDocument = await IdentityService.resolveDID(IotaDID.parse(did_get.did)) 
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

 async function signData(req: Request, res: Response) {
    const eth_address = req.params.eth_address;
    const payload = req.body.payload; // data do be signed

    try {
        const identity = await DbOperations.getIdentity(eth_address);
        if(identity === undefined)
            throw Error("Could retrieve any private key from the DB.");
        const ssi_signature = buf2hex(IdentityService.signData(stringToBytes(payload), privKeytoBytes(identity!.privkey)));
        res.status(201).send({ssi_signature: `${ssi_signature}`}).end();
    } catch (error) {
        console.log(error);
        res.status(400).send(error).end();
    }
}

async function storeVC(req: Request, res: Response) {
    const eth_address = req.params.eth_address;
    const vc = req.body.vc as JSON
    try {
        await DbOperations.insertVCintoExistingIdentity(eth_address, vc);
        res.status(201).end();
    } catch (error) {
        console.log(error);
        res.status(400).send(error).end();
    }
}

async function generateVP(req: Request, res: Response) {

    const eth_address = req.params.eth_address;
    const challenge = req.body.challenge;

    try {
        const identity: Identity = await DbOperations.getIdentity(eth_address);
        const did_doc = await IdentityService.resolveDID(getIotaDIDfromString(identity.did))

        const unsignedVp = new Presentation({
            holder: did_doc.id(),
            verifiableCredential: Credential.fromJSON(identity.vc)
        });
        const signedVp = await did_doc.signPresentation(
            unsignedVp,
            privKeytoBytes(identity.privkey),
            "#key-1",
            new ProofOptions({
                challenge: challenge["challenge"].toString()
            }));
        const signedVp_json = signedVp.toJSON();

        res.status(200).send({signed_vp: signedVp_json}).end();
    } catch (error) {
        console.log(error);
        res.status(500).send({error: `Could not generate the VP: ${error}`}).end();
    }
}

const IdentitiesController = { createIdentity, getIdentity, signData, storeVC, generateVP };
export default IdentitiesController;