import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";

const baseUrl = process.env.BASE_URL || "https://cursorvers.com/";
const startupLimitMs = Number(process.env.HERO_VIDEO_STARTUP_LIMIT_MS || 5000);

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  const startedAt = Date.now();

  await page.goto(baseUrl, { waitUntil: "commit", timeout: 15000 });
  await page.waitForFunction(
    () => performance.getEntriesByType("navigation")[0]?.domContentLoadedEventStart > 0,
    { timeout: 10000 },
  );
  const domMs = Date.now() - startedAt;

  await page.waitForSelector("[data-hero-video]", { timeout: 10000 });
  const selectorMs = Date.now() - startedAt;

  await page.waitForFunction(
    () => {
      const video = document.querySelector("[data-hero-video]");
      return video && video.currentSrc.endsWith("hero_v9_mobile.mp4");
    },
    { timeout: 10000 },
  );
  const srcMs = Date.now() - startedAt;

  await page.waitForFunction(
    () => {
      const video = document.querySelector("[data-hero-video]");
      return video && !video.paused;
    },
    { timeout: 10000 },
  );
  const unpausedMs = Date.now() - startedAt;

  await page.waitForFunction(
    () => {
      const video = document.querySelector("[data-hero-video]");
      return video && video.currentTime > 0.1;
    },
    { timeout: 15000 },
  );
  const movingMs = Date.now() - startedAt;

  const detail = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const mark = performance.getEntriesByName("hero-video-armed")[0];
    const videoResource = performance
      .getEntriesByType("resource")
      .find((entry) => entry.name.includes("hero_v9_mobile.mp4"));
    const video = document.querySelector("[data-hero-video]");

    return {
      build: document.querySelector("[data-build-id]")?.textContent?.trim() || null,
      armedState: document.documentElement.dataset.heroVideoArmed || null,
      domContentLoadedAt: navigation?.domContentLoadedEventStart ?? null,
      armedAt: mark?.startTime ?? null,
      videoStart: videoResource?.startTime ?? null,
      videoResponseStart: videoResource?.responseStart ?? null,
      videoTransferSize: videoResource?.transferSize ?? null,
      currentSrc: video?.currentSrc || null,
      currentTime: video?.currentTime ?? null,
      paused: video?.paused ?? null,
      readyState: video?.readyState ?? null,
    };
  });

  const result = {
    url: baseUrl,
    limitMs: startupLimitMs,
    domMs,
    selectorMs,
    srcMs,
    unpausedMs,
    movingMs,
    ...detail,
  };

  console.log(JSON.stringify(result, null, 2));

  if (detail.armedState !== "early") {
    throw new Error(`hero video was not armed early: ${detail.armedState}`);
  }
  if (detail.armedAt === null || detail.domContentLoadedAt === null || detail.armedAt >= detail.domContentLoadedAt) {
    throw new Error("hero video startup script did not arm before DOMContentLoaded");
  }
  if (!detail.currentSrc?.endsWith("hero_v9_mobile.mp4")) {
    throw new Error(`unexpected hero video source: ${detail.currentSrc}`);
  }
  if (detail.paused) {
    throw new Error("hero video is still paused");
  }
  if (movingMs > startupLimitMs) {
    throw new Error(`hero video startup took ${movingMs}ms; limit is ${startupLimitMs}ms`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        "## Hero Video Startup Proof",
        "",
        `- URL: ${baseUrl}`,
        `- Build: ${detail.build || "unknown"}`,
        `- Startup to currentTime > 0.1s: ${movingMs}ms`,
        `- Limit: ${startupLimitMs}ms`,
        `- Armed before DOMContentLoaded: ${detail.armedAt?.toFixed?.(1)}ms < ${detail.domContentLoadedAt?.toFixed?.(1)}ms`,
        `- Current source: ${detail.currentSrc}`,
        `- Paused: ${detail.paused}`,
        `- Ready state: ${detail.readyState}`,
        "",
      ].join("\n"),
    );
  }
} finally {
  await browser.close();
}
