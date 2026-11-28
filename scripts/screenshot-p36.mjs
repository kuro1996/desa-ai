// Paket 36 — viewport screenshots (390px, light + dark) of the demo login
// screen. Usage: node scripts/screenshot-p36.mjs
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

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
await sleep(1500);

// Light: the login gate is static HTML, visible before boot finishes.
await page.screenshot({ path: join(OUT, "p36-login-light.png") });

// Dark: same gate with the dark theme stored (the white card + blue
// gradient stay by design — the gate is brand, not an app panel).
await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "dark"));
await page.reload({ waitUntil: "load" });
await sleep(1500);
await page.screenshot({ path: join(OUT, "p36-login-dark.png") });

await browser.close();
console.log("screenshots saved to", OUT);
