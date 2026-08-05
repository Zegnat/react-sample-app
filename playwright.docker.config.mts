import { defineConfig, devices } from "@playwright/test";

// Runs the e2e suite against a running static-web-server container (the exact
// image the Dockerfile produces) instead of a local `vite preview` — confirming
// the in-container `npm ci` + build and that SWS serves the result. The
// container lifecycle is handled by `scripts/e2e-docker.sh` (npm run
// test:e2e:docker), which builds it, waits for it, and tears it down.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:4173", trace: "on-first-retry" },
  projects: [{ name: "docker", use: { ...devices["Desktop Chrome"] } }],
});
