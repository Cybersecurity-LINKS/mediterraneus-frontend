import { IotaDID, IotaDocument, Presentation, Credential, ProofOptions } from '@iota/identity-wasm/node/index.js'
import * as DbOperations from '../models/db-operations.js'
import * as IdentityService from '../services/IdentityService.js'
import { privKeytoBytes, stringToBytes, buf2hex, getIotaDIDfromString } from '../utils.js'
import Identity from '../db/__generated__/identity.js';

import {Request, Response} from 'express';

async function createIdentity(req: Request, res: Response) {
    const ethAddress = req.body.ethAddress;
    if(ethAddress !== undefined) {
        try {
            const identity = await IdentityService.createIdentity();
            await DbOperations.insertIdentity(ethAddress.toString(), identity.did.toString(), identity.keypair.private().toString());
            res.status(201).send({did: identity.did.toString(), document: identity.didDoc.toString}).end();
        } catch (error) {
            res.status(500).send(error).end();
        }
    } else {
        res.status(400).send({error: "Eth address undefined"}).end();
    }
}

async function getIdentity(req: Request, res: Response) {
    const ethAddress = req.params.ethAddress;
    try {
        // console.log(ethers.getAddress(ethAddress));
        const did_get = await DbOperations.getIdentity(ethAddress);
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
    const ethAddress = req.params.ethAddress;
    const payload = req.body.payload; // data do be signed

    try {
        const identity = await DbOperations.getIdentity(ethAddress);
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
    const ethAddress = req.params.ethAddress;
    const vc = req.body.vc as JSON
    try {
        await DbOperations.insertVCintoExistingIdentity(ethAddress, vc);
        res.status(201).end();
    } catch (error) {
        console.log(error);
        res.status(400).send(error).end();
    }
}

async function generateVP(req: Request, res: Response) {

    const ethAddress = req.params.ethAddress;
    const challenge = req.body.challenge;

    try {
        const identity: Identity | null = await DbOperations.getIdentity(ethAddress);
        const did_doc = await IdentityService.resolveDID(getIotaDIDfromString(identity!.did))

        const unsignedVp = new Presentation({
            holder: did_doc.id(),
            verifiableCredential: Credential.fromJSON(identity!.vc)
        });
        const signedVp = await did_doc.signPresentation(
            unsignedVp,
            privKeytoBytes(identity!.privkey),
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