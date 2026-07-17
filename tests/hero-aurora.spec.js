const { test, expect } = require("@playwright/test");

// NOTE: This spec intentionally avoids `page.locator(...)` and locator-based
// `expect(...)` assertions. index.html triggers a pending PWA start_url
// navigation check on load that never resolves under a basic HTTP server,
// which causes Playwright's locator auto-waiting to time out. We rely strictly
// on `page.goto`, `page.waitForFunction`, `page.evaluate`, and `expect.poll`.

test.describe("Hero aurora section", () => {
  // Block service workers so headless Chromium does not wedge on SW registration under a static server.
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });

  test("keeps the hero copy, renders the aurora canvas, and wires the badge CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });

    await page.waitForFunction(() => document.documentElement.dataset.auroraArmed === "live");

    const contract = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const h1 = q("#main h1");
      const canvas = q("#auroraFx");
      const badge = q("#main .au-badge");

      return {
        videoCount: document.querySelectorAll("video, [data-hero-video]").length,
        heroExists: !!q("section#main.aurora-hero"),
        ariaLabel: h1 ? h1.getAttribute("aria-label") : null,
        mainText: q("#main .au-main") ? q("#main .au-main").textContent.trim() : null,
        subText: q("#main .au-sub") ? q("#main .au-sub").textContent.trim() : null,
        brandText: q("#main .au-brand") ? q("#main .au-brand").textContent.trim() : null,
        badgeHref: badge ? badge.getAttribute("href") : null,
        badgeText: badge ? badge.textContent.trim() : null,
        chCount: document.querySelectorAll("#main .au-main .au-ch").length,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
      };
    });

    expect(contract).toMatchObject({
      videoCount: 0,
      heroExists: true,
      ariaLabel: "AIに、臨床の魂を 医療AIを、現場に届く言葉へ",
      mainText: "AIに、臨床の魂を",
      subText: "医療AIを、現場に届く言葉へ",
      brandText: "CURSORVERS",
      badgeHref: "contact.html",
      badgeText: "医療AIの第三者レビュー",
      chCount: 9,
    });

    expect(contract.canvasWidth).toBeGreaterThan(0);
    expect(contract.canvasHeight).toBeGreaterThan(0);

    await expect.poll(
      () => page.evaluate(() => document.querySelectorAll("#main .au-main .au-ch.lit").length),
      { timeout: 8000 }
    ).toBe(9);

    await expect.poll(
      () => page.evaluate(() => !!document.querySelector("#main .au-badge") && document.querySelector("#main .au-badge").classList.contains("in")),
      { timeout: 8000 }
    ).toBe(true);
  });

  test("?static=1 renders the representative aurora frame synchronously", async ({ page }) => {
    await page.goto("/?static=1", { waitUntil: "commit" });

    await page.waitForFunction(() => document.documentElement.dataset.auroraArmed === "static");

    const hasAuFxClass = await page.evaluate(() => {
      return document.documentElement.classList.contains("au-fx");
    });
    expect(hasAuFxClass).toBe(false);

    const maxGreen = await page.evaluate(() => {
      const canvas = document.getElementById("auroraFx");
      const ctx = canvas.getContext("2d");
      const y = Math.round(canvas.height * 0.3);
      const imageData = ctx.getImageData(0, y, canvas.width, 1);
      let max = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const g = imageData.data[i + 1];
        if (g > max) {
          max = g;
        }
      }
      return max;
    });
    
    expect(maxGreen).toBeGreaterThan(60);
  });
});
