// DesaAI — LIVE cloud-generation test (Sprint 2 quota window, free tier only).
// Loads the built app (dist/) via file:// in headless Chrome, fills the
// Undangan letter form, clicks Generate, and waits for a real Gemini cloud
// response. Verdict is printed at the end:
//   CLOUD_OK   = real generated letter text + Cloud badge (IN_CLOUD)
//   CLOUD_FAIL = app runs but the cloud call errored (status/error captured)
//   APP_FAIL   = app itself did not load / Firebase not ready
// Run after `npm run build`:  node scripts/live-cloud-test.mjs
// Makes ONE real Gemini call through Bos's Firebase project (free tier).
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("APP_FAIL: dist/index.html missing — run `npm run build` first.");
    process.exit(1);
  }
  const errors = [];
  const failedRequests = [];
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--allow-file-access-from-files",
        "--window-size=1280,900",
        ...metaChromiumFlags(),
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (req) =>
      failedRequests.push(`${req.url()} — ${req.failure()?.errorText}`),
    );
    page.on("response", (res) => {
      if (res.status() >= 400)
        failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
    });

    await page.goto(`file://${join(DIST, "index.html")}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(2500);

    const title = await page.title();
    console.log(`title: ${title}`);
    const bannerHidden = await page.$eval("#config-banner", (el) => el.hidden);
    const fbChip = await page.$eval("#firebase-chip", (el) => el.textContent);
    const deviceChip = await page.$eval("#device-chip", (el) => el.textContent);
    console.log(`config-banner hidden (true = Firebase configured): ${bannerHidden}`);
    console.log(`firebase-chip: ${fbChip}`);
    console.log(`device-chip: ${deviceChip}`);
    if (!bannerHidden) {
      console.log("APP_FAIL: still in demo mode — Firebase config not active in build.");
      process.exitCode = 1;
      return;
    }

    // Fill Undangan form and generate.
    await page.select("#letter-template", "undangan");
    await sleep(300);
    await page.type("#letter-field-acara", "Musyawarah Desa");
    await page.type("#letter-field-hari", "Jumat, 20 November 2026");
    await page.type("#letter-field-waktu", "09.00 WIB");
    await page.type("#letter-field-tempat", "Balai Desa");
    await page.type("#letter-field-tujuan", "Ketua RT 01 s.d. RT 05");
    await page.click("#letter-generate");
    console.log("generate clicked — waiting for cloud response (max 150s)...");

    let output = "";
    let status = "";
    for (let i = 0; i < 75; i++) {
      await sleep(2000);
      output = await page.$eval("#letter-output", (el) => el.value || "").catch(() => "");
      status = await page.$eval("#letter-status", (el) => el.textContent || "").catch(() => "");
      if (output.trim().length > 100) break;
      if (/error|gagal|failed/i.test(status) && output.trim().length === 0 && i > 10) break;
      if (i % 10 === 0) console.log(`  ...${(i + 1) * 2}s status=${JSON.stringify(status)} outLen=${output.length}`);
    }
    const badge = await page.$eval("#letter-badge", (el) => el.textContent || "").catch(() => "");
    const reason = await page.$eval("#letter-reason", (el) => el.textContent || "").catch(() => "");
    console.log(`letter-status: ${JSON.stringify(status)}`);
    console.log(`letter-badge: ${JSON.stringify(badge)}`);
    console.log(`letter-reason: ${JSON.stringify(reason)}`);
    console.log(`letter-output length: ${output.length} chars`);
    if (output.trim()) console.log(`letter-output preview: ${output.trim().slice(0, 400)}`);
    console.log(`console errors (${errors.length}): ${errors.slice(0, 5).join(" | ")}`);
    console.log(`failed requests (${failedRequests.length}): ${failedRequests.slice(0, 5).join(" | ")}`);

    const isCloud = /cloud/i.test(badge);
    if (output.trim().length > 100 && isCloud) {
      console.log("\nVERDICT: CLOUD_OK — real Gemini cloud generation works, badge Cloud.");
    } else if (output.trim().length > 100) {
      console.log("\nVERDICT: CLOUD_OK? — text generated but badge is not Cloud; check badge/reason above.");
    } else {
      console.log("\nVERDICT: CLOUD_FAIL — no generated text. See status/errors above.");
      process.exitCode = 2;
    }
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((e) => {
  console.error("APP_FAIL: test harness error:", e);
  process.exit(1);
});
