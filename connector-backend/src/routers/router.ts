import Router from 'express';
import IdentitiesController from '../controllers/Identities.js';
import AssetsController from '../controllers/Assets.js';

const router = Router();

router.get("/identities/:eth_address", IdentitiesController.getIdentity);
router.post("/identities", IdentitiesController.createIdentity);
router.post("/identities/:eth_address/sign-data", IdentitiesController.signData);
router.patch("/identities/:eth_address", IdentitiesController.storeVC); // TODO: add validator to modify only VC
router.post("/identities/:eth_address/gen-presentation", IdentitiesController.generateVP);

// router.post("/uploadOnLAD", AssetsController.uploadFiles, AssetsController.uploadOnLAD);
// router.post("/update_nft_address", AssetsController.addNFT_addressOnLAD);
// router.get("/assetAliases", AssetsController.getAssetAliases);
// router.get("/ladInfo/:eth_address/:asset_alias", AssetsController.getLADentry_byAlias);
// router.post("/downalod_asset_req", AssetsController.downloadRequest);
// router.post("/downalod_asset_sign", AssetsController.downalodReq_sign);

router.post("/assets", AssetsController.uploadFiles, AssetsController.uploadOnLAD);
router.patch("/assets/:asset_id", AssetsController.addNFT_addressOnLAD); // TODO: add validator to modify only nft
router.get("/assets", AssetsController.getAssetAliases); // TODO: use query params "?fields=:field"
router.get("/assets/:asset_id", AssetsController.getLADentry_byAlias); 
router.get("/assets/:asset_id/get-challenge", AssetsController.downloadRequest);
router.post("/assets/:asset_id/download", AssetsController.downalodReq_sign);

export default router;