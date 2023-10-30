import Router from 'express';
import IdentitiesController from '../controllers/Identities.js';
import AssetsController from '../controllers/Assets.js';

const router = Router();

// Identities APIs
router.post("/identities", IdentitiesController.createIdentity);
router.get("/identities/:ethAddress", IdentitiesController.getIdentity);
router.patch("/identities/:ethAddress", IdentitiesController.storeVC); // TODO: add validator to modify only VC
router.post("/identities/:ethAddress/sign-data", IdentitiesController.signData);
router.post("/identities/:ethAddress/gen-presentation", IdentitiesController.generateVP);

// Assets APIs
router.post("/assets", AssetsController.uploadFiles, AssetsController.uploadOnLAD);
router.get("/assets", AssetsController.getAssetAliases); // TODO: use query params "?fields=:field"
router.patch("/assets/:assetId", AssetsController.addNFT_addressOnLAD); // TODO: add validator to modify only nft
router.get("/assets/:assetId", AssetsController.getLADentry_byAlias); 
router.get("/assets/:assetId/challenge", AssetsController.downloadRequest);
router.post("/assets/:assetId/download", AssetsController.downalodReq_sign);

export default router;