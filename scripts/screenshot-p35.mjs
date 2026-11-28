// Paket 35 — viewport screenshots (390px, light + dark) of the Settings tab
// and the home contact card. Usage: node scripts/screenshot-p35.mjs
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

// Light: home contact card first, then the settings tab.
await page.evaluate(() => {
  document.getElementById("home-contact-card")?.scrollIntoView();
});
await sleep(400);
await page.screenshot({ path: join(OUT, "p35-contact-card-light.png") });
await page.click('[data-tab="settings"]');
await sleep(600);
await page.evaluate(() =>
  document.getElementById("panel-settings")?.scrollIntoView(),
);
await sleep(400);
await page.screenshot({ path: join(OUT, "p35-settings-light.png") });

// Dark: same two shots.
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
await page.evaluate(() => {
  document.getElementById("home-contact-card")?.scrollIntoView();
});
await sleep(400);
await page.screenshot({ path: join(OUT, "p35-contact-card-dark.png") });
await page.click('[data-tab="settings"]');
await sleep(600);
await page.evaluate(() =>
  document.getElementById("panel-settings")?.scrollIntoView(),
);
await sleep(400);
await page.screenshot({ path: join(OUT, "p35-settings-dark.png") });

await browser.close();
console.log("screenshots saved to", OUT);
