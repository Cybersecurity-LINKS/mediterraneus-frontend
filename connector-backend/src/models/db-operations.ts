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