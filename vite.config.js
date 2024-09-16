import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      "wa-sqlite": resolve(__dirname, "./vendor/wa-sqlite"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      name: "wa-sqlite-idb-sync",
      fileName: "wa-sqlite-idb-sync",
    },
  },
});
