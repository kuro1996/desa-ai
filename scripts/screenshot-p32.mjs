// DesaAI — screenshot Paket 32 (sekali pakai, bukan bagian dari test suite).
// Memuat dist/ via file:// (pola yang sama dengan headless-test.mjs).
// PENTING: tangkapan VIEWPORT (bukan fullPage) — fullPage mengubah tinggi
// viewport menjadi 17.000px+ dan membuat kartu tampak terjepit, padahal
// tampilan viewport aslinya rapi.
// Jalankan setelah `npm run build`:  node scripts/screenshot-p32.mjs
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "show-20261127");
const CHROME = existsSync("/usr/bin/google-chrome")
  ? "/usr/bin/google-chrome"
  : "/opt/meta-chromium/chrome";
const IS_META_CHROMIUM = CHROME.includes("meta-chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("FAIL: dist/index.html missing — run `npm run build` first.");
    process.exit(1);
  }
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--allow-file-access-from-files",
      "--window-size=1280,900",
      "--force-device-scale-factor=1",
      ...metaChromiumFlags(),
    ],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));

  const setTheme = async (theme) => {
    await page.evaluate((t) => {
      window.scrollTo(0, 0);
      document.documentElement.dataset.theme = t;
    }, theme);
    await sleep(400);
  };

  // Beranda terang 390px (FAB Anin terlihat di kanan bawah).
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`file://${join(DIST, "index.html")}`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector(".bento-card", { timeout: 20000 });
  await sleep(800);
  await page.screenshot({ path: join(OUT, "desaai-p32-home-light-mobile.png") });
  console.log("home light 390px OK");

  // Beranda GELAP 390px.
  await setTheme("dark");
  await page.screenshot({ path: join(OUT, "desaai-p32-home-dark-mobile.png") });
  console.log("home dark 390px OK");
  await setTheme("light");

  // Panel chat Anin terbuka 390px terang (sapaan + saran).
  await page.click("#anin-fab");
  await sleep(500);
  await page.screenshot({ path: join(OUT, "desaai-p32-chat-light-mobile.png") });
  console.log("chat light 390px OK");
  await page.click("#anin-panel-close");
  await sleep(200);

  // Tanya Prosedur 390px terang — Anin menjawab KK dari panduan offline
  // (inilah perbaikan 28 Nov 00:13: tanpa error mentah).
  await page.click('[data-tab="qa"]');
  await sleep(300);
  await page.type("#qa-input", "Bagaimana cara mengurus KK baru?");
  await page.click("#qa-ask");
  await sleep(700);
  await page.evaluate(() => {
    document.getElementById("qa-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p32-qa-anin-light-mobile.png") });
  console.log("qa Anin light 390px OK");

  // Tanya Prosedur 390px GELAP (jawaban Anin tetap terbaca).
  await setTheme("dark");
  await page.evaluate(() => {
    document.getElementById("qa-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p32-qa-anin-dark-mobile.png") });
  console.log("qa Anin dark 390px OK");
  await setTheme("light");

  // Beranda 980px terang + panel chat Anin terbuka.
  await page.setViewport({ width: 980, height: 900 });
  await page.click('[data-tab="home"]');
  await sleep(500);
  await page.screenshot({ path: join(OUT, "desaai-p32-home-light-980.png") });
  console.log("home light 980px OK");
  await page.click("#anin-fab");
  await sleep(500);
  await page.screenshot({ path: join(OUT, "desaai-p32-chat-light-980.png") });
  console.log("chat light 980px OK");

  // Tanya Prosedur 980px GELAP.
  await page.click("#anin-panel-close");
  await sleep(200);
  await page.click('[data-tab="qa"]');
  await sleep(300);
  await setTheme("dark");
  await page.evaluate(() => {
    document.getElementById("qa-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p32-qa-anin-dark-980.png") });
  console.log("qa Anin dark 980px OK");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
