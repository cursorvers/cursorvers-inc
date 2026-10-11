/**
 * Hero (白地に黒文字、背景は波の動画) 構造への整流 section
 *
 * locator 回避について:
 *   PWA start_url の pending navigation 中に page.locator の auto-wait が
 *   固まるため、本ファイルでは page.goto / page.waitForFunction /
 *   page.evaluate / expect.poll / page.route / page.emulateMedia のみを使用する。
 *   クリックは page.evaluate(() => el.click()) で行う。
 *
 * 経緯:
 *   2026-10-08 に V5 から白黒の 3D 医療街区ヒーローへ刷新した。
 *   2026-10-11 に背景を 3D から波の動画 (自サイトの hero_v12_*.mp4。2026-10-11 に原本から 1920×1080 / 960×540 で作り直した) に替えた。3D は cursorvers.jp へ移した。
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
        heroFxExists: Boolean(document.querySelector("canvas#heroFx")),
        heroVideoInHero: Boolean(document.querySelector("#main .hero-video-container video.hero-video")),
        heroVideoSourceCount: document.querySelectorAll("#main video.hero-video source").length,
        heroVideoAttrs: (() => {
          const v = document.querySelector("#main video.hero-video");
          return v
            ? {
                src: v.getAttribute("src"),
                mobile: v.getAttribute("data-src-mobile"),
                desktop: v.getAttribute("data-src-desktop"),
                preload: v.getAttribute("preload"),
              }
            : null;
        })(),
      };
    });

    expect(contract).toMatchObject({
      heroExists: true,
      videoCount: 1,
      h1Text: "AIに、臨床の魂を",
      subText: "医療機関・社会福祉法人のAI導入を、臨床経験のある医師が設計し、職員に定着するまで伴走します。",
      primaryHref: "contact.html",
      linkHref: "#paths",
      linkText: "サービスを見る",
      pathsAnchorExists: true,
      heroFxExists: false,
      heroVideoInHero: true,
    });

    // 動画は自サイトに置き、<source> を使わず src を直接持つ (AGENTS.md R1・R6、CSP の media-src 'self')
    expect(contract.heroVideoSourceCount).toBe(0);
    expect(contract.heroVideoAttrs).toEqual({
      src: "hero_v12_mobile.mp4",
      mobile: "hero_v12_mobile.mp4",
      desktop: "hero_v12_pc.mp4",
      preload: "auto",
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

  test("video plays the mobile source and shows the pause button", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => {
      const v = document.querySelector("#main video.hero-video");
      return v && v.currentSrc && !v.paused;
    }, null, { timeout: 15000 });

    const state = await page.evaluate(() => {
      const v = document.querySelector("#main video.hero-video");
      const btn = document.querySelector("#heroPause");
      return {
        currentSrc: v.currentSrc,
        muted: v.muted,
        pauseHidden: btn ? btn.hidden : null,
        pressed: btn ? btn.getAttribute("aria-pressed") : null,
      };
    });
    expect(state.currentSrc.endsWith("/hero_v12_mobile.mp4")).toBe(true);
    expect(state.muted).toBe(true);
    expect(state.pauseHidden).toBe(false);
    expect(state.pressed).toBe("false");
  });

  test("pause button stops motion (WCAG 2.2.2)", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => {
      const v = document.querySelector("#main video.hero-video");
      return v && !v.paused && v.currentTime > 0.3;
    }, null, { timeout: 15000 });

    await page.evaluate(() => document.querySelector("#heroPause").click());
    expect(await page.evaluate(() => document.querySelector("#heroPause").getAttribute("aria-pressed"))).toBe("true");
    expect(await page.evaluate(() => document.querySelector("#main video.hero-video").paused)).toBe(true);

    const t1 = await page.evaluate(() => document.querySelector("#main video.hero-video").currentTime);
    await page.waitForTimeout(1000);
    const t2 = await page.evaluate(() => document.querySelector("#main video.hero-video").currentTime);
    expect(t2).toBe(t1);

    await page.evaluate(() => document.querySelector("#heroPause").click());
    expect(await page.evaluate(() => document.querySelector("#heroPause").getAttribute("aria-pressed"))).toBe("false");
    await page.waitForFunction((t) => document.querySelector("#main video.hero-video").currentTime > t, t2, { timeout: 5000 });
  });

  test("reduced-motion keeps the video still and offers Play", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => document.readyState !== "loading");
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      const v = document.querySelector("#main video.hero-video");
      const btn = document.querySelector("#heroPause");
      return {
        paused: v.paused,
        currentTime: v.currentTime,
        pauseHidden: btn.hidden,
        pressed: btn.getAttribute("aria-pressed"),
        label: btn.textContent.trim(),
      };
    });
    expect(state.paused).toBe(true);
    // autoplay 属性で動き出す前に script が止めるため、進んでもごくわずか
    expect(state.currentTime).toBeLessThan(0.5);
    expect(state.pauseHidden).toBe(false);
    expect(state.pressed).toBe("true");
    expect(state.label).toBe("Play");
  });

  test("hero stays operable when the video fails to load", async ({ page }) => {
    await page.route("**/*.mp4", (route) => route.abort());
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

      // 停止手段 (JS のボタン) が無いので、動画は出さず静止画にする (WCAG 2.2.2)
      const videoDisplay = await page.evaluate(() => getComputedStyle(document.querySelector("#main video.hero-video")).display);
      expect(videoDisplay).toBe("none");
    });
  });
});
