// DesaAI — screenshot Paket 32.1 (sekali pakai, bukan bagian dari test suite).
// Memuat dist/ via file:// (pola yang sama dengan headless-test.mjs dan
// screenshot-p32.mjs). Tangkapan VIEWPORT (bukan fullPage).
// Menanyakan pertanyaan persis dari tangkapan layar Bos 28 Nov 08:55
// ("Kalau ada pengaduan bisa selesaikan") dan menangkap panel chat Anin
// 390px terang — jawaban harus menunjukkan alur Baru → Diproses → Selesai.
// Jalankan setelah `npm run build`:  node scripts/screenshot-p321.mjs
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
  // Bahasa Indonesia dulu (aplikasi default berbahasa Inggris).
  await page.click("#lang-toggle");
  await sleep(300);
  await page.click("#anin-fab");
  await sleep(500);
  // Pertanyaan persis dari tangkapan layar Bos.
  const before = await page.$$eval("#anin-messages .anin-msg-anin", (els) => els.length);
  await page.type("#anin-input", "Kalau ada pengaduan bisa selesaikan");
  await page.click("#anin-send");
  await page.waitForFunction(
    (n) => document.querySelectorAll("#anin-messages .anin-msg-anin").length > n,
    { timeout: 10000 },
    before,
  );
  await sleep(300);
  const reply = await page.$eval(
    "#anin-messages .anin-msg-anin:last-of-type p",
    (el) => el.textContent ?? "",
  );
  console.log("Anin reply:", reply.slice(0, 200));
  if (!/Baru/.test(reply) || !/Diproses/.test(reply) || !/Selesai/.test(reply)) {
    console.error("FAIL: reply does not show the Baru → Diproses → Selesai flow.");
    process.exitCode = 1;
  }
  await page.screenshot({ path: join(OUT, "desaai-p321-chat-pengaduan-mobile.png") });
  console.log("chat pengaduan 390px OK");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
