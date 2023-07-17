import { Router } from 'express';
import { IdentityController } from '../controllers/controller';
import bodyParser from 'body-parser';
import db from '../dbconfig/dbconnector';

const router = Router();
const identityController = new IdentityController();

router.get('/identity', async (req, res) => {
    await identityController.get(req, res)
} );

router.post('/identity', async (req, res) => {
    await identityController.post(req, res)
});

export default router;