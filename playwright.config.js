const { defineConfig } = require("@playwright/test");

const port = process.env.PLAYWRIGHT_PORT || 4173;

module.exports = defineConfig({
  testDir: "./tests",
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
  },
  webServer: {
    command: `python3 -m http.server ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
