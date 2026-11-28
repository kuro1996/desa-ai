// DesaAI — screenshot Paket 33 (sekali pakai, bukan bagian dari test suite).
// Memuat dist/ via file:// (pola yang sama dengan headless-test.mjs).
// PENTING: tangkapan VIEWPORT (bukan fullPage) — fullPage mengubah tinggi
// viewport menjadi 17.000px+ dan membuat kartu tampak terjepit, padahal
// tampilan viewport aslinya rapi.
// Jalankan setelah `npm run build`:  node scripts/screenshot-p33.mjs
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

  // Tab Draf Surat 390px terang — isi formulir undangan lalu buat draf
  // (fallback offline Paket 30), tombol "Kirim ke WhatsApp" terlihat di
  // baris aksi di bawah lembar surat.
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`file://${join(DIST, "index.html")}`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector(".bento-card", { timeout: 20000 });
  await page.click('[data-tab="letters"]');
  await sleep(300);
  await page.select("#letter-template", "undangan");
  await sleep(200);
  await page.type("#letter-field-acara", "Musyawarah Desa");
  await page.type("#letter-field-hari", "Jumat, 20 November 2026");
  await page.type("#letter-field-waktu", "09.00 WIB");
  await page.type("#letter-field-tempat", "Balai Desa");
  await page.type("#letter-field-tujuan", "Ketua RT 01 s.d. RT 05");
  await page.click("#letter-generate");
  await sleep(900);
  await page.evaluate(() => {
    document.getElementById("letter-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p33-wa-light-mobile.png") });
  console.log("letters WA light 390px OK");

  // Sama, mode GELAP 390px.
  await setTheme("dark");
  await page.evaluate(() => {
    document.getElementById("letter-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p33-wa-dark-mobile.png") });
  console.log("letters WA dark 390px OK");
  await setTheme("light");

  // 980px terang — baris aksi + tombol WhatsApp tetap rapi.
  await page.setViewport({ width: 980, height: 900 });
  await page.evaluate(() => {
    document.getElementById("letter-output-wrap")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p33-wa-light-980.png") });
  console.log("letters WA light 980px OK");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
