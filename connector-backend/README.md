# Connector backend
Temporary solution for storing identity related information of the connector (aka Data Provier). Information include:

1. DID

2. Key Pair

3. Mnemonic

4. iota-wallet address

This is necessary due to old bindings of stronhold. 

## Starting the postgres DB

- Prerequisites: docker, docker compose

The PostgresDB is containerized and can be quickly executed by running the following command:
```sh
cd connector-backend
docker compose up -d
```

## Running the Application

Before running the application, this operations must be executed:

```sh
cd connector-backend

# install the necessary dependencies
npm install

# generate the schema to enable non-native ORM in typescript
# User and password are defined in the docker compose, while the table name is defined in the initialization script
# located in connector-backend/src/migrations/dbinit.sql
npx @databases/pg-schema-cli --database postgres://user:pswd@localhost:5432/table-name --directory src/__generated__
```

At this stage, everything should be ready, and the application can be executed:
```sh
# For more "debug"
npm run dev

# No logging features (like nodemon)
npm start
```
