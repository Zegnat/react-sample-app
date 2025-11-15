import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify("<unknown>"),
  },
});
