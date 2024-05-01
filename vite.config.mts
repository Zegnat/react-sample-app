import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  esbuild: {
    jsxInject: `import React from 'react'`,
    tsconfigRaw: "{}"
  }
});
