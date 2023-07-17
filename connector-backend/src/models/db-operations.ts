import db, {identity} from '../dbconfig/dbconnector';

export async function insertIdentity(
    did: string,
    mnemonic: string,
    privkey: string,
    pubkey: string,
    wallet_address: string
) {
    return await identity(db).insert({
        did,
        mnemonic,
        privkey,
        pubkey,
        wallet_address
    });
  }

export async function getIdentity(did_in: string) {
    return await identity(db).find({did: did_in})
}