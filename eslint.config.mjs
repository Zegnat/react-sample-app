// @ts-check
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "dist/",
    "src/dist/",
    "analysis.ts",
    "*.config.*",
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat.recommended,
  { languageOptions: { parserOptions: { projectService: true } } },
);
