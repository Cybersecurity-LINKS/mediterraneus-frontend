import db, {identity} from '../dbconfig/dbconnector';

export async function insertIdentity(
    did: string,
    privkey: string,
) {
    await identity(db).insert({
        did,
        privkey,
    });
}

export async function getIdentity() {
    return await identity(db).find().all()
}

export async function insertVCintoExistingIdentity(vc: JSON) {
    let id = await getIdentity();
    await identity(db).update({did: id[0].did}, {vc: vc});
}