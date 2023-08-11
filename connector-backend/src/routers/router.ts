import { Router } from 'express';
import { IdentityController } from '../controllers/controller';

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
})

export default router;