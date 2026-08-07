import { defineConfig, devices } from "@playwright/test";

// In CI each e2e leg starts exactly one server: the React leg (E2E_TARGET=react)
// runs against the Vite dev server; everything else runs against the production
// Preact preview. The production build uses a relative base, so preview serves at
// the root. Locally, both servers start so `npm run test:e2e` can hit each.
const ciWebServer =
  process.env["E2E_TARGET"] === "react"
    ? {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: false,
      }
    : {
        command: "npm run preview",
        url: "http://localhost:4173",
        reuseExistingServer: false,
      };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  // Each test runs in its own isolated browser context against a static SPA with no
  // shared server state, so the specs parallelize safely; 2 workers roughly halves
  // the suite on the CI runner, and retries: 2 still covers transient flakiness.
  workers: process.env["CI"] ? 2 : undefined,
  reporter: "html",
  expect: {
    timeout: 15_000,
  },
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "react",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5173" },
    },
    {
      name: "preact",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4173" },
    },
  ],
  webServer: process.env["CI"]
    ? [ciWebServer]
    : [
        {
          command: "npm run dev",
          url: "http://localhost:5173",
          reuseExistingServer: true,
        },
        {
          command: "npm run build && npm run preview",
          url: "http://localhost:4173",
          reuseExistingServer: true,
        },
      ],
});
