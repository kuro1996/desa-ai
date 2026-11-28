// Paket 42 — viewport screenshots of the Beranda AIDEN layout:
// 4 colored stat cards + two-column panels, plus the IKM trend chart
// now living in the Kepuasan/IKM tab.
// Viewports: 390px (HP) + 980px (desktop), light + dark.
// Usage:
//   node scripts/screenshot-p42.mjs
import puppeteer from "puppeteer-core";
import { createHash } from "node:crypto";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.DIST_DIR || join(ROOT, "dist");
const PREFIX = process.env.PREFIX || "p42";
const OUT = join(ROOT, "screenshots");
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = existsSync("/usr/bin/google-chrome")
  ? "/usr/bin/google-chrome"
  : "/opt/meta-chromium/chrome";
const IS_META_CHROMIUM = CHROME.includes("meta-chromium");

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

async function boot(width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto("file://" + join(DIST, "index.html"), { waitUntil: "load" });
  // Sesi demo bertahan di localStorage antar boot: bila layar login
  // sudah tersembunyi (sesi aktif), lewati langkah login.
  await sleep(800);
  const loginVisible = await page.evaluate(() => {
    const u = document.getElementById("login-user");
    return !!u && u.offsetParent !== null;
  });
  if (loginVisible) {
    await page.type("#login-user", "demo");
    await page.type("#login-pass", "demo123");
    await page.click(".login-submit");
  }
  await page
    .waitForFunction(
      () =>
        document.querySelector('[data-i18n="setAccount"]')?.textContent ===
        "User account",
      { timeout: 120000 },
    )
    .catch(() => console.warn("boot wait timed out — shooting anyway"));
  await sleep(500);
}

async function shoot(suffix) {
  // Beranda atas: header + baris stat AIDEN.
  await page.click('[data-tab="home"]');
  await sleep(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: join(OUT, `${PREFIX}-beranda-top-${suffix}.png`) });
  // Baris stat close-up.
  const stats = await page.$("#home-stat-row");
  if (stats) {
    await stats.screenshot({ path: join(OUT, `${PREFIX}-statrow-${suffix}.png`) });
  }
  // Panel dua kolom (Laporan + Pengaduan berdampingan).
  await page.evaluate(() =>
    document.querySelector(".bento-report")?.scrollIntoView({ block: "start" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `${PREFIX}-beranda-${suffix}.png`) });
  // Tab IKM: grafik tren di bawah batang per unsur.
  await page.click('[data-tab="ikm"]');
  await sleep(600);
  await page.evaluate(() =>
    document.querySelector("#ikm-trend")?.scrollIntoView({ block: "center" }),
  );
  await sleep(400);
  await page.screenshot({ path: join(OUT, `${PREFIX}-ikm-trend-${suffix}.png`) });
}

// 390px light, then dark.
await boot(390, 844);
await shoot("390-light");
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
await shoot("390-dark");

// 980px desktop light, then dark.
await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "light"));
await boot(980, 800);
await shoot("980-light");
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
await shoot("980-dark");

await browser.close();
console.log("screenshots saved to", OUT, "prefix", PREFIX);
