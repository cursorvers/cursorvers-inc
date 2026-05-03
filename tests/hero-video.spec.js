const { test, expect } = require("@playwright/test");

test.describe("Hero background video", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });

  test("keeps the iPhone autoplay contract and selects the mobile source", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const video = page.locator("[data-hero-video]");
    await expect(video).toHaveCount(1);

    const contract = await video.evaluate((element) => ({
      autoplay: element.hasAttribute("autoplay"),
      mutedAttr: element.hasAttribute("muted"),
      loop: element.hasAttribute("loop"),
      playsinlineAttr: element.hasAttribute("playsinline"),
      webkitPlaysinlineAttr: element.hasAttribute("webkit-playsinline"),
      preload: element.getAttribute("preload"),
      mobileSrc: element.dataset.srcMobile,
      desktopSrc: element.dataset.srcDesktop,
      sourceCount: element.querySelectorAll("source").length,
      muted: element.muted,
      playsInline: element.playsInline,
    }));

    expect(contract).toMatchObject({
      autoplay: true,
      mutedAttr: true,
      loop: true,
      playsinlineAttr: true,
      webkitPlaysinlineAttr: true,
      preload: "metadata",
      mobileSrc: "hero_v9_mobile.mp4",
      desktopSrc: "hero_v9_pc.mp4",
      sourceCount: 0,
      muted: true,
      playsInline: true,
    });

    await page.waitForFunction(() => {
      const heroVideo = document.querySelector("[data-hero-video]");
      return heroVideo?.currentSrc.endsWith("hero_v9_mobile.mp4");
    });

    await expect.poll(async () => video.evaluate((element) => element.paused)).toBe(false);
    await expect.poll(async () => video.evaluate((element) => element.currentTime)).toBeGreaterThan(0.1);
  });
});
