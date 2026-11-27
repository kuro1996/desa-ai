// DesaAI — screenshot Paket 30 (sekali pakai, bukan bagian dari test suite).
// Memuat dist/ via file:// (pola yang sama dengan headless-test.mjs).
// PENTING: tangkapan VIEWPORT (bukan fullPage) — fullPage mengubah tinggi
// viewport menjadi 17.000px+ dan membuat kartu tampak terjepit, padahal
// tampilan viewport aslinya rapi.
// Jalankan setelah `npm run build`:  node scripts/screenshot-p30.mjs
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

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`file://${join(DIST, "index.html")}`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector(".bento-card", { timeout: 20000 });
  await sleep(800);
  await page.screenshot({ path: join(OUT, "desaai-p30-home-light-mobile.png") });
  console.log("home light 390px top OK");
  await page.evaluate(() => window.scrollTo(0, 844));
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p30-home-light-mobile-2.png") });
  console.log("home light 390px scrolled OK");

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.dataset.theme = "dark";
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, "desaai-p30-home-dark-mobile.png") });
  console.log("home dark 390px OK");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });

  // Lembar surat offline: formulir persis seperti yang Bos isi.
  await page.click('[data-tab="letters"]');
  await sleep(300);
  await page.select("#letter-template", "surat-dinas");
  await sleep(200);
  await page.evaluate(() => {
    const set = (id, v) => {
      const el = document.getElementById(id);
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set("letter-field-nomor", "140/001/DS/XI/2026");
    set("letter-field-tanggal", "28 November 2026");
    set("letter-field-perihal", "Undangan Musyawarah Desa");
    set("letter-field-tujuan", "Kepala Desa Se-Kecamatan Simpangkatis");
    set(
      "letter-field-isi",
      "1. Mengenai pemilihan kepala desa serentak\n2. Forum konsultasi Publik (FKP) Tahun 2026",
    );
    document.getElementById("letter-output").value = "";
  });
  await page.click("#letter-generate");
  await page
    .waitForFunction(
      () => document.getElementById("letter-output")?.value.trim().length > 0,
      { timeout: 20000 },
    )
    .catch(() => console.error("WARN: letter-output tetap kosong"));
  await sleep(400);
  await page.evaluate(() => {
    document.getElementById("letter-sheet")?.scrollIntoView({ block: "start" });
  });
  await sleep(300);
  await page.screenshot({ path: join(OUT, "desaai-p30-letter-offline-mobile.png") });
  console.log("letter offline 390px OK");

  await page.setViewport({ width: 980, height: 900 });
  await page.click('[data-tab="home"]');
  await sleep(500);
  await page.screenshot({ path: join(OUT, "desaai-p30-home-980.png") });
  console.log("home 980px OK");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
