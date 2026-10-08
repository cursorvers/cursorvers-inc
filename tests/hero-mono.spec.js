/**
 * Hero (白黒 3D 医療街区ヒーロー) 構造への整流 section
 *
 * locator 回避について:
 *   PWA start_url の pending navigation 中に page.locator の auto-wait が
 *   固まるため、本ファイルでは page.goto / page.waitForFunction /
 *   page.evaluate / expect.poll / page.route / page.emulateMedia のみを使用する。
 *   クリックは page.evaluate(() => el.click()) で行う。
 *
 * 経緯:
 *   2026-10-08 に V5 から白黒の 3D 医療街区ヒーローへ刷新した。
 */
const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: "block",
});

test.describe("Hero (hero-mono) 構造への整流 section", () => {
  test("keeps the hero copy and wires both CTAs", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => document.readyState !== "loading");

    const contract = await page.evaluate(() => {
      const main = document.querySelector("section#main.hero-mono");
      const primary = main ? main.querySelector(".hero-mono__primary") : null;
      const link = main ? main.querySelector(".hero-mono__link") : null;
      return {
        heroExists: Boolean(main),
        videoCount: document.querySelectorAll("video, [data-hero-video]").length,
        h1Text: (document.querySelector("#main h1") || { textContent: "" }).textContent.trim(),
        subText: (document.querySelector("#main .hero-mono__sub") || { textContent: "" }).textContent.trim(),
        primaryHref: primary ? primary.getAttribute("href") : null,
        primaryText: primary ? primary.textContent.trim() : null,
        linkHref: link ? link.getAttribute("href") : null,
        linkText: link ? link.textContent.trim() : null,
        pathsAnchorExists: Boolean(document.querySelector("section#paths")),
        bandExists: Boolean(document.querySelector(".au-band")),
        heroFxExists: Boolean(document.querySelector("canvas#heroFx")),
      };
    });

    expect(contract).toMatchObject({
      heroExists: true,
      videoCount: 0,
      h1Text: "AIに、臨床の魂を。",
      subText: "医療機関・社会福祉法人のAI導入を、臨床経験のある医師が設計し、職員に定着するまで伴走します。",
      primaryHref: "contact.html",
      linkHref: "#paths",
      linkText: "サービスを見る",
      pathsAnchorExists: true,
      bandExists: true,
      heroFxExists: true,
    });

    expect(contract.primaryText.startsWith("無料壁打ちを予約（30分）")).toBe(true);
  });

  test("header is visible and operable from the start", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => document.readyState !== "loading");

    const state = await page.evaluate(() => {
      const header = document.querySelector("header.glass-nav");
      const cs = header ? getComputedStyle(header) : null;
      return {
        headerExists: Boolean(header),
        hasRevealClass: header ? header.classList.contains("hero-nav-reveal") : null,
        opacity: cs ? cs.opacity : null,
        visibility: cs ? cs.visibility : null,
        pointerEvents: cs ? cs.pointerEvents : null,
        menuToggleExists: Boolean(document.querySelector("[data-mobile-menu-open]")),
      };
    });

    expect(state.headerExists).toBe(true);
    expect(state.hasRevealClass).toBe(false);
    expect(state.opacity).toBe("1");
    expect(state.visibility).toBe("visible");
    expect(state.pointerEvents).not.toBe("none");
    expect(state.menuToggleExists).toBe(true);
  });

  test("3D boots (or degrades gracefully without WebGL)", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });

    await page.waitForFunction(
      () => document.documentElement.dataset.hero3d === "on" || document.documentElement.dataset.hero3d === "off",
      { timeout: 15000 }
    );

    const hero3d = await page.evaluate(() => document.documentElement.dataset.hero3d);

    if (hero3d === "on") {
      const state = await page.evaluate(() => {
        const fx = document.querySelector("#heroFx");
        return {
          status: fx ? fx.dataset.status : null,
          calls: fx ? Number(fx.dataset.calls) : null,
          pauseHidden: document.querySelector("#heroPause") ? document.querySelector("#heroPause").hidden : null,
        };
      });
      expect(state.status).toBe("ready");
      expect(state.calls).toBeLessThanOrEqual(12);
      expect(state.pauseHidden).toBe(false);
    } else {
      const visible = await page.evaluate(() => {
        const h1 = document.querySelector("#main h1");
        const primary = document.querySelector("#main .hero-mono__primary");
        const r1 = h1 ? h1.getBoundingClientRect() : null;
        const r2 = primary ? primary.getBoundingClientRect() : null;
        return {
          h1Visible: Boolean(r1 && r1.width > 0 && r1.height > 0),
          primaryVisible: Boolean(r2 && r2.width > 0 && r2.height > 0),
        };
      });
      expect(visible.h1Visible).toBe(true);
      expect(visible.primaryVisible).toBe(true);
    }
  });

  test("pause button stops motion (WCAG 2.2.2)", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });

    await page.waitForFunction(
      () => document.documentElement.dataset.hero3d === "on" || document.documentElement.dataset.hero3d === "off",
      { timeout: 15000 }
    );

    const hero3d = await page.evaluate(() => document.documentElement.dataset.hero3d);
    test.skip(hero3d !== "on", "hero3d is off in this environment");

    await page.waitForFunction(() => parseFloat(document.querySelector("#heroFx").dataset.t) > 0.5, null, { timeout: 15000 });

    await page.evaluate(() => document.querySelector("#heroPause").click());
    expect(await page.evaluate(() => document.querySelector("#heroPause").getAttribute("aria-pressed"))).toBe("true");

    const t1 = await page.evaluate(() => document.querySelector("#heroFx").dataset.t);
    await page.waitForTimeout(1000);
    const t2 = await page.evaluate(() => document.querySelector("#heroFx").dataset.t);
    expect(t2).toBe(t1);

    await page.evaluate(() => document.querySelector("#heroPause").click());
    expect(await page.evaluate(() => document.querySelector("#heroPause").getAttribute("aria-pressed"))).toBe("false");

    const t3 = await page.evaluate(() => document.querySelector("#heroFx").dataset.t);
    await page.waitForTimeout(1000);
    const t4 = await page.evaluate(() => document.querySelector("#heroFx").dataset.t);
    expect(parseFloat(t4)).toBeGreaterThan(parseFloat(t3));
  });

  test("reduced-motion hides the pause button and freezes time", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });

    await page.waitForFunction(
      () => document.documentElement.dataset.hero3d === "on" || document.documentElement.dataset.hero3d === "off",
      { timeout: 15000 }
    );

    const hero3d = await page.evaluate(() => document.documentElement.dataset.hero3d);
    test.skip(hero3d !== "on", "hero3d is off in this environment");

    const state = await page.evaluate(() => ({
      pauseHidden: document.querySelector("#heroPause").hidden,
      t: document.querySelector("#heroFx").dataset.t,
    }));
    expect(state.pauseHidden).toBe(true);

    await page.waitForTimeout(5500);
    const t2 = await page.evaluate(() => document.querySelector("#heroFx").dataset.t);
    expect(t2).toBe(state.t);
  });

  test("hero stays operable when the 3D module fails to load", async ({ page }) => {
    await page.route("**/assets/hero3d/hero3d.min.js", (route) => route.abort());
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForTimeout(2000);

    const state = await page.evaluate(() => {
      const h1 = document.querySelector("#main h1");
      const primary = document.querySelector("#main .hero-mono__primary");
      const header = document.querySelector("header.glass-nav");
      const skip = document.querySelector("a.skip-link");
      return {
        h1: h1 ? h1.getBoundingClientRect() : null,
        h1Style: h1 ? getComputedStyle(h1) : null,
        primary: primary ? primary.getBoundingClientRect() : null,
        primaryStyle: primary ? getComputedStyle(primary) : null,
        headerOpacity: header ? getComputedStyle(header).opacity : null,
        skipHref: skip ? skip.getAttribute("href") : null,
      };
    });

    expect(state.h1.width).toBeGreaterThan(0);
    expect(state.h1.height).toBeGreaterThan(0);
    expect(state.h1Style.visibility).toBe("visible");
    expect(state.h1Style.opacity).not.toBe("0");

    expect(state.primary.width).toBeGreaterThan(0);
    expect(state.primary.height).toBeGreaterThan(0);
    expect(state.primaryStyle.visibility).toBe("visible");
    expect(state.primaryStyle.opacity).not.toBe("0");

    expect(state.headerOpacity).toBe("1");
    expect(state.skipHref).toBe("#main");

    await page.evaluate(() => document.querySelector("#main .hero-mono__link").click());
    await page.waitForFunction(() => location.hash === "#paths");
    expect(await page.evaluate(() => location.hash)).toBe("#paths");
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("hero copy and primary CTA remain visible", async ({ page }) => {
      await page.goto("/", { waitUntil: "commit" });
      await page.waitForFunction(() => document.readyState !== "loading");

      const state = await page.evaluate(() => {
        const h1 = document.querySelector("#main h1");
        const primary = document.querySelector("#main .hero-mono__primary");
        const header = document.querySelector("header.glass-nav");
        return {
          h1: h1 ? h1.getBoundingClientRect() : null,
          h1Style: h1 ? getComputedStyle(h1) : null,
          primary: primary ? primary.getBoundingClientRect() : null,
          primaryStyle: primary ? getComputedStyle(primary) : null,
          headerOpacity: header ? getComputedStyle(header).opacity : null,
        };
      });

      expect(state.h1.width).toBeGreaterThan(0);
      expect(state.h1.height).toBeGreaterThan(0);
      expect(state.h1Style.visibility).toBe("visible");
      expect(state.h1Style.opacity).not.toBe("0");

      expect(state.primary.width).toBeGreaterThan(0);
      expect(state.primary.height).toBeGreaterThan(0);
      expect(state.primaryStyle.visibility).toBe("visible");
      expect(state.primaryStyle.opacity).not.toBe("0");

      expect(state.headerOpacity).toBe("1");
    });
  });
});
