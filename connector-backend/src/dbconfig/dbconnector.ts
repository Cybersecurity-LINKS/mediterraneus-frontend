import createConnectionPool, {sql} from '@databases/pg';
import tables from '@databases/pg-typed';
import DatabaseSchema from '../__generated__';
import schemajson from '../__generated__/schema.json' assert {type: "json"};

// import { createRequire } from 'node:module'

// // Import the package.json file to get the version number by using the createRequire function
// const require = createRequire(import.meta.url)
// const { schemajson } = require('../__generated__/schema.json')

export {sql};

const db = createConnectionPool({
    connectionString: 'postgres://postgres:connector@localhost:5432/identity',
    maxUses: 20,
    idleTimeoutMilliseconds: 30000,
    bigIntMode: "bigint"
});
export default db;

// You can list whatever tables you actually have here:
const { identity, local_asset_db } = tables<DatabaseSchema>({
  databaseSchema: schemajson,
});
export { identity, local_asset_db };