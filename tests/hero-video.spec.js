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
    await page.goto("/", { waitUntil: "commit" });

    await page.waitForSelector("[data-hero-video]", { state: "attached" });

    const contract = await page.evaluate(() => {
      const element = document.querySelector("[data-hero-video]");

      return {
        autoplay: element.hasAttribute("autoplay"),
        mutedAttr: element.hasAttribute("muted"),
        loop: element.hasAttribute("loop"),
        playsinlineAttr: element.hasAttribute("playsinline"),
        webkitPlaysinlineAttr: element.hasAttribute("webkit-playsinline"),
        preload: element.getAttribute("preload"),
        initialSrc: element.getAttribute("src"),
        mobileSrc: element.dataset.srcMobile,
        desktopSrc: element.dataset.srcDesktop,
        sourceCount: element.querySelectorAll("source").length,
        muted: element.muted,
        playsInline: element.playsInline,
      };
    });

    expect(contract).toMatchObject({
      autoplay: true,
      mutedAttr: true,
      loop: true,
      playsinlineAttr: true,
      webkitPlaysinlineAttr: true,
      preload: "auto",
      initialSrc: "hero_v10_mobile.mp4",
      mobileSrc: "hero_v10_mobile.mp4",
      desktopSrc: "hero_v10_pc.mp4",
      sourceCount: 0,
      muted: true,
      playsInline: true,
    });

    await page.waitForFunction(
      () => performance.getEntriesByType("navigation")[0]?.domContentLoadedEventStart > 0,
    );

    const startupTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const mark = performance.getEntriesByName("hero-video-armed")[0];

      return {
        armedState: document.documentElement.dataset.heroVideoArmed,
        armedAt: mark?.startTime ?? null,
        domContentLoadedAt: navigation?.domContentLoadedEventStart ?? null,
      };
    });

    expect(startupTiming.armedState).toBe("early");
    expect(startupTiming.armedAt).not.toBeNull();
    expect(startupTiming.domContentLoadedAt).not.toBeNull();
    expect(startupTiming.armedAt).toBeLessThan(startupTiming.domContentLoadedAt);

    await page.waitForFunction(() => {
      const heroVideo = document.querySelector("[data-hero-video]");
      return heroVideo?.currentSrc.endsWith("hero_v10_mobile.mp4");
    });

    await expect
      .poll(async () => page.evaluate(() => document.querySelector("[data-hero-video]")?.paused))
      .toBe(false);
    await expect
      .poll(async () => page.evaluate(() => document.querySelector("[data-hero-video]")?.currentTime ?? 0))
      .toBeGreaterThan(0.1);
  });
});
