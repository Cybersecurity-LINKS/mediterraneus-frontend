import { Router } from 'express';
import { IdentityController } from '../controllers/controller.js';
import multer from 'multer';

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
});

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
        await identityController.uploadOnLAD(req, res); 
    })
});

router.post("/update_nft_address", async (req, res) => {
    await identityController.addNFT_addressOnLAD(req, res);
})

router.get("/assetAliases", async (req, res) => {
    await identityController.getAssetAliases(req, res);
})

router.get("/ladInfo/:eth_address/:asset_alias", async (req, res) => {
    await identityController.getLADentry_byAlias(req.params.asset_alias, req.params.eth_address, res);
})

router.post("/simulate", async (req, res) => {
    await identityController.simulateGCdecrypt(req, res);
})

router.post("/generate_vp", async (req, res) => {
    await identityController.generateVP(req, res);
});

router.post("/downalod_asset_req", async (req, res) => {
    await identityController.downloadRequest(req, res);
})

router.post("/downalod_asset_sign", async (req, res) => {
    await identityController.downalodReq_sign(req, res);
})

export default router;