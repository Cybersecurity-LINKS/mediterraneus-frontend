import { Router } from 'express';
import { IdentityController } from '../controllers/controller';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: '../uploads/',
    filename: function (req, file, cb) {
        console.log(file.originalname)
        cb(null, file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)[0])
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
        // show file `req.files`
        // show body `req.body`
        res.status(200).send({ message: "Successfully uploaded files" }).end();
    })
    // console.log(req.body);
    // res.json({ message: "Successfully uploaded files" });
});

export default router;