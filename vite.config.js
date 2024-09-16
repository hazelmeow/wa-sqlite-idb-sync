import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
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
