// Paket 38 — viewport screenshots (390px, light + dark) of Beranda with
// the collapse buttons: all cards open, then partly collapsed (Briefing,
// This Month, Monthly Report, Hubungi Kami). Usage: node scripts/screenshot-p38.mjs
import puppeteer from "puppeteer-core";
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "screenshots");
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

const COLLAPSE = ["briefing", "month", "report", "contact"];

async function setCollapsed(keys, collapsed) {
  await page.evaluate((keys, collapsed) => {
    for (const key of keys) {
      const btn = document.querySelector(
        `[data-card="${key}"] .bento-collapse-btn`,
      );
      const card = document.querySelector(`[data-card="${key}"]`);
      if (btn && card && card.classList.contains("collapsed") !== collapsed) {
        btn.click();
      }
    }
  }, keys, collapsed);
  await sleep(400);
}

async function shootHome(suffix) {
  await page.click('[data-tab="home"]');
  await sleep(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p38-home-${suffix}.png`) });
}

async function shootMonthCard(suffix) {
  await page.evaluate(() =>
    document.querySelector(".bento-month")?.scrollIntoView({ block: "start" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p38-home-month-${suffix}.png`) });
}

// Light: open, then partly collapsed (top + This Month card close-up).
await shootHome("open-light");
await setCollapsed(COLLAPSE, true);
await shootHome("collapsed-light");
await shootMonthCard("collapsed-light");

// Dark: the collapsed state persists across reload via localStorage.
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
await shootHome("collapsed-dark");
await shootMonthCard("collapsed-dark");
await setCollapsed(COLLAPSE, false);
await shootHome("open-dark");

await browser.close();
console.log("screenshots saved to", OUT);
