import { defineConfig, devices } from "@playwright/test";

const basePath = process.env["BASE_PATH"] ?? "";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
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
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:4173${basePath}`,
      },
    },
  ],
  webServer: process.env["CI"]
    ? [
        {
          command: "npm run preview",
          url: `http://localhost:4173${basePath}`,
          reuseExistingServer: false,
        },
      ]
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
