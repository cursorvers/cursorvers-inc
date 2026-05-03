const fs = require("fs");
const { execSync } = require("child_process");
const { test, expect } = require("@playwright/test");

const resolveBuildId = () => {
  if (process.env.BUILD_ID) {
    return process.env.BUILD_ID;
  }

  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (error) {
    return null;
  }
};

const expectedBuildId = resolveBuildId();
const htmlFiles = fs.readdirSync(process.cwd()).filter((file) => file.endsWith(".html"));

test.describe("Build ID", () => {
  for (const file of htmlFiles) {
    test(`renders build id on ${file}`, async ({ page }) => {
      await page.goto(`/${file}`, { waitUntil: "domcontentloaded" });

      const buildIdLocator = page.locator("span[data-build-id]");
      const buildIdCount = await buildIdLocator.count();
      expect(buildIdCount).toBeGreaterThan(0);

      const buildIdTexts = await buildIdLocator.allTextContents();
      for (const text of buildIdTexts) {
        const trimmed = text.trim();
        if (expectedBuildId) {
          expect(trimmed).toBe(expectedBuildId);
        } else {
          expect(trimmed).not.toBe("");
          expect(trimmed).not.toBe("dev");
        }
      }
    });
  }
});
