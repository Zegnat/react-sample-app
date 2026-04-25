import { resolve } from "node:path";
import { preact } from "@preact/preset-vite";
import license from "rollup-plugin-license";
import { defineConfig } from "vite";

const base = process.env["BASE_PATH"] ? { base: process.env["BASE_PATH"] } : {};
const commit = process.env["COMMIT_HASH"] ?? "<unknown>";

export default defineConfig({
  root: "./src",
  ...base,
  plugins: [preact()],
  // Inspired by https://www.reddit.com/r/reactjs/comments/10o661t/comment/j6i7rzv/
  resolve: {
    alias: { react: "@preact/compat", "react-dom": "@preact/compat" },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: resolve(__dirname, "dist", "LICENSES.txt"),
            includeSelf: true,
            allow: {
              test: "(MIT OR BSD-3-Clause OR 0BSD)",
              failOnUnlicensed: true,
              failOnViolation: true,
            },
          },
        }),
      ],
    },
  },
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commit),
  },
});
