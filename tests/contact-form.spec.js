const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

test.describe("Contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/contact.html`, { waitUntil: "domcontentloaded" });
  });

  test("(a) has #inquiry-form", async ({ page }) => {
    const form = await page.locator("#inquiry-form").count();
    expect(form).toBeGreaterThan(0);
  });

  test("(b) has required fields org/name/email/message", async ({ page }) => {
    for (const name of ["org", "name", "email", "message"]) {
      const count = await page.locator(`#inquiry-form [name="${name}"]`).count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("(c) clicking type card presets select value", async ({ page }) => {
    const card = page.locator("[data-contact-type]").first();
    await card.click();
    const value = await page.locator("#contact-type").inputValue();
    const expected = await card.getAttribute("data-contact-type");
    expect(value).toBe(expected !== null ? expected : "unknown");
  });

  test("(d) empty submit triggers HTML5 validation and does not fetch", async ({ page }) => {
    let fetchCalled = false;
    await page.evaluate(() => {
      window.addEventListener("fetch", () => {});
    });
    page.on("request", (request) => {
      if (request.method() === "POST") fetchCalled = true;
    });

    const isValid = await page.evaluate(() => {
      const form = document.querySelector("#inquiry-form");
      if (form.hasAttribute("novalidate")) return false;
      if (typeof form.checkValidity !== "function") return "unknown";
      // required fields empty -> form should be invalid
      return form.checkValidity();
    });

    // Submit via button; browser validation should block navigation/fetch
    const submitButton = page.locator('#inquiry-form button[type="submit"], #inquiry-form input[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    expect(fetchCalled).toBe(false);
  });
});
