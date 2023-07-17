import { Router } from 'express';
import { IdentityController } from '../controllers/controller';

const router = Router();
const identityController = new IdentityController();

router.get('/identity', async (req, res) => {
    await identityController.get(req, res)
} );

router.post('/identity', async (req, res) => {
    await identityController.post(req, res)
});

export default router;