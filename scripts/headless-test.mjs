// DesaAI — headless-Chrome UI test (puppeteer-core, system Chrome).
// Loads the built app (dist/) via file:// (this VM's Chrome build blocks
// http://127.0.0.1 navigations with Local Network Access checks; the Vite
// build uses relative asset paths so file:// works), exercises all three
// feature flows end to end, and fails on ANY console error or failed
// request. Run after `npm run build`:
//   npm run test:headless
//
// NOTE: the build VM's headless Chrome has no Gemini Nano / Prompt API, so
// this test exercises the demo-mode paths (Firebase not configured) and the
// offline KB Q&A. It proves the UI, routing badge code, and graceful
// degradation — it does NOT prove live on-device inference.
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
// System Chrome vanishes on VM replacement; fall back to meta-chromium.
const CHROME = existsSync("/usr/bin/google-chrome")
  ? "/usr/bin/google-chrome"
  : "/opt/meta-chromium/chrome";
const IS_META_CHROMIUM = CHROME.includes("meta-chromium");

// Meta-chromium requires a WebGL allowlist file + its sha256 to run headless.
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
    console.error("FAIL: dist/index.html missing — run `npm run build` first.");
    process.exit(1);
  }
  const errors = [];
  const failedRequests = [];
  let browser;
  const results = [];
  const check = (name, ok, detail = "") => {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  };

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
    page.on("requestfailed", (req) => failedRequests.push(`${req.url()} — ${req.failure()?.errorText}`));
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
    });

    // Load from file:// — this VM's Chrome build blocks http://127.0.0.1
    // navigations (Local Network Access checks), and the Vite build uses
    // relative asset paths (base: "./") so file:// works.
    await page.goto(`file://${join(DIST, "index.html")}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);

    // 1. App loads
    const title = await page.title();
    check("app loads", title.includes("DesaAI"), `title="${title}"`);
    const demoBanner = await page.$eval("#config-banner", (el) => !el.hidden);
    check("demo-mode banner visible (no Firebase config)", demoBanner);
    const deviceChip = await page.$eval("#device-chip", (el) => el.textContent);
    check("on-device chip reports status", /On-device:/.test(deviceChip), deviceChip);
    const fbChip = await page.$eval("#firebase-chip", (el) => el.textContent);
    check("firebase chip reports demo mode", /demo mode/i.test(fbChip), fbChip);

    // 2. Letters tab: fill form, generate (demo mode → config message, no crash)
    await page.select("#letter-template", "undangan");
    await sleep(200);
    const fieldCount = await page.$$eval("#letter-fields input, #letter-fields textarea", (els) => els.length);
    check("undangan template renders fields", fieldCount === 7, `${fieldCount} fields`);
    await page.type("#letter-field-acara", "Musyawarah Desa");
    await page.type("#letter-field-hari", "Jumat, 20 November 2026");
    await page.type("#letter-field-waktu", "09.00 WIB");
    await page.type("#letter-field-tempat", "Balai Desa");
    await page.type("#letter-field-tujuan", "Ketua RT 01 s.d. RT 05");
    await page.click("#letter-generate");
    await sleep(600);
    const letterStatus = await page.$eval("#letter-status", (el) => el.textContent);
    check(
      "letter generate in demo mode explains config needed",
      /not configured/i.test(letterStatus),
      letterStatus,
    );

    // Letter copy/download buttons exist and are wired (no-op without text is fine)
    const letterBtns = await page.$$eval(
      "#letter-copy, #letter-download, #letter-save",
      (els) => els.map((e) => e.id),
    );
    check("letter actions present", letterBtns.length === 3, letterBtns.join(","));

    // 3. Summarizer tab
    await page.click('[data-tab="summarize"]');
    await sleep(200);
    await page.type(
      "#sum-input",
      "Rapat musyawarah desa membahas anggaran pembangunan jalan sepanjang 2 km. " +
        "Anggaran disetujui sebesar Rp150.000.000 dari Dana Desa. Pekerjaan dimulai Januari 2026 " +
        "dan selesai sebelum musim hujan. Panitia pembangunan dibentuk dengan ketua Bapak Sardi.",
    );
    await sleep(200);
    const charCount = await page.$eval("#sum-count", (el) => el.textContent);
    check("summarizer char counter updates", Number(charCount) > 100, `${charCount} chars`);
    await page.click("#sum-generate");
    await sleep(600);
    const sumStatus = await page.$eval("#sum-status", (el) => el.textContent);
    check(
      "summarizer in demo mode explains config needed",
      /not configured/i.test(sumStatus),
      sumStatus,
    );

    // 4. Q&A tab — offline KB path (works WITHOUT Firebase)
    await page.click('[data-tab="qa"]');
    await sleep(200);
    await page.type("#qa-input", "Apa syarat membuat KTP?");
    await page.click("#qa-ask");
    await sleep(600);
    const qaOutput = await page.$eval("#qa-output", (el) => el.textContent);
    check(
      "Q&A answers from offline KB without Firebase",
      /KTP Elektronik/.test(qaOutput) && /17 tahun/.test(qaOutput),
      qaOutput.slice(0, 80),
    );
    const qaBadge = await page.$eval("#qa-badge", (el) => el.textContent);
    check("Q&A shows routing badge", /perangkat|On-device/i.test(qaBadge), qaBadge);
    const qaSources = await page.$eval("#qa-sources", (el) => el.textContent);
    check("Q&A lists KB sources", /KTP Elektronik/.test(qaSources), qaSources);

    // KB guide section renders
    const kbItems = await page.$$eval("#kb-list .kb-item", (els) => els.length);
    check("offline procedure guide renders", kbItems === 8, `${kbItems} entries`);

    // Language toggle to Indonesian
    await page.click("#lang-toggle");
    await sleep(300);
    const tabLabel = await page.$eval('[data-tab="letters"]', (el) => el.textContent);
    check("language toggle switches to Indonesian", /Draf Surat/.test(tabLabel), tabLabel.trim());
    await page.click("#lang-toggle");
    await sleep(300);

    // 5. Drafts tab (empty state)
    await page.click('[data-tab="drafts"]');
    await sleep(300);
    const draftsEmpty = await page.$eval("#drafts-empty", (el) => !el.hidden);
    check("drafts tab shows empty state", draftsEmpty);

    // 6. No console errors, no failed requests
    check("0 console errors", errors.length === 0, errors.join(" | ").slice(0, 500));
    check("0 failed requests", failedRequests.length === 0, failedRequests.join(" | ").slice(0, 500));

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
    if (failed.length > 0) {
      console.error(`\n${failed.length} check(s) FAILED.`);
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((e) => {
  console.error("FAIL: test harness error:", e);
  process.exit(1);
});
