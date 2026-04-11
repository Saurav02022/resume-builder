import "server-only";

import puppeteer from "puppeteer";

const LOG_PREFIX = "[render-resume-pdf-puppeteer]";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Prints the LaTeX source as a monospace PDF via headless Chromium.
 * This is not a full TeX engine — layout matches “source listing”. For print-quality LaTeX, use Overleaf + .tex download.
 */
export async function renderTexToPdfWithPuppeteer(tex: string): Promise<Buffer> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });
    const page = await browser.newPage();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: letter; margin: 0.55in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.38;
      color: #0a0a0a;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .wrap { max-width: 100%; }
  </style>
</head>
<body><div class="wrap">${escapeHtml(tex)}</div></body>
</html>`;

    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.45in",
        right: "0.45in",
        bottom: "0.45in",
        left: "0.45in",
      },
    });

    return Buffer.from(pdf);
  } catch (e) {
    console.error(
      LOG_PREFIX,
      "puppeteer failed",
      e instanceof Error ? e.message : e
    );
    throw e;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
