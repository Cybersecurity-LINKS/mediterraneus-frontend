import { Router } from 'express';
import { IdentityController } from '../controllers/controller.js';
import multer from 'multer';
import { readFileSync } from 'fs';
import { create } from 'ipfs-http-client'

const storage = multer.diskStorage({
    destination: '../uploads/',
    filename: function (_, file, cb) {
        console.log(file.originalname)
        cb(null, file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)![0])
    }
});
const upload = multer({storage}).array("files");

const router = Router();
const identityController = new IdentityController();

router.get('/identity/:eth_address', async (req, res) => {
    await identityController.get(req.params.eth_address, res)
} );

router.post('/identity', async (req, res) => {
    await identityController.post(req, res)
});

router.post('/signdata', async (req, res) => {
    await identityController.postSign(req, res)
});

router.post("/storeVC", async (req, res) => {
    await identityController.postStoreVC(req, res);
});

router.post("/uploadOnLAD", async (req, res) => {
    try {
        upload(req, res, async function (err) {
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
            console.log(req.body)
            console.log(req.files)
    
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
            console.log(cid.toString());
    
            /**
             * compute the trust metadata 
            */ 
    
            /**
             * update LAD 
            */ 
    
            res.status(200).send({ cid: cid }).end();
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({error: error.message}).end();
    }
    
});

export default router;