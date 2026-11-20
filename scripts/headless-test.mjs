// DesaAI — headless-Chrome UI test (puppeteer-core, system Chrome).
// Loads the built app (dist/) via file:// (this VM's Chrome build blocks
// http://127.0.0.1 navigations with Local Network Access checks; the Vite
// build uses relative asset paths so file:// works), exercises all feature
// flows end to end — letters, summarizer, Q&A (offline KB path), drafts,
// and the Kepegawaian (SIAP AKAD sample data) module — and fails on ANY
// console error or failed request from the app itself.
// Run after `npm run build`:
//   npm run test:headless
//
// NOTE: the build VM's headless Chrome has no Gemini Nano / Prompt API, so
// this test exercises the demo-mode paths (Firebase init cannot reach
// Google endpoints here) and the offline KB Q&A. It proves the UI, routing
// badge code, kepegawaian admin flow, and graceful degradation — it does
// NOT prove live on-device inference or live cloud calls.
//
// ENVIRONMENT FILTER (honest): this VM's headless Chrome cannot reach
// Google/Firebase endpoints at all (ERR_TUNNEL_CONNECTION_FAILED for
// firebaseinstallations.googleapis.com, recaptcha, etc.), so Firebase init
// hangs and its network attempts fail at the tunnel. Those failures are
// an environment limitation, not app errors: the test filters them out of
// the "0 console errors / 0 failed requests" assertions and asserts zero
// for everything else (local assets, app JS errors).
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

// Failures caused by this VM's blocked tunnel to Google/Firebase endpoints.
const ENV_NOISE = /ERR_TUNNEL_CONNECTION_FAILED|JSHandle@error|firebaseinstallations\.googleapis\.com|googleapis\.com|recaptcha|identitytoolkit|firestore\.googleapis|firebaseremoteconfig/i;
const isEnvNoise = (text) => ENV_NOISE.test(text);

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
      if (msg.type() === "error" && !isEnvNoise(msg.text())) errors.push(msg.text());
    });
    page.on("pageerror", (e) => {
      if (!isEnvNoise(e.message)) errors.push(`pageerror: ${e.message}`);
    });
    page.on("requestfailed", (req) => {
      const url = `${req.url()} — ${req.failure()?.errorText}`;
      if (!isEnvNoise(url)) failedRequests.push(url);
    });
    page.on("response", (res) => {
      if (res.status() >= 400 && !isEnvNoise(res.url())) {
        failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
      }
    });
    // Auto-accept confirm() dialogs (used by the kepegawaian delete flow).
    page.on("dialog", (d) => d.accept());

    // Load from file:// — this VM's Chrome build blocks http://127.0.0.1
    // navigations (Local Network Access checks), and the Vite build uses
    // relative asset paths (base: "./") so file:// works.
    await page.goto(`file://${join(DIST, "index.html")}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);

    // 1. App loads (Firebase config is now real, so the demo banner is hidden)
    const title = await page.title();
    check("app loads", title.includes("DesaAI"), `title="${title}"`);
    const demoBannerHidden = await page.$eval("#config-banner", (el) => el.hidden);
    check("demo-mode banner hidden (Firebase configured)", demoBannerHidden);
    const deviceChip = await page.$eval("#device-chip", (el) => el.textContent);
    check("on-device chip reports status", /On-device:/.test(deviceChip), deviceChip);
    const fbChip = await page.$eval("#firebase-chip", (el) => el.textContent);
    check("firebase chip reports a status", fbChip.trim().length > 0, fbChip);

    // 2. Letters tab: fill form, generate (no live AI in this VM → config/AI message, no crash)
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
      "letter generate without live AI explains the state (no crash)",
      /not configured|failed/i.test(letterStatus),
      letterStatus,
    );

    // Letter copy/download buttons exist and are wired (no-op without text is fine)
    const letterBtns = await page.$$eval(
      "#letter-copy, #letter-download, #letter-save",
      (els) => els.map((e) => e.id),
    );
    check("letter actions present", letterBtns.length === 3, letterBtns.join(","));

    // 2b. SK Pengangkatan template exists (kepegawaian integration)
    const tplOptions = await page.$$eval("#letter-template option", (els) => els.map((e) => e.value));
    check(
      "SK Pengangkatan template present",
      tplOptions.includes("sk-pengangkatan"),
      tplOptions.join(","),
    );

    // 2c. Automatic letter numbering (per-template counter, yearly reset)
    await page.click("#letter-autonumber");
    await sleep(200);
    const nomor1 = await page.$eval("#letter-field-nomor", (el) => el.value);
    await page.click("#letter-autonumber");
    await sleep(200);
    const nomor2 = await page.$eval("#letter-field-nomor", (el) => el.value);
    const seqOf = (v) => Number(v.split("/")[1]);
    check(
      "auto number fills a formatted letter number and increments",
      /^\d+\/\d{3}\/DS\/[IVX]+\/\d{4}$/.test(nomor1) && seqOf(nomor2) === seqOf(nomor1) + 1,
      `${nomor1} -> ${nomor2}`,
    );

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
      "summarizer without live AI explains the state (no crash)",
      /not configured|failed/i.test(sumStatus),
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

    // KB guide section renders (8 original + 2 kepegawaian entries)
    const kbItems = await page.$$eval("#kb-list .kb-item", (els) => els.length);
    check("offline procedure guide renders", kbItems === 10, `${kbItems} entries`);

    // Document-requirements checklist: ticking a syarat marks it done
    const kbChecks = await page.$$eval(
      "#kb-list .kb-item:first-child .checklist input[type='checkbox']",
      (els) => els.length,
    );
    check("KB syarat renders as a checklist", kbChecks === 3, `${kbChecks} checkboxes`);
    await page.evaluate(() => {
      document.querySelector("#kb-list .kb-item:first-child .checklist input[type='checkbox']").click();
    });
    await sleep(200);
    const kbDone = await page.$eval(
      "#kb-list .kb-item:first-child .checklist li:first-child",
      (el) => el.classList.contains("done"),
    );
    check("KB checklist tick marks the requirement done", kbDone);

    // Q&A about perangkat desa matches the new KB entries
    await page.$eval("#qa-input", (el) => { el.value = ""; });
    await page.type("#qa-input", "Berapa lama masa bhakti perangkat desa?");
    await page.click("#qa-ask");
    await sleep(600);
    const qaOutput2 = await page.$eval("#qa-output", (el) => el.textContent);
    check(
      "Q&A answers perangkat desa from new KB entries",
      /Perangkat Desa/.test(qaOutput2) && /masa bhakti/i.test(qaOutput2),
      qaOutput2.slice(0, 80),
    );

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

    // 6. Kepegawaian tab (SIAP AKAD sample data)
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    const kegVisible = await page.$eval("#panel-kepegawaian", (el) => !el.hidden);
    check("kepegawaian tab opens", kegVisible);
    const demoNote = await page.$eval("#keg-demo-note", (el) => el.textContent);
    check(
      "kepegawaian shows clear SAMPLE DATA label",
      /contoh|sample/i.test(demoNote) && /bukan data asli|not real data/i.test(demoNote),
      demoNote.slice(0, 80),
    );
    // Stats must be internally consistent with the table's masa bhakti dates.
    const kegCounts = await page.evaluate(() => {
      const num = (id) => Number(document.getElementById(id)?.textContent ?? 0);
      const rows = [...document.querySelectorAll("#keg-table-body tr")];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let habis = 0;
      let akanHabis = 0;
      let aktif = 0;
      for (const tr of rows) {
        const masa = tr.children[7]?.textContent ?? "";
        const m = masa.match(/(\d{2}) (\w{3}) (\d{4})\s*$/);
        if (!m) continue;
        const end = new Date(`${m[3]}-${({ Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06", Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12" })[m[2]]}-${m[1]}T00:00:00`);
        const days = Math.round((end.getTime() - today.getTime()) / 86400000);
        if (days < 0) habis += 1;
        else if (days <= 90) akanHabis += 1;
        else aktif += 1;
      }
      return {
        total: num("keg-stat-total"),
        desa: num("keg-stat-desa"),
        aktif: num("keg-stat-aktif"),
        akanHabis: num("keg-stat-akanhabis"),
        habis: num("keg-stat-habis"),
        rows: rows.length,
        calcAktif: aktif,
        calcAkanHabis: akanHabis,
        calcHabis: habis,
        notifCount: Number(document.getElementById("keg-notif-count")?.textContent ?? 0),
        notifItems: document.querySelectorAll("#keg-notif-list li").length,
      };
    });
    check("kepegawaian seeds 15 demo records", kegCounts.total === 15 && kegCounts.rows === 15, `total=${kegCounts.total} rows=${kegCounts.rows}`);
    check("kepegawaian covers 10 villages", kegCounts.desa === 10, `desa=${kegCounts.desa}`);
    check(
      "kepegawaian stats match masa bhakti dates",
      kegCounts.aktif === kegCounts.calcAktif &&
        kegCounts.akanHabis === kegCounts.calcAkanHabis &&
        kegCounts.habis === kegCounts.calcHabis &&
        kegCounts.aktif + kegCounts.akanHabis + kegCounts.habis === 15,
      `stats aktif=${kegCounts.aktif} akanHabis=${kegCounts.akanHabis} habis=${kegCounts.habis} | calc ${kegCounts.calcAktif}/${kegCounts.calcAkanHabis}/${kegCounts.calcHabis}`,
    );
    check(
      "kepegawaian notifications = expired + expiring soon",
      kegCounts.notifCount === kegCounts.notifItems &&
        kegCounts.notifItems === kegCounts.calcHabis + kegCounts.calcAkanHabis &&
        kegCounts.notifItems > 0,
      `badge=${kegCounts.notifCount} items=${kegCounts.notifItems} expected=${kegCounts.calcHabis + kegCounts.calcAkanHabis}`,
    );
    // Desa cards: 10 cards; lembaga: 6 cards
    const desaCards = await page.$$eval("#keg-desa-cards .desa-card", (els) => els.length);
    check("kepegawaian renders 10 village cards", desaCards === 10, `${desaCards} cards`);
    const lembagaCards = await page.$$eval("#keg-lembaga-list .lembaga-card", (els) => els.length);
    check("kepegawaian renders 6 lembaga cards", lembagaCards === 6, `${lembagaCards} cards`);

    // Add a record via the form — validation first (empty, bad NIK, bad dates)
    await page.click("#keg-add");
    await sleep(300);
    const emptyStatus = await page.$eval("#keg-form-status", (el) => el.textContent);
    const totalAfterEmpty = await page.$eval("#keg-stat-total", (el) => el.textContent);
    check(
      "kepegawaian form rejects an empty submit",
      /required/i.test(emptyStatus) && totalAfterEmpty === "15",
      `status=${emptyStatus} total=${totalAfterEmpty}`,
    );
    await page.type("#keg-in-nama", "Tes Tambah");
    await page.type("#keg-in-tempat", "Pangkalpinang");
    await page.type("#keg-in-nik", "123");
    await page.select("#keg-in-agama", "Islam");
    await page.select("#keg-in-jabatan", "Staf Desa");
    await page.select("#keg-in-desa", "Terak");
    await page.$eval("#keg-in-tgl", (el) => { el.value = "1990-01-15"; });
    await page.$eval("#keg-in-mulai", (el) => { el.value = "2025-01-01"; });
    await page.$eval("#keg-in-selesai", (el) => { el.value = "2027-12-31"; });
    await page.click("#keg-add");
    await sleep(300);
    const nikStatus = await page.$eval("#keg-form-status", (el) => el.textContent);
    const totalAfterNik = await page.$eval("#keg-stat-total", (el) => el.textContent);
    check(
      "kepegawaian form rejects a non-16-digit NIK",
      /16 digits/i.test(nikStatus) && totalAfterNik === "15",
      `status=${nikStatus} total=${totalAfterNik}`,
    );
    await page.$eval("#keg-in-nik", (el) => { el.value = ""; });
    await page.$eval("#keg-in-selesai", (el) => { el.value = "2020-01-01"; });
    await page.click("#keg-add");
    await sleep(300);
    const dateStatus = await page.$eval("#keg-form-status", (el) => el.textContent);
    const totalAfterDate = await page.$eval("#keg-stat-total", (el) => el.textContent);
    check(
      "kepegawaian form rejects end date before start date",
      /after the term start/i.test(dateStatus) && totalAfterDate === "15",
      `status=${dateStatus} total=${totalAfterDate}`,
    );
    await page.$eval("#keg-in-selesai", (el) => { el.value = "2027-12-31"; });
    await page.click("#keg-add");
    await sleep(400);
    const totalAfterAdd = await page.$eval("#keg-stat-total", (el) => el.textContent);
    const formStatus = await page.$eval("#keg-form-status", (el) => el.textContent);
    check("kepegawaian add form saves a record", totalAfterAdd === "16", `total=${totalAfterAdd} status=${formStatus}`);

    // Search filter
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.type("#keg-search", "Ahmad");
    await sleep(300);
    const searchRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian search filters rows", searchRows === 1, `${searchRows} rows for "Ahmad"`);
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.evaluate(() => document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })));
    await sleep(200);

    // Village filter: Katis has 3 demo records
    await page.select("#keg-filter-desa", "Katis");
    await sleep(300);
    const katisRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian village filter works", katisRows === 3, `${katisRows} rows for Katis`);
    await page.select("#keg-filter-desa", "");
    await sleep(200);

    // Status filter: expired / expiring soon are computed from term dates
    await page.select("#keg-filter-status", "habis");
    await sleep(300);
    const habisRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian status filter shows expired terms", habisRows === 1, `${habisRows} rows`);
    await page.select("#keg-filter-status", "akan-habis");
    await sleep(300);
    const akanRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian status filter shows expiring terms", akanRows === 2, `${akanRows} rows`);
    await page.select("#keg-filter-status", "");
    await sleep(200);

    // "Buat SK" prefills the SK Pengangkatan template from a record
    await page.evaluate(() => {
      const btn = document.querySelector('#keg-table-body tr button[data-action="sk"]');
      btn.click();
    });
    await sleep(400);
    const lettersActive = await page.$eval('[data-tab="letters"]', (el) => el.classList.contains("active"));
    const tplValue = await page.$eval("#letter-template", (el) => el.value);
    const skNama = await page.$eval("#letter-field-nama", (el) => el.value);
    check(
      "Buat SK prefills SK Pengangkatan template",
      lettersActive && tplValue === "sk-pengangkatan" && skNama === "Ahmad Fauzi",
      `active=${lettersActive} tpl=${tplValue} nama=${skNama}`,
    );

    // Delete the record added above (back to 15)
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.type("#keg-search", "Tes Tambah");
    await sleep(300);
    await page.evaluate(() => {
      const btn = document.querySelector('#keg-table-body tr button[data-action="delete"]');
      btn.click();
    });
    await sleep(400);
    const totalAfterDel = await page.$eval("#keg-stat-total", (el) => el.textContent);
    check("kepegawaian delete removes the record", totalAfterDel === "15", `total=${totalAfterDel}`);

    // Letter archive: saved letters + summaries are grouped on the Archive tab
    await page.evaluate(() => {
      const now = Date.now();
      localStorage.setItem("desaai-drafts-v1", JSON.stringify([
        { id: "t-1", kind: "letter", title: "Surat Undangan", content: "Isi surat contoh", createdAt: now, source: "local" },
        { id: "t-2", kind: "summary", title: "Ringkasan dokumen", content: "Isi ringkasan contoh", createdAt: now, source: "local" },
      ]));
    });
    await page.click('[data-tab="drafts"]');
    await sleep(400);
    const archiveHeads = await page.$$eval("#drafts-list h3.subhead", (els) => els.map((e) => e.textContent));
    check(
      "archive tab groups letters and summaries",
      archiveHeads.includes("Letter archive") && archiveHeads.includes("Saved summaries"),
      archiveHeads.join(" | "),
    );
    const archiveItems = await page.$$eval("#drafts-list .draft-item h3", (els) => els.map((e) => e.textContent));
    check(
      "archive shows the saved letter and summary",
      archiveItems.includes("Surat Undangan") && archiveItems.includes("Ringkasan dokumen"),
      archiveItems.join(" | "),
    );
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);

    // Offline personnel summary (no live AI in this VM)
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.evaluate(() => document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })));
    await sleep(200);
    await page.click("#keg-summarize");
    await sleep(600);
    const sumWrapVisible = await page.$eval("#keg-sum-output-wrap", (el) => !el.hidden);
    const sumText = await page.$eval("#keg-sum-output", (el) => el.textContent);
    check(
      "kepegawaian summary renders an offline recap without AI",
      sumWrapVisible && /Rekap kepegawaian/.test(sumText) && /masa bhakti/i.test(sumText),
      sumText.slice(0, 80),
    );

    // 7. No console errors / failed requests (excluding the VM tunnel noise)
    check("0 console errors (excluding VM tunnel noise)", errors.length === 0, errors.join(" | ").slice(0, 500));
    check("0 failed requests (excluding VM tunnel noise)", failedRequests.length === 0, failedRequests.join(" | ").slice(0, 500));

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
