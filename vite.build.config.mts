import { preact } from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  plugins: [preact()],
  resolve: {
    alias: { react: "@preact/compat", "react-dom": "@preact/compat" },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
