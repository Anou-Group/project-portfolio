import { expect, test } from "@playwright/test";
import { lintText } from "../src/domain/language";
import { expected } from "./expected";

/** Every page at 390 / 900 / 1440 px: no sideways scroll, no console errors, no prohibited report language. */
const WIDTHS = [390, 900, 1440];

test("all pages fit every width, log no errors and contain no prohibited language", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once; sets its own widths");
  test.setTimeout(240_000);
  const e = await expected();
  const paths = ["/", "/activity", "/resources", "/about", ...e.projects.map((p) => `/projects/${p.slug}`), "/?q=shopify", "/activity?category=development"];
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${page.url()}: ${err.message}`));

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto(path, { waitUntil: "load" });
      // Streamed sections replace their loading skeletons when they arrive.
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px scrolls sideways`).toBeLessThanOrEqual(0);
      if (width === 1440) {
        const text = await page.locator("body").innerText();
        const prohibited = lintText(text).filter((f) => f.severity === "error");
        expect(prohibited, `${path} contains prohibited report language`).toEqual([]);
      }
    }
  }
  expect(errors).toEqual([]);
});
