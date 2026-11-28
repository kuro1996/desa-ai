// Paket 34 (A) — viewport screenshots (390px, light + dark) of the new
// features: the Home reminder widget, the Anin panel reminder card, the
// letter-check results, and the archive button in Archive & Drafts.
// Usage: node scripts/screenshot-p34-a.mjs (after `npm run build`).
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
await page
  .waitForFunction(
    () =>
      document.querySelector('[data-i18n="setAccount"]')?.textContent ===
      "User account",
    { timeout: 120000 },
  )
  .catch(() => console.warn("boot wait timed out — shooting anyway"));
await sleep(500);

// Login demo + Bahasa Indonesia.
await page.evaluate(() => {
  document.getElementById("login-user").value = "";
  document.getElementById("login-pass").value = "";
});
await page.type("#login-user", "demo");
await page.type("#login-pass", "demo123");
await page.click(".login-submit");
await sleep(600);
await page.click("#lang-toggle");
await sleep(300);

// Seed the local archive (2 undangan 012/013 + 1 surat dinas).
await page.evaluate(() => {
  const now = Date.now();
  localStorage.setItem(
    "desaai-drafts-v1",
    JSON.stringify([
      {
        id: "d-p34-1",
        kind: "letter",
        title: "Surat Undangan",
        content:
          "Nomor: 140/012/DS/XI/2026\nDengan hormat, kami mengundang Bapak/Ibu pada musyawarah desa.",
        createdAt: now - 86_400_000,
        source: "local",
      },
      {
        id: "d-p34-2",
        kind: "letter",
        title: "Surat Undangan",
        content:
          "Nomor: 140/013/DS/XI/2026\nDengan hormat, kami mengundang Bapak/Ibu pada musyawarah desa.",
        createdAt: now - 3_600_000,
        source: "local",
      },
      {
        id: "d-p34-3",
        kind: "letter",
        title: "Surat Dinas",
        content:
          "Nomor: 470/45/Kec-Simp/XI/2026\nPerihal: Permohonan data penduduk.",
        createdAt: now - 7_200_000,
        source: "local",
      },
    ]),
  );
});

// A draft with format errors, so the check panel has content.
async function prepareCheckedDraft() {
  await page.click('[data-tab="letters"]');
  await sleep(400);
  await page.evaluate(() => {
    document.getElementById("letter-field-perihal").value =
      "Undangan Musrenbang Desa";
  });
  await page.click("#letter-generate");
  await sleep(800);
  await page.evaluate(() => {
    document.getElementById("letter-output").value =
      "dengan hormat, kami sampaikan dimana acara dilaksanakan  dan selesai.";
  });
  await page.click("#letter-check");
  await sleep(400);
}

async function shootAll(suffix) {
  await page.evaluate(() => {
    document.getElementById("home-reminder-card")?.scrollIntoView();
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p34a-home-reminder-${suffix}.png`) });

  await page.click("#anin-fab");
  await sleep(500);
  await page.screenshot({ path: join(OUT, `p34a-anin-panel-${suffix}.png`) });
  await page.click("#anin-panel-close");
  await sleep(300);

  await prepareCheckedDraft();
  await page.evaluate(() => {
    document.getElementById("letter-check-results")?.scrollIntoView();
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p34a-letter-check-${suffix}.png`) });

  await page.click('[data-tab="drafts"]');
  await sleep(600);
  await page.click("#drafts-anin-arsip");
  await sleep(400);
  await page.evaluate(() => {
    document.getElementById("drafts-anin-result")?.scrollIntoView();
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, `p34a-drafts-arsip-${suffix}.png`) });
  await page.click('[data-tab="home"]');
  await sleep(300);
}

// Light.
await shootAll("light");

// Dark: same shots after switching the theme with the theme toggle —
// NO reload (a reload re-runs boot, whose Firebase probes hang for
// minutes on this VM's blocked tunnel, so applyLang would not finish
// before the shots). The toggle applies the theme live and persists it.
await page.click("#theme-toggle");
await page.waitForFunction(
  () => document.documentElement.dataset.theme === "dark",
  { timeout: 10000 },
);
await sleep(500);
await shootAll("dark");

await browser.close();
console.log("screenshots saved to", OUT);
