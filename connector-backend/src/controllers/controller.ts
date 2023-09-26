import { IotaDID, IotaDocument, Presentation, X25519, Credential, ProofOptions } from '@iota/identity-wasm/node/index.js'
import { _getAssetAliases, _getLADentry_byAlias, _updateLADentry, getDownloadReq, getIdentity, insertDownloadReq, insertIdentity, insertLADentry, insertVCintoExistingIdentity } from '../models/db-operations.js'
import { createIdentity, resolveDID, signData } from '../services/identity.js'
import { privKeytoBytes, stringToBytes, buf2hex, extractPubKeyFromDoc, getIotaDIDfromString } from '../utils.js'
import { readFileSync } from 'fs';
import { create } from 'ipfs-http-client'
import { ethers, keccak256} from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'crypto-js';
const { AES, enc } = pkg;

import crypto from 'crypto'
import Identity from '../__generated__/identity.js';

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
                nft_sc_address: "",
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

    public async addNFT_addressOnLAD(req: TypedRequestBody<{
        nft_name,
        nft_sc_address
    }>, res) {
        try {
            await _updateLADentry(req.body.nft_name, req.body.nft_sc_address);
            res.status(200).end()
        } catch (error) {
            console.log(error);
            res.status(400).send({error: error}).end()
        }
    }

    public async getAssetAliases(req, res) {
        try {
            let lad_entries = await _getAssetAliases();
            const aliases: string[] = lad_entries.map(entry => {
                return entry.nft_name
            })
            res.status(200).send({aliases: aliases}).end()    
        } catch (error) {
            res.status(500).send({error: "Could not retreive any data from the DB"}).end();
        }
    }

    public async getLADentry_byAlias(asset_alias, eth_address, res) {
        try {
            console.log(`${asset_alias} ${eth_address}`)
            const lad_entry = await _getLADentry_byAlias(asset_alias);
            if(lad_entry === null)
                throw "";
            const identity = await getIdentity(eth_address);

            const gc_resp = await fetch(`${process.env.GC_ENDPOINT}/catalogueDID`, {
                method: "GET"
            })
            const gc_did = (await gc_resp.json())["did"]
            const gc_doc = await resolveDID(IotaDID.parse(gc_did))

            // the CID must be encrypted before returning it to the "front" connector.
            // asymmetric crypto can be used to determine a common shared secret between two parties:
            // the connector uses its private key and GC's public key to compute a shared secret.

            // The shared secret, known only to those who know a relevant secret key (yours or theirs). It is not cryptographically random. Do not use it directly as a key.
            const gc_pub_key = extractPubKeyFromDoc(gc_doc);
            const priv_key_x25119 = X25519.Ed25519toX25519Private(privKeytoBytes(identity.privkey));
            const gc_pub_key_x25119 = X25519.Ed25519toX25519Public(gc_pub_key);
            const shared_key = X25519.keyExchange(priv_key_x25119, gc_pub_key_x25119);

            let ciphertext;
            crypto.hkdf('sha512', shared_key, '', '', 64, (err, derivedKey) => {
                if (err) throw err;
                console.log(Buffer.from(derivedKey).toString('hex'));  // '24156e2...5391653'
            
                ciphertext = AES.encrypt(lad_entry.cid, Buffer.from(derivedKey).toString('hex')).toString();
                lad_entry.cid = ciphertext;  
                
                res.status(200).send({lad_entry: lad_entry}).end();
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({error: "Could not retreive any data from the DB"}).end();
        }
    }

    public async simulateGCdecrypt(req: TypedRequestBody<{
        ciphertext,
        eth_address
    }>, res) {
        // hex string of the private key of the Issuer. The issuer keys are for now used to simulate the GC to try if this works.
        const gc_priv_key_x25119 = X25519.Ed25519toX25519Private(Uint8Array.from(Buffer.from('47c62af8fc25c32ef0d9cb493fc3d10f7709085770e9fdf016a1c0f4a79a2fa1', 'hex')))

        const identity = await getIdentity(req.body.eth_address);
        const doc = await resolveDID(IotaDID.parse(identity.did))
        const pub_key_x25119 = X25519.Ed25519toX25519Public(extractPubKeyFromDoc(doc));
        
        const shared_key = X25519.keyExchange(gc_priv_key_x25119, pub_key_x25119);
        
        crypto.hkdf('sha512', shared_key, '', '', 64, (err, derivedKey) => {
            if (err) throw err;
            console.log(Buffer.from(derivedKey).toString('hex'));  // '24156e2...5391653'

            const decrypted = AES.decrypt(req.body.ciphertext, Buffer.from(derivedKey).toString('hex'));
            console.log(`decrypted: ${decrypted.toString(enc.Utf8)}`);
        });
        
        console.log(buf2hex(shared_key));
        res.status(200).send({key: buf2hex(shared_key)}).end();
    }

    public async generateVP(req: TypedRequestBody<{
        eth_address,
        challenge
    }>, res) {
        try {
            const identity: Identity = await getIdentity(req.body.eth_address);
            const did_doc = await resolveDID(getIotaDIDfromString(identity.did))

            const unsignedVp = new Presentation({
                holder: did_doc.id(),
                verifiableCredential: Credential.fromJSON(identity.vc)
            });
            const signedVp = await did_doc.signPresentation(
                unsignedVp,
                privKeytoBytes(identity.privkey),
                "#key-1",
                new ProofOptions({
                    challenge: req.body.challenge["challenge"].toString()
                }));
            const signedVp_json = signedVp.toJSON();

            res.status(200).send({signed_vp: signedVp_json}).end();
        } catch (error) {
            console.log(error);
            res.status(500).send({error: `Could not generate the VP: ${error}`}).end();
        }
    }

    public async downloadRequest(req: TypedRequestBody<{
        nft_name
    }>, res) {
        try {
            // check I actually own the asset
            const lad_entry = await _getLADentry_byAlias(req.body.nft_name);
            if(lad_entry === null || lad_entry === undefined)
                throw "Asset does not exist on this connector"

            const nonce = uuidv4();
            await insertDownloadReq(keccak256(nonce), req.body.nft_name);   
            res.status(201).send({nonce: nonce}).end();
        } catch (error) {
            console.log(error);
            res.status(400).send({error: error}).end();
        }
    }

    public async downalodReq_sign(req: TypedRequestBody<{
        h_nonce,
        eth_signature
    }>, res) {
        try {
            const download_request = await getDownloadReq(req.body.h_nonce);
            const lad_entry = await _getLADentry_byAlias(download_request.nft_name);

            const provider = new ethers.JsonRpcProvider(process.env.LOCALNODE_RPC_PROVIDER);
            // TODO: missing abi parse of erc721 and call 'verify Proof of Purchase'
        } catch (error) {
            console.log(error);
            res.status(400).send({error: error}).end();
        }
        
    }
}