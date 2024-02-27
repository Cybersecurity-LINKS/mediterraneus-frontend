# Marketplace frontend for the Mediterraneus Protocol

![Iota](https://img.shields.io/badge/iota-29334C?style=for-the-badge&logo=iota&logoColor=white)

# Running the Application

To run the frontend application, follow these steps:

1. Install the dependencies by running `npm install`.

2. Copy the `.env.example` file and rename it to `.env`. Make any necessary modifications to the `.env` file.

3. Copy both the `addresses` and `artifact` folders from the [`mediterraneus-smart-contracts`](https://github.com/Cybersecurity-LINKS/mediterraneus-smart-contracts) repository (these folders are obtained after deploying the smart contracts) into the `src` folder of the frontend application.

4. Finally, execute the application by running `npm run dev`.

## IOTA Identity Framework 
The identity bindings include all the modules needed for creating and managing a Self-Sovereign Identity. 
This results in having also the **iota-client** dependency, that is automatically included in the bindings itself.

### Install the bindings
In order to use the identity framework we have to install the dependency using npm

```sh
npm install @iota/identity-wasm 
```
To use this in a web application we have enable the library. The loads the WASM file with an HTTP GET request, so the .wasm file must be copied to the root of the dist folder.

1. Install rollup-plugin-copy:

```sh
npm install rollup-plugin-copy --save-dev
```

2. Add the copy plugin usage to the plugins array under vite.config.ts:
```ts
plugins: [react(), tsconfigPaths(),
    // Add the copy plugin to the `plugins` array of your rollup config:
    copy({
      targets: [
        {
          src: "node_modules/@iota/sdk-wasm/web/wasm/iota_sdk_wasm_bg.wasm",
          dest: "public/libraries",
          rename: "iota_sdk_wasm_bg.wasm",
        },
        {
          src: "node_modules/@iota/identity-wasm/web/identity_wasm_bg.wasm",
          dest: "public/libraries",
          rename: "identity_wasm_bg.wasm",
        },
      ],
    })
  ],
  ...
```

The .wasm files will be downloaded and stored in the /public/libraries folder. 

3. At this stage, the identity and the sdk .wasm files have to be loaded:
```ts
import init from "@iota/sdk-wasm/web";
import * as identity from "@iota/identity-wasm/web";

// Calling identity.init().then(<callback>) or await identity.init() is required to load the Wasm file from the server if not available, 
// because of that it will only be slow for the first time.

init("sdk_wasm_bg.wasm") // fix with the right path
.then(() => identity.init("identity_wasm_bg.wasm")); // fix with the right path
```

## License

[GPL-3.0-or-later](https://spdx.org/licenses/GPL-3.0-or-later.html)