/**
 * Hero V5 構造への整流 section
 *
 * locator 回避について:
 *   PWA start_url の pending navigation 中に page.locator の auto-wait が
 *   固まるため、本ファイルでは page.goto / page.waitForFunction /
 *   page.evaluate / expect.poll のみを使用する。
 *
 * 経緯:
 *   2026-08-23 に S3 aurora から V5 へ刷新し、旧 #intro 暗幕の data-intro
 *   契約を hero script が継承した。
 */
const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: "block",
});

test.describe("Hero V5 構造への整流 section", () => {
  test("keeps the hero copy, renders the particle canvas, and wires the consult CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.dataset.heroArmed === "live");

    const contract = await page.evaluate(() => {
      const main = document.querySelector("section#main.v5-hero");
      const primary = main ? main.querySelector(".v5-cta.v5-primary") : null;
      const ghost = main ? main.querySelector(".v5-cta.v5-ghost") : null;
      return {
        videoCount: document.querySelectorAll("video, [data-hero-video]").length,
        heroExists: Boolean(main),
        h1Text: (document.querySelector("#main h1") || { textContent: "" }).textContent.trim(),
        subText: (document.querySelector("#main .v5-sub") || { textContent: "" }).textContent.trim(),
        creedText: (document.querySelector("#main .v5-creed") || { textContent: "" }).textContent.trim(),
        brandText: (document.querySelector("#main .v5-brand") || { textContent: "" }).textContent.trim(),
        ctaHref: primary ? primary.getAttribute("href") : null,
        ctaText: primary ? primary.textContent.trim() : null,
        ghostHref: ghost ? ghost.getAttribute("href") : null,
        ghostText: ghost ? ghost.textContent.trim() : null,
        chipCount: document.querySelectorAll("#main .v5-chip").length,
        bandExists: Boolean(document.querySelector(".au-band")),
        pathsAnchorExists: Boolean(document.querySelector("section#paths")),
        introState: document.documentElement.dataset.intro,
        heroFxWidth: (document.querySelector("#heroFx") || { width: 0 }).width,
        heroFxHeight: (document.querySelector("#heroFx") || { height: 0 }).height,
      };
    });

    expect(contract).toMatchObject({
      videoCount: 0,
      heroExists: true,
      h1Text: "AIに、臨床の魂を。",
      subText: "医療機関・社会福祉法人のAI導入を、臨床経験のある医師が設計し、職員に定着するまで伴走します。",
      creedText: "使う側 — 責任を負う側の言葉で、AIを設計する。",
      brandText: "CURSORVERS",
      ctaHref: "contact.html",
      ctaText: "無料壁打ちを予約（30分）",
      ghostHref: "#paths",
      ghostText: "サービスを見る",
      chipCount: 3,
      bandExists: true,
      pathsAnchorExists: true,
    });

    expect(["pending", "done", "skipped"]).toContain(contract.introState);

    expect(contract.heroFxWidth).toBeGreaterThan(0);
    expect(contract.heroFxHeight).toBeGreaterThan(0);

    // 初回はマニフェスト約10.3秒再生後に着地するため timeout 15000 で待つ
    await expect
      .poll(
        async () =>
          await page.evaluate(() =>
            document.querySelector("#v5Stage").classList.contains("done")
          ),
        { timeout: 15000 }
      )
      .toBe(true);

    const introAfter = await page.evaluate(() => document.documentElement.dataset.intro);
    expect(["done", "skipped"]).toContain(introAfter);
  });

  test("?static=1 renders the representative settled frame synchronously", async ({ page }) => {
    await page.goto("/?static=1", { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.dataset.heroArmed === "static");

    const state = await page.evaluate(() => ({
      intro: document.documentElement.dataset.intro,
      stageDone: document.querySelector("#v5Stage").classList.contains("done"),
      lowerBandOpaquePixels: (() => {
        const canvas = document.querySelector("#heroFx");
        const ctx = canvas.getContext("2d");
        const y0 = Math.round(canvas.height * 0.9);
        const data = ctx.getImageData(0, y0, canvas.width, canvas.height - y0).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) count += 1;
        }
        return count;
      })(),
    }));

    expect(state.intro).toBe("skipped");
    expect(state.stageDone).toBe(true);
    expect(state.lowerBandOpaquePixels).toBeGreaterThan(50);
  });
});
