import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { preact } from "@preact/preset-vite";
import license from "rollup-plugin-license";
import { defineConfig } from "vite";

const base = process.env["BASE_PATH"] ? { base: process.env["BASE_PATH"] } : {};
const commit = process.env["COMMIT_HASH"] ?? "<unknown>";

// Emit a CycloneDX SBOM from the packages rollup-plugin-license actually sees in
// the bundle, so it reflects what ships (Preact, MUI, Emotion, …) rather than
// the npm dependency tree — which lists the aliased-out React and build-only
// tooling and hides the Preact that is actually bundled.
function cycloneDXSbom(dependencies) {
  return JSON.stringify(
    {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      serialNumber: `urn:uuid:${randomUUID()}`,
      version: 1,
      components: dependencies.map((dependency) => ({
        type: "library",
        name: dependency.name,
        version: dependency.version,
        purl: `pkg:npm/${dependency.name.replace("@", "%40")}@${dependency.version}`,
        ...(dependency.license
          ? { licenses: [{ license: { name: dependency.license } }] }
          : {}),
      })),
    },
    null,
    2,
  );
}

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
            includeSelf: true,
            allow: {
              test: "(MIT OR BSD-3-Clause OR 0BSD)",
              failOnUnlicensed: true,
              failOnViolation: true,
            },
            output: [
              resolve(__dirname, "dist", "LICENSES.txt"),
              {
                file: resolve(__dirname, "sbom.cdx.json"),
                template: cycloneDXSbom,
              },
            ],
          },
        }),
      ],
    },
  },
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commit),
  },
});
