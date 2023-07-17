import createConnectionPool, {sql} from '@databases/pg';
import tables from '@databases/pg-typed';
import DatabaseSchema from '../__generated__';
import schemajson from '../__generated__/schema.json'

export {sql};

const db = createConnectionPool({
    connectionString: 'postgres://postgres:connector@localhost:5432/identity',
    maxUses: 20,
    idleTimeoutMilliseconds: 30000,
    bigIntMode: "bigint"
});
export default db;

// You can list whatever tables you actually have here:
const {identity} = tables<DatabaseSchema>({
  databaseSchema: schemajson,
});
export {identity};