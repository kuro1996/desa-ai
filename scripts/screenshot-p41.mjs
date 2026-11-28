// Paket 41 — viewport screenshots (390px, light + dark) of the Beranda
// after removing 4 cards + the redesigned page-head header (close-up).
// Usage:
//   node scripts/screenshot-p41.mjs
// Before/after comparison (header redesign): build the old HEAD in a
// temp worktree, then run with env overrides:
//   DIST_DIR=/path/to/old/dist PREFIX=p41-sebelum node scripts/screenshot-p41.mjs
import puppeteer from "puppeteer-core";
import { createHash } from "node:crypto";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.DIST_DIR || join(ROOT, "dist");
const PREFIX = process.env.PREFIX || "p41";
const OUT = join(ROOT, "screenshots");
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = existsSync("/usr/bin/google-chrome")
  ? "/usr/bin/google-chrome"
  : "/opt/meta-chromium/chrome";
const IS_META_CHROMIUM = CHROME.includes("meta-chromium");

// Meta-chromium requires a WebGL allowlist file + its sha256 to run headless
// (same logic as scripts/headless-test.mjs).
function metaChromiumFlags() {
  if (!IS_META_CHROMIUM) return [];
  const policyFile = "/tmp/pol_c.txt";
  writeFileSync(policyFile, "hatch-webgl-all-origins-v1\n");
  const sha = createHash("sha256")
    .update("hatch-webgl-all-origins-v1\n")
    .digest("hex");
  return [
    `--hatch-webgl-allowed-domains-file=${policyFile}`,
    `--hatch-webgl-allowed-domains-sha256=${sha}`,
  ];
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    ...metaChromiumFlags(),
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto("file://" + join(DIST, "index.html"), { waitUntil: "load" });

// Demo login gate (Paket 36).
await page.waitForSelector("#login-user", { timeout: 30000 });
await page.type("#login-user", "demo");
await page.type("#login-pass", "demo123");
await page.click(".login-submit");
await page
  .waitForFunction(
    () =>
      document.querySelector('[data-i18n="setAccount"]')?.textContent ===
      "User account",
    { timeout: 120000 },
  )
  .catch(() => console.warn("boot wait timed out — shooting anyway"));
await sleep(500);

async function shootBeranda(suffix) {
  await page.click('[data-tab="home"]');
  await sleep(600);
  // Atas halaman: header Dashboard kantor + quick stats.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: join(OUT, `${PREFIX}-beranda-top-${suffix}.png`) });
  // Close-up header saja (untuk menunjukkan kerapian + foto kantor).
  const head = await page.$(".page-head");
  if (head) {
    await head.screenshot({ path: join(OUT, `${PREFIX}-header-${suffix}.png`) });
  }
  // Kartu-kartu Beranda yang tersisa (11 kartu).
  await page.evaluate(() =>
    document.querySelector("#panel-home .bento")?.scrollIntoView({ block: "start" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `${PREFIX}-beranda-${suffix}.png`) });
}

// Light, then dark.
await shootBeranda("light");
await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "dark"));
await page.reload({ waitUntil: "load" });
await page
  .waitForFunction(
    () =>
      document.documentElement.dataset.theme === "dark" &&
      document.querySelector('[data-i18n="setAccount"]')?.textContent ===
        "User account",
    { timeout: 120000 },
  )
  .catch(() => console.warn("dark boot wait timed out — shooting anyway"));
await sleep(500);
await shootBeranda("dark");

await browser.close();
console.log("screenshots saved to", OUT, "prefix", PREFIX);
