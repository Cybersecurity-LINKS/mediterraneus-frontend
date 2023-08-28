# Connector Implementation for the Mediterraneus Protocol

## IOTA Identity Framework 
The identity bindings include all the modules needed for creating and managing a self sovereign identity. 
This results in having also the **iota-client** dependency, that is automatically included in the bindings itself. 

### Install the bindings
In order to use the identity framework we have to install the dependency using npm

```sh
cd connector
npm i @iota/identity-wasm@0.7.0-alpha.5
```
To use this in a web application we have enable the library. The loads the WASM file with an HTTP GET request, so the .wasm file must be copied to the root of the dist folder.

1. Install rollup-plugin-copy:

```sh
npm install rollup-plugin-copy --save-dev
```

2. Add the copy plugin usage to the plugins array under vite.config.ts:
```ts
plugins: [react(),tsconfigPaths(),
    // Add the copy plugin to the `plugins` array of your rollup config:
    copy({
      targets: [
        {
          src: "node_modules/@iota/client-wasm/web/wasm/client_wasm_bg.wasm",
          dest: "public",
          rename: "client_wasm_bg.wasm",
        },
        {
          src: "node_modules/@iota/identity-wasm/web/identity_wasm_bg.wasm",
          dest: "public",
          rename: "identity_wasm_bg.wasm",
        },
      ],
    })
  ],
  ...
```

The .wasm files will be downloaded and stored in the /public folder. 

3. At this stage, the identity and the client .wasm files have to be loaded:
```ts
import * as client from "@iota/client-wasm/web";
import * as identity from "@iota/identity-wasm/web";

// Calling identity.init().then(<callback>) or await identity.init() is required to load the Wasm file from the server if not available, 
// because of that it will only be slow for the first time.
client
  .init("client_wasm_bg.wasm")
  .then(() => identity.init("identity_wasm_bg.wasm"));
```

## Connector backend
Temporary solution for storing identity related information of the connector (aka Data Provier). Information include:

1. DID

2. Key Pair

3. Mnemonic

4. iota-wallet address

This is necessary due to old bindings of stronhold. 

### Starting the postgres DB

- Prerequisites: docker, docker compose

The PostgresDB is containerized and can be quickly executed by running the following command:
```sh
cd connector-backend
docker compose up -d
```

### Running the backend Application

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

## TODO

Smart Contracts should be moved in a separate repository. Additional information on how to deploy new smart contracts are in the dedicated folder in this repo.