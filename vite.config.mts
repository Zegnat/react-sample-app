import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
    tsconfigRaw: "{}"
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: "{}"
    }
  },
});
