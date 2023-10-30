import { LocalAssetDb } from '../db/__generated__/index.js';
import db, { download_request, identity, local_asset_db} from '../db/dbconfig/dbconnector.js';

export async function insertIdentity(
    eth_address: string,
    did: string,
    privkey: string,
) {
    await identity(db).insert({
        eth_address,
        did,
        privkey,
    });
}

export async function getIdentity(eth_address: string) {
    return await identity(db).findOne({eth_address: eth_address})
}

export async function insertVCintoExistingIdentity(eth_address: string, vc: JSON) {
    try{
        console.log(eth_address)
        let id = await getIdentity(eth_address);
        if(id == null)
            throw "Identity not found in connector's db"
        await identity(db).update({eth_address: eth_address, did: id.did}, {vc: vc});
    }catch(error) {
        console.log(error);
        throw error;
    }
}

export async function insertLADentry(lad_entry: LocalAssetDb) {
    await local_asset_db(db).insert(lad_entry)
}

export async function _getAssetAliases() {
    return await local_asset_db(db).find().all();
}

export async function _getLADentry_byAlias(alias: string) {
    return await local_asset_db(db).findOne({nft_name: alias});
}

export async function _updateLADentry(nft_name: string, nft_sc_address: string) {
    await local_asset_db(db).update({nft_name: nft_name}, {nft_sc_address: nft_sc_address});
}

export async function insertDownloadReq(h_nonce: string, nft_name: string) {
    await download_request(db).insert({h_nonce: h_nonce, nft_name: nft_name}); 
}

export async function getDownloadReq(h_nonce: string) {
    return await download_request(db).findOne({h_nonce: h_nonce});
}

export async function removeDownloadReq(h_nonce: string) {
    await download_request(db).delete({h_nonce: h_nonce}); 
}