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
  // shared server state, so the specs parallelize safely. The CI runner is 2-vCPU,
  // so 2 workers is the sweet spot (~16-22% faster than 1); measured 4 workers
  // oversubscribe and regress (16.0s vs 14.1s at 2). retries: 2 covers flakiness.
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
