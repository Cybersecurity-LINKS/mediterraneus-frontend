import { Router } from 'express';
import { IdentityController } from '../controllers/controller';
import multer from 'multer';
import { readFileSync } from 'fs';

const storage = multer.diskStorage({
    destination: '../uploads/',
    filename: function (req, file, cb) {
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

        // load offering file's content of IPFS and get CID back
        // const fs = unixfs(heliaNode);

        // for(const file in req?.files) {
        //     const content = readFileSync(req.files[file].path, 'utf-8');
        //     console.log(content)
        //     const encoder = new TextEncoder()
            // const cid = await fs.addFile({
            //     path: req.files[file].path,
            //     content: encoder.encode(content)
            // })
            // console.log("cid: ", cid);
        // }
        // compute the trust metadata

        // update LAD

        res.status(200).send({ message: "Successfully uploaded files" }).end();
    })
});

export default router;