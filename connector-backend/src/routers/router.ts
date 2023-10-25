import Router from 'express';
import IdentitiesController from '../controllers/Identities.js';
import AssetsController from '../controllers/Assets.js';

const router = Router();

router.get('/identities/:eth_address', IdentitiesController.getIdentity);
router.post('/identities', IdentitiesController.createIdentity);
router.post('/identities/:eth_address/sign-data', IdentitiesController.signData);
router.patch("/identities/:eth_address", IdentitiesController.storeVC);
router.post("/identities/:eth_address/gen-presentation", IdentitiesController.generateVP);

router.post("/uploadOnLAD", AssetsController.uploadOnLAD);
router.post("/update_nft_address", AssetsController.addNFT_addressOnLAD);
router.get("/assetAliases", AssetsController.getAssetAliases);
router.get("/ladInfo/:eth_address/:asset_alias", AssetsController.getLADentry_byAlias);
router.post("/downalod_asset_req", AssetsController.downloadRequest);
router.post("/downalod_asset_sign", AssetsController.downalodReq_sign);

export default router;