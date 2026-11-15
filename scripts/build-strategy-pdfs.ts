/**
 * npm run docs:pdf
 * Renders docs/strategy/*.html to public/documents/*.pdf (served at /documents/<name>.pdf).
 * The HTML sources are the editable versions; regenerate the PDFs after editing them.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const SRC = path.join(process.cwd(), "docs", "strategy");
const OUT = path.join(process.cwd(), "public", "documents");

async function main() {
  const files = (await readdir(SRC)).filter((f) => f.endsWith(".html"));
  const browser = await chromium.launch();
  try {
    for (const file of files) {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(path.join(SRC, file)).href, { waitUntil: "load" });
      const title = await page.title();
      const out = path.join(OUT, file.replace(/\.html$/, ".pdf"));
      await page.pdf({
        path: out,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#6a7390;padding:0 17mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif"><span>${title} · Mahesh Pedapati · 16 November 2026</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
        tagged: true,
        outline: true,
      });
      await page.close();
      console.log(`✓ ${path.relative(process.cwd(), out)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
