# Identity
The identity bindings include all the modules needed for creating and managing a self sovereign identity. 
This results in having also the **iota-client** dependency, that is automatically included in the bindings itself. 

## Install the bindings
In order to use the identity framework we have to install the dependency using npm

```sh
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