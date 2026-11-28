// Paket 37 — viewport screenshots (390px, light + dark) of Beranda after
// the backup/letterhead cards moved to Settings, plus the Settings
// Data & Privasi group (backup export + restore) and the Kop Surat group.
// Usage: node scripts/screenshot-p37.mjs
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
// Boot awaits the Firebase/on-device probes before applyLang() runs, so
// wait for a data-i18n label that only applyLang() translates (the
// settings "User account" heading — the tab labels are static English in
// the HTML and prove nothing). Fresh profile => default language English.
await page
  .waitForFunction(
    () =>
      document.querySelector('[data-i18n="setAccount"]')?.textContent ===
      "User account",
    { timeout: 120000 },
  )
  .catch(() => console.warn("boot wait timed out — shooting anyway"));
await sleep(500);

async function shootHome(suffix) {
  await page.click('[data-tab="home"]');
  await sleep(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p37-home-${suffix}.png`) });
}

async function shootSettings(suffix) {
  await page.click('[data-tab="settings"]');
  await sleep(600);
  await page.evaluate(() =>
    document.getElementById("set-backup-export")?.scrollIntoView({ block: "center" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p37-settings-backup-${suffix}.png`) });
  await page.evaluate(() =>
    document.getElementById("set-letterhead-form")?.scrollIntoView({ block: "start" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p37-settings-letterhead-${suffix}.png`) });
}

// Light: Beranda, then Settings (backup + letterhead).
await shootHome("light");
await shootSettings("light");

// Dark: same three shots (login session persists across reload).
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
await shootHome("dark");
await shootSettings("dark");

await browser.close();
console.log("screenshots saved to", OUT);
