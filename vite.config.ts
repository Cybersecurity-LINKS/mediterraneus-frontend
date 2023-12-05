import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
// Include the copy plugin
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(),
    // Add the copy plugin to the `plugins` array of your rollup config:
    copy({
      targets: [
        {
          src: "node_modules/@iota/sdk-wasm/web/wasm/iota_sdk_wasm_bg.wasm",
          dest: "public",
          rename: "iota_sdk_wasm_bg.wasm",
        },
        {
          src: "node_modules/@iota/identity-wasm/web/identity_wasm_bg.wasm",
          dest: "public",
          rename: "identity_wasm_bg.wasm",
        },
      ],
    })
  ],
  server: {
    port: 5174
  }
})
