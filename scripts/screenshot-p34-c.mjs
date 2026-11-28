// Paket 34-C — viewport screenshots (390px, light + dark) of the three new
// features: Notulen Rapat (Summarize tab), Mode Darurat (Letters tab), and
// the Anin panel with Bahasa Bangka on. Usage: node scripts/screenshot-p34-c.mjs
// (run after `npm run build`). Login demo first (Paket 36 gate), language
// set to Indonesian via the #lang-toggle button (deterministic in this VM:
// stored language is not picked up at boot on file:// — see
// scripts/headless-p34-c.mjs for the probe notes).
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
await sleep(1200);

// Login demo (Paket 36).
await page.evaluate(() => {
  document.getElementById("login-user").value = "";
  document.getElementById("login-pass").value = "";
});
await page.type("#login-user", "demo");
await page.type("#login-pass", "demo123");
await page.click(".login-submit");
await sleep(600);

const setIndonesian = async () => {
  const toggleText = await page.evaluate(
    () => document.getElementById("lang-toggle")?.textContent ?? "",
  );
  if (toggleText.includes("Bahasa Indonesia")) {
    await page.click("#lang-toggle");
    await sleep(600);
  }
};

// Fill the Notulen panel with the same sample the headless test uses, so
// the screenshot shows a finished result (not an empty form).
const NOTULEN_SAMPLE = [
  "Rapat koordinasi posyandu 28 November 2026",
  "Peserta: Budi Santoso, Siti Aminah, Ahmad Fauzi",
  "Agenda:",
  "1. Jadwal posyandu bulan Desember",
  "2. Perbaikan jalan dusun",
  "Keputusan: Posyandu bulan Desember pindah ke balai desa.",
  "Tindak lanjut: Menyiapkan undangan posyandu oleh Budi Santoso",
].join("\n");

const shootNotulen = async (name) => {
  await page.click('[data-tab="summarize"]');
  await sleep(500);
  await page.evaluate(
    (t) => {
      document.getElementById("notulen-input").value = t;
    },
    NOTULEN_SAMPLE,
  );
  await page.click("#notulen-generate");
  await sleep(400);
  await page.evaluate(() => {
    document.getElementById("notulen-card")?.scrollIntoView();
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, name) });
};

const shootDarurat = async (name) => {
  await page.click('[data-tab="letters"]');
  await sleep(500);
  await page.evaluate(() => {
    document.querySelector(".darurat-box")?.scrollIntoView();
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, name) });
};

const shootBangka = async (name) => {
  await page.click("#anin-fab");
  await sleep(500);
  await page.evaluate(() => {
    const cb = document.getElementById("anin-bangka-toggle");
    if (cb && !cb.checked) cb.click();
  });
  await sleep(300);
  await page.evaluate(() => {
    document.getElementById("anin-input").value = "cara mengurus KTP";
  });
  await page.click("#anin-send");
  await sleep(1200);
  await page.screenshot({ path: join(OUT, name) });
  await page.click("#anin-panel-close");
  await sleep(300);
};

// Light.
await setIndonesian();
await shootNotulen("p34c-notulen-light.png");
await shootDarurat("p34c-darurat-light.png");
await shootBangka("p34c-bangka-light.png");

// Dark: theme is applied pre-paint by the <head> script from localStorage.
await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "dark"));
await page.reload({ waitUntil: "load" });
await sleep(1200);
await page
  .waitForFunction(() => document.documentElement.dataset.theme === "dark", {
    timeout: 30000,
  })
  .catch(() => console.warn("dark theme wait timed out — shooting anyway"));
await setIndonesian();
await shootNotulen("p34c-notulen-dark.png");
await shootDarurat("p34c-darurat-dark.png");
await shootBangka("p34c-bangka-dark.png");

await browser.close();
console.log("screenshots saved to", OUT);
