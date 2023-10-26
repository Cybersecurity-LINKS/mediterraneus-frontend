import { IotaDID, X25519 } from '@iota/identity-wasm/node/index.js'
import * as DbOperations from '../models/db-operations.js'
import * as IdentityService from '../services/identity.js'
import { privKeytoBytes, stringToBytes, buf2hex, extractPubKeyFromDoc, readAsset } from '../utils.js'
import { readFileSync } from 'fs';
import { create } from 'ipfs-http-client'
import { ethers, keccak256 } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'crypto-js';
import crypto from 'crypto'

import abi from '../abi/erc721-abi.json' assert {type: "json"};
import {Request, Response, NextFunction} from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: '../uploads/',
    filename: function (_, file, cb) {
        console.log(file.originalname)
        cb(null, file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)![0])
    }
});

function uploadFiles(req: Request, res: Response, next: NextFunction) {
    const upload = multer({storage}).array("files");

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
            return;
        } else if (err) {
            // An unknown error occurred when uploading.
            if (err.name == 'ExtensionError') {
                res.status(413).send({ error: { message: err.message } }).end();
            } else {
                res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
            }
            return;
        }
        // Everything went fine. 
        next()
    })
}

async function uploadOnLAD(req: Request, res: Response) {

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

        const identity = await DbOperations.getIdentity(additional.eth_address);

        const tm_signature_hex = buf2hex(IdentityService.signData(stringToBytes(asset_hash.concat(offering_hash)), privKeytoBytes(identity!.privkey)))
        console.log(`Trust metadata:\n${asset_hash}\n${offering_hash}\n${tm_signature_hex}`);

        /**
         * update LAD 
        */
        await DbOperations.insertLADentry({
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

async function addNFT_addressOnLAD(req: Request, res: Response) {
    const nft_name = req.params.asset_id;
    const nft_sc_address = req.body.nft_sc_address;
    try {
        console.log(`Upload ${nft_name} ${nft_sc_address}`)
        await DbOperations._updateLADentry(nft_name, nft_sc_address);
        res.status(200).end()
    } catch (error) {
        console.log(error);
        res.status(400).send({error: error}).end()
    }
}

async function getAssetAliases(req: Request, res: Response) {
    try {
        let lad_entries = await DbOperations._getAssetAliases();
        const aliases: string[] = lad_entries.map(entry => {
            return entry.nft_name
        })
        res.status(200).send({aliases: aliases}).end()    
    } catch (error) {
        res.status(500).send({error: "Could not retreive any data from the DB"}).end();
    }
}

async function getLADentry_byAlias(req: Request, res: Response) {
    const asset_alias = req.params.asset_id;
    const eth_address = req.query.eth_address as string; // TODO: Define Request interface type?
    try {
        console.log(`${asset_alias} ${eth_address}`)
        const lad_entry = await DbOperations._getLADentry_byAlias(asset_alias);
        if(lad_entry === null)
            throw "";
        const identity = await DbOperations.getIdentity(eth_address);

        const gc_resp = await fetch(`${process.env.GLOBAL_CATALOGUE_ENDPOINT}/catalogueDID`, {
            method: "GET"
        })
        const gc_did = (await gc_resp.json())["did"]
        const gc_doc = await IdentityService.resolveDID(IotaDID.parse(gc_did))

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
        
            ciphertext = pkg.AES.encrypt(lad_entry.cid, Buffer.from(derivedKey).toString('hex')).toString();
            lad_entry.cid = ciphertext;  
            
            res.status(200).send({lad_entry: lad_entry}).end();
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({error: "Could not retreive any data from the DB"}).end();
    }
}

async function downloadRequest(req: Request, res: Response) {
    const nft_name = req.params.asset_id;
    try {
        // check I actually own the asset
        const lad_entry = await DbOperations._getLADentry_byAlias(nft_name);
        if(lad_entry === null || lad_entry === undefined)
            throw "Asset does not exist on this connector"

        const nonce = uuidv4();
        await DbOperations.insertDownloadReq(keccak256(Buffer.from(nonce)), nft_name);   
        res.status(201).send({nonce: nonce}).end();
    } catch (error) {
        console.log(error);
        res.status(400).send({error: error}).end();
    }
}

async function downalodReq_sign(req: Request, res: Response) {
    //TODO: use req.params.asset_id
    const h_nonce = req.body.h_nonce;
    const eth_signature = req.body.eth_signature;

    try {
        const download_request = await DbOperations.getDownloadReq(h_nonce);
        console.log(download_request);
        const lad_entry = await DbOperations._getLADentry_byAlias(download_request.nft_name);
        console.log(lad_entry);
        
        // TODO: missing abi parse of erc721 and call 'verify Proof of Purchase'
        const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);
        const contractIstance = new ethers.Contract(lad_entry.nft_sc_address, abi.abi, provider);

        const PoP = await contractIstance.verifyPoP(eth_signature, h_nonce);
        console.log(PoP);
        if (PoP) {
            const asset_json = readAsset(`${lad_entry.asset_path}`);
            console.log(asset_json);
            res.status(200).send({asset: asset_json}).end();
        } else {
            console.log("Proof of possesion failed!");
            res.status(400).send({asset: "NOT ALLOWED TO DOWNLOAD ASSET"}).end();
        }
    } catch (error) {
        console.log("errore: ", error);
        res.status(400).send({error: error}).end();
    }
    
}

const AssetsController = { uploadFiles, uploadOnLAD, addNFT_addressOnLAD, getAssetAliases, getLADentry_byAlias, downloadRequest, downalodReq_sign };
export default AssetsController;