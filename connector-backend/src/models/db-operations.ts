import db, {identity} from '../dbconfig/dbconnector.js';

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