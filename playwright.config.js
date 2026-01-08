const { defineConfig } = require("@playwright/test");

const port = process.env.PLAYWRIGHT_PORT || 4173;
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const isRemote = !!process.env.BASE_URL;

module.exports = defineConfig({
  testDir: "./tests",
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  use: {
    baseURL,
    headless: true,
  },
  // Skip local server when testing against remote URL
  ...(isRemote ? {} : {
    webServer: {
      command: `python3 -m http.server ${port}`,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: !process.env.CI,
    },
  }),
});
