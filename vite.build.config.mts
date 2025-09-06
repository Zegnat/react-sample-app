import { preact } from "@preact/preset-vite";
import { defineConfig } from "vite";

const base = process.env["BASE_PATH"] ? { base: process.env["BASE_PATH"] } : {};

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
  },
});
