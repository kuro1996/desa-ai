// DesaAI — headless-Chrome UI test (puppeteer-core, system Chrome).
// Loads the built app (dist/) via file:// (this VM's Chrome build blocks
// http://127.0.0.1 navigations with Local Network Access checks; the Vite
// build uses relative asset paths so file:// works), exercises all feature
// flows end to end — letters, summarizer, Q&A (offline KB path), drafts,
// the Kepegawaian module (subdistrict + village scope), the IKM
// satisfaction survey, and the Pengaduan (complaints) module — and fails
// on ANY console error or failed request from the app itself.
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
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
    // Paket 9 — no false sync timestamp when Firebase is unreachable here.
    const lastSync = await page.evaluate(() => localStorage.getItem("desaai-last-sync-v1"));
    check("no sync timestamp recorded without a Firestore write", lastSync === null, String(lastSync));

    // 1a. Paket 12 — PWA shell: manifest linked, net chip online, worker
    // registration compiled into the bundle. (Live worker behavior —
    // register / offline reload / fresh shell — is covered by pwa-test.mjs:
    // file:// cannot host a service worker, and this VM's Chrome blocks
    // http://127.0.0.1 with Local Network Access checks, so no HTTP origin
    // is reachable from headless Chrome here. The live site is the real
    // proof — see docs/VERIFICATION.md.)
    const manifestHref = await page.$eval('link[rel="manifest"]', (el) => el.getAttribute("href") ?? "");
    check("manifest linked in index.html", manifestHref.endsWith("manifest.webmanifest"), manifestHref);
    const netChip = await page.evaluate(() => ({
      text: document.getElementById("net-chip")?.textContent ?? "",
      ok: document.getElementById("net-chip")?.classList.contains("chip-ok") ?? false,
    }));
    check("net chip shows Online while the network is up", netChip.text === "Online", netChip.text);
    check("net chip uses the ok style while online", netChip.ok, netChip.text);
    const bundleJs = readdirSync(join(DIST, "assets")).find((f) => f.endsWith(".js")) ?? "";
    const bundleSrc = readFileSync(join(DIST, "assets", bundleJs), "utf8");
    check(
      "bundle registers the service worker (./sw.js, http(s) only)",
      bundleSrc.includes("serviceWorker") && bundleSrc.includes("./sw.js"),
      bundleJs,
    );
    const manifest = JSON.parse(readFileSync(join(DIST, "manifest.webmanifest"), "utf8"));
    check(
      "dist manifest is a standalone PWA manifest (./ scope, 192 + 512 + maskable icons)",
      manifest.display === "standalone" && manifest.start_url === "./" && manifest.scope === "./" &&
        Array.isArray(manifest.icons) && manifest.icons.some((i) => i.sizes === "192x192") &&
        manifest.icons.some((i) => i.sizes === "512x512" && !i.purpose) &&
        manifest.icons.some((i) => i.purpose === "maskable"),
      `display=${manifest.display} start=${manifest.start_url} icons=${manifest.icons.length}`,
    );
    check(
      "dist ships sw.js + manifest + 3 PWA icons",
      ["sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png"]
        .every((f) => existsSync(join(DIST, f))),
    );

    // 1b. Home dashboard (bento) — Paket 5: default tab, live numbers
    const homeActive = await page.$eval('[data-tab="home"]', (el) => el.classList.contains("active"));
    const homeVisible = await page.$eval("#panel-home", (el) => !el.hidden);
    check("home dashboard is the default tab", homeActive && homeVisible, `active=${homeActive} visible=${homeVisible}`);
    const bento = await page.evaluate(() => ({
      ikm: document.getElementById("home-ikm-score")?.textContent ?? "",
      dashIkm: document.getElementById("ikm-score")?.textContent ?? "",
      cat: document.getElementById("home-ikm-cat")?.textContent ?? "",
      lettersToday: document.getElementById("home-letters-today")?.textContent ?? "",
      aduanBaru: document.getElementById("home-aduan-baru")?.textContent ?? "",
      monthIkm: document.getElementById("home-month-ikm")?.textContent ?? "",
      monthAduan: document.getElementById("home-month-aduan")?.textContent ?? "",
      monthLetters: document.getElementById("home-month-letters")?.textContent ?? "",
      monthName: document.getElementById("home-month-name")?.textContent ?? "",
      cards: document.querySelectorAll("#panel-home .bento-card").length,
    }));
    const monthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    check(
      "bento shows 12 cards with live numbers (IKM = dashboard, 0 letters today, 3 new complaints, 12 IKM + 6 complaints this month)",
      bento.cards === 12 && bento.ikm === bento.dashIkm && bento.cat.startsWith("A") &&
        bento.lettersToday === "0" && bento.aduanBaru === "3" &&
        bento.monthIkm === "12" && bento.monthAduan === "6" && bento.monthLetters === "0" &&
        bento.monthName === monthName,
      `cards=${bento.cards} ikm=${bento.ikm} cat=${bento.cat} lettersToday=${bento.lettersToday} aduanBaru=${bento.aduanBaru} month=${bento.monthName} ${bento.monthIkm}/${bento.monthAduan}/${bento.monthLetters}`,
    );
    // Bento masa-bhakti counts match the kepegawaian tab's live stats.
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    const kegStats = await page.evaluate(() => ({
      akan: document.getElementById("keg-stat-akanhabis")?.textContent ?? "",
      habis: document.getElementById("keg-stat-habis")?.textContent ?? "",
    }));
    await page.click('[data-tab="home"]');
    await sleep(300);
    const masa = await page.evaluate(() => ({
      akan: document.getElementById("home-masa-akan")?.textContent ?? "",
      habis: document.getElementById("home-masa-habis")?.textContent ?? "",
      items: document.querySelectorAll("#home-masa-list li").length,
    }));
    check(
      "bento masa-bhakti counts match kepegawaian stats",
      masa.akan === kegStats.akan && masa.habis === kegStats.habis && masa.items > 0,
      `bento ${masa.akan}/${masa.habis} vs keg ${kegStats.akan}/${kegStats.habis} items=${masa.items}`,
    );
    // Paket 6: dashboard lists the oldest unresolved complaints (waiting longest first).
    const homeAduan = await page.evaluate(() => ({
      items: document.querySelectorAll("#home-aduan-list li").length,
      first: document.querySelector("#home-aduan-list li")?.textContent ?? "",
    }));
    check(
      "home lists 3 oldest unresolved complaints with waiting time",
      homeAduan.items === 3 && /Biaya tidak sesuai/.test(homeAduan.first) && /waiting|menunggu/.test(homeAduan.first),
      `items=${homeAduan.items} first=${homeAduan.first.slice(0, 60)}`,
    );
    // Paket 10 — Briefing Pagi: date, summary counts, focus list, copy, nav.
    const briefing = await page.evaluate(() => ({
      visible:
        !document.getElementById("home-briefing").hidden &&
        getComputedStyle(document.getElementById("home-briefing")).display !== "none",
      date: document.getElementById("home-briefing-date")?.textContent ?? "",
      summary: document.getElementById("home-briefing-summary")?.textContent ?? "",
      focusItems: [...document.querySelectorAll("#home-briefing-focus li")].map(
        (li) => li.textContent ?? "",
      ),
      emptyHidden: document.getElementById("home-briefing-empty").hidden,
    }));
    const todayLong = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    check(
      "briefing card shows today's date + summary counts (3 new complaints, IKM 90)",
      briefing.visible &&
        briefing.date === todayLong &&
        /3 (pengaduan baru|new complaints)/.test(briefing.summary) &&
        /IKM 90/.test(briefing.summary),
      `date=${briefing.date} summary=${briefing.summary}`,
    );
    check(
      "briefing focus lists 1–3 items, oldest complaint first",
      briefing.focusItems.length >= 1 &&
        briefing.focusItems.length <= 3 &&
        /(Pengaduan tertua|Oldest complaint)/.test(briefing.focusItems[0]) &&
        briefing.emptyHidden,
      `items=${briefing.focusItems.length} first=${briefing.focusItems[0]?.slice(0, 60)}`,
    );
    // Clicking the first focus item opens the complaints tab.
    await page.evaluate(() => {
      document.querySelector("#home-briefing-focus li")?.click();
    });
    await sleep(300);
    const focusNav = await page.$eval('[data-tab="pengaduan"]', (el) =>
      el.classList.contains("active"),
    );
    check("briefing focus item navigates to the complaints tab", focusNav);
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Copy button reports a status (clipboard API or manual fallback).
    await page.click("#home-briefing-copy");
    await sleep(300);
    const briefingCopyStatus = await page.$eval("#home-briefing-status", (el) => el.textContent ?? "");
    check(
      "copy briefing reports a status (copied or manual fallback)",
      /Disalin|Copied|Salinan gagal|Copy failed/.test(briefingCopyStatus),
      briefingCopyStatus,
    );
    // Paket 6: printed monthly report carries an attention section.
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.click("#home-report-print");
    await sleep(200);
    const reportBody = await page.$eval("#report-print-body", (el) => el.textContent ?? "");
    check(
      "monthly print report lists open complaints + expiring terms under 'Perlu perhatian'",
      /Perlu perhatian/.test(reportBody) && /hari menunggu/.test(reportBody),
      reportBody.slice(0, 120),
    );
    // IKM trend chart: SVG line with one point per answer, last point = score.
    const trend = await page.evaluate(() => {
      const svg = document.querySelector("#home-ikm-trend svg");
      const circles = [...document.querySelectorAll("#home-ikm-trend circle")];
      const last = circles[circles.length - 1];
      return {
        hasSvg: !!svg,
        hasLine: !!document.querySelector("#home-ikm-trend polyline"),
        points: circles.length,
        lastScore: last ? Number(last.dataset.score ?? 0) : 0,
        dashScore: Number(document.getElementById("ikm-score")?.dataset.score ?? 0),
      };
    });
    check(
      "IKM trend chart renders with one point per answer",
      trend.hasSvg && trend.hasLine && trend.points === 12 &&
        Math.abs(trend.lastScore - trend.dashScore) < 0.01,
      `points=${trend.points} last=${trend.lastScore} dash=${trend.dashScore}`,
    );
    // Global search: officer found, complaint group found, empty state works.
    await page.type("#home-search", "Ahmad");
    await sleep(300);
    const searchAhmad = await page.$eval("#home-search-results", (el) => el.textContent);
    check(
      "global search finds an officer across modules",
      /Ahmad Fauzi/.test(searchAhmad) && /Kepegawaian|Personnel/.test(searchAhmad),
      searchAhmad.slice(0, 100),
    );
    await page.evaluate(() => {
      document.querySelector("#home-search-results .search-result")?.click();
    });
    await sleep(400);
    const searchNav = await page.evaluate(() => ({
      kegActive: document.querySelector('[data-tab="kepegawaian"]')?.classList.contains("active"),
      dialogOpen: document.getElementById("keg-detail").open,
      title: document.getElementById("keg-detail-title")?.textContent ?? "",
    }));
    check(
      "global search result opens the officer detail",
      searchNav.kegActive && searchNav.dialogOpen && /Ahmad Fauzi/.test(searchNav.title),
      `${searchNav.title} dialog=${searchNav.dialogOpen}`,
    );
    await page.evaluate(() => document.getElementById("keg-detail")?.close());
    await page.click('[data-tab="home"]');
    await sleep(300);
    await page.$eval("#home-search", (el) => { el.value = ""; });
    await page.type("#home-search", "Keterlambatan");
    await sleep(300);
    const searchAdu = await page.$eval("#home-search-results", (el) => el.textContent);
    check(
      "global search finds complaints by type",
      /Keterlambatan/.test(searchAdu) && /Pengaduan|Complaints/.test(searchAdu),
      searchAdu.slice(0, 100),
    );
    await page.$eval("#home-search", (el) => { el.value = ""; });
    await page.type("#home-search", "zzzznotfound");
    await sleep(300);
    const searchEmpty = await page.$eval("#home-search-results", (el) => el.textContent);
    check(
      "global search shows an empty state for no match",
      /Tidak ada hasil|No results/.test(searchEmpty),
      searchEmpty.slice(0, 60),
    );
    await page.$eval("#home-search", (el) => { el.value = ""; });
    await page.evaluate(() =>
      document.getElementById("home-search")?.dispatchEvent(new Event("input", { bubbles: true })),
    );
    await sleep(200);
    // Quick action: "Open the survey" jumps to the IKM tab.
    await page.click("#home-go-ikm");
    await sleep(300);
    const ikmActive = await page.$eval('[data-tab="ikm"]', (el) => el.classList.contains("active"));
    check("bento quick action opens the IKM tab", ikmActive);
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Monthly report: print fills the report area and calls window.print().
    await page.evaluate(() => {
      window.print = () => {
        window.__reportPrinted = true;
      };
    });
    await page.click("#home-report-print");
    await sleep(300);
    const reportPrint = await page.evaluate(() => ({
      printed: window.__reportPrinted === true,
      body: document.getElementById("report-print-body")?.textContent ?? "",
      title: document.getElementById("report-print-title")?.textContent ?? "",
      target: document.body.dataset.printTarget ?? "",
      status: document.getElementById("home-report-status")?.textContent ?? "",
    }));
    check(
      "monthly report print fills the report area and calls window.print()",
      reportPrint.printed && /Laporan Bulanan/.test(reportPrint.title) &&
        /IKM/.test(reportPrint.body) && reportPrint.target === "report",
      `printed=${reportPrint.printed} title=${reportPrint.title} target=${reportPrint.target}`,
    );
    // Paket 13: monthly report CSV export (local data only, works offline).
    const reportExportBtn = await page.$("#home-report-export");
    check("monthly report CSV export button exists", !!reportExportBtn);
    await page.evaluate(() => {
      window.__csvBlobs = [];
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        window.__csvBlobs.push(blob);
        return orig(blob);
      };
    });
    await page.click("#home-report-export");
    await sleep(300);
    const readLastCsv = () =>
      page.evaluate(async () => {
        const blobs = window.__csvBlobs ?? [];
        const last = blobs[blobs.length - 1];
        return last ? await last.text() : "";
      });
    const reportCsv = await readLastCsv();
    const reportStatus = await page.$eval("#home-report-status", (el) => el.textContent ?? "");
    const nowDate = new Date();
    const expectFile = `laporan-bulanan-${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}.csv`;
    check(
      "monthly report CSV has Indonesian header + all five sections",
      reportCsv.includes("Bagian,Metrik,Nilai") &&
        ["Surat,", "Agenda,", "IKM,", "Pengaduan,", "Kepegawaian,"].every((s) =>
          reportCsv.includes(s),
        ),
      reportCsv.split("\n").slice(0, 5).join(" | "),
    );
    // Agenda counts in the CSV match the register stored locally, computed
    // independently here from localStorage (robust across months).
    const agsStored = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      } catch {
        return [];
      }
    });
    const agsMonth = agsStored.filter((e) => {
      const d = new Date(e.tanggal);
      return (
        d.getFullYear() === nowDate.getFullYear() &&
        d.getMonth() === nowDate.getMonth()
      );
    });
    const csvAgsMasuk = agsMonth.filter((e) => e.arah === "masuk").length;
    const csvAgsKeluar = agsMonth.filter((e) => e.arah === "keluar").length;
    check(
      "monthly report CSV agenda counts match the local register",
      reportCsv.includes(`Agenda,Surat masuk bulan ini,${csvAgsMasuk}`) &&
        reportCsv.includes(`Agenda,Surat keluar bulan ini,${csvAgsKeluar}`),
      `masuk=${csvAgsMasuk} keluar=${csvAgsKeluar}`,
    );
    check(
      "monthly report CSV export reports the filename",
      reportStatus.includes(expectFile),
      reportStatus,
    );
    // Offline: the export still produces the same CSV with no network.
    await page.setOfflineMode(true);
    await page.click("#home-report-export");
    await sleep(300);
    const offlineCsv = await readLastCsv();
    await page.setOfflineMode(false);
    check(
      "monthly report CSV export works offline",
      offlineCsv.includes("Bagian,Metrik,Nilai") &&
        offlineCsv.includes("Agenda,Surat masuk bulan ini,"),
      offlineCsv.split("\n").slice(3, 4).join(""),
    );
    // Paket 14: Backup & Restore — one JSON file, all five collections.
    const backupCard = await page.$("#home-backup-card");
    check("backup card exists on the home dashboard", !!backupCard);
    const backupCountsText = await page.$eval(
      "#home-backup-counts",
      (el) => el.textContent ?? "",
    );
    check(
      "backup card shows live counts for all five collections",
      ["Letters", "Personnel", "IKM", "Complaints", "Register"].every((s) =>
        backupCountsText.includes(s),
      ),
      backupCountsText,
    );
    const readLastBlobText = () =>
      page.evaluate(async () => {
        const blobs = window.__csvBlobs ?? [];
        const last = blobs[blobs.length - 1];
        return last ? await last.text() : "";
      });
    const readLocalCollections = () =>
      page.evaluate(() => {
        const read = (key) => {
          try {
            return JSON.parse(localStorage.getItem(key) ?? "[]");
          } catch {
            return [];
          }
        };
        return {
          surat: read("desaai-drafts-v1"),
          pegawai: read("desaai-perangkat-v1"),
          ikm: read("desaai-ikm-v1"),
          pengaduan: read("desaai-pengaduan-v1"),
          agenda: read("desaai-agenda-v1"),
        };
      });
    await page.click("#home-backup-export");
    await sleep(300);
    const backupJson = await readLastBlobText();
    const backupExportStatus = await page.$eval(
      "#home-backup-status",
      (el) => el.textContent ?? "",
    );
    const backupNow = new Date();
    const expectBackupFile = `desaai-backup-${backupNow.getFullYear()}-${String(
      backupNow.getMonth() + 1,
    ).padStart(2, "0")}-${String(backupNow.getDate()).padStart(2, "0")}.json`;
    let backupParsed = null;
    try {
      backupParsed = JSON.parse(backupJson);
    } catch {
      backupParsed = null;
    }
    const groundTruth = await readLocalCollections();
    check(
      "backup export produces valid JSON with app + format version + date",
      !!backupParsed &&
        backupParsed.app === "desaai" &&
        backupParsed.formatVersion === 1 &&
        typeof backupParsed.exportedAt === "string" &&
        !Number.isNaN(Date.parse(backupParsed.exportedAt)),
      backupJson.slice(0, 120),
    );
    check(
      "backup contains all five collections with counts matching local data",
      !!backupParsed &&
        ["surat", "pegawai", "ikm", "pengaduan", "agenda"].every(
          (k) => Array.isArray(backupParsed.collections?.[k]),
        ) &&
        backupParsed.counts.surat === groundTruth.surat.length &&
        backupParsed.counts.pegawai === groundTruth.pegawai.length &&
        backupParsed.counts.ikm === groundTruth.ikm.length &&
        backupParsed.counts.pengaduan === groundTruth.pengaduan.length &&
        backupParsed.counts.agenda === groundTruth.agenda.length,
      backupParsed ? JSON.stringify(backupParsed.counts) : "unparsed",
    );
    check(
      "backup export reports the filename",
      backupExportStatus.includes(expectBackupFile),
      backupExportStatus,
    );
    // Restore a valid backup: mutate a copy with markers, confirm, verify
    // the data changed — then restore the original backup to leave the
    // seeded state intact for the later module tests.
    const tmpDir = "/tmp";
    const syntheticPath = join(tmpDir, "desaai-backup-synthetic-20261123.json");
    const originalPath = join(tmpDir, "desaai-backup-original-20261123.json");
    const corruptPath = join(tmpDir, "desaai-backup-corrupt-20261123.json");
    const wrongVersionPath = join(tmpDir, "desaai-backup-wrongver-20261123.json");
    const synthetic = JSON.parse(JSON.stringify(backupParsed));
    synthetic.collections.agenda[0] = {
      ...synthetic.collections.agenda[0],
      perihal: "RESTORE-TEST agenda",
    };
    synthetic.collections.pegawai[0] = {
      ...synthetic.collections.pegawai[0],
      nama: "RESTORE-TEST Pegawai",
    };
    synthetic.collections.ikm[0] = {
      ...synthetic.collections.ikm[0],
      komentar: "RESTORE-TEST komentar",
    };
    synthetic.collections.pengaduan[0] = {
      ...synthetic.collections.pengaduan[0],
      isi: "RESTORE-TEST aduan",
    };
    synthetic.collections.surat = [
      {
        id: "d-restore-test-1",
        kind: "letter",
        title: "RESTORE-TEST Surat",
        content: "Isi surat restore test.",
        createdAt: Date.now(),
        source: "local",
      },
    ];
    synthetic.counts.surat = 1;
    writeFileSync(syntheticPath, JSON.stringify(synthetic, null, 2));
    writeFileSync(originalPath, backupJson);
    const backupFileInput = await page.$("#home-backup-file");
    await backupFileInput.uploadFile(syntheticPath);
    await sleep(500);
    const confirmShown =
      (await page.$eval("#home-backup-confirm", (el) => !el.hidden)) &&
      (await page.$eval(
        "#home-backup-confirm-text",
        (el) => el.textContent ?? "",
      ));
    check(
      "restore shows a confirmation summary with the backup contents",
      !!confirmShown &&
        /Letters 1/.test(confirmShown) &&
        /Personnel 23/.test(confirmShown),
      confirmShown || "",
    );
    await page.click("#home-backup-confirm-yes");
    await sleep(800);
    const afterRestore = await readLocalCollections();
    const countsAfterRestore = await page.$eval(
      "#home-backup-counts",
      (el) => el.textContent ?? "",
    );
    check(
      "restore replaces data with the backup contents",
      afterRestore.agenda[0]?.perihal === "RESTORE-TEST agenda" &&
        afterRestore.pegawai[0]?.nama === "RESTORE-TEST Pegawai" &&
        afterRestore.ikm[0]?.komentar === "RESTORE-TEST komentar" &&
        afterRestore.pengaduan[0]?.isi === "RESTORE-TEST aduan" &&
        afterRestore.surat.length === 1 &&
        afterRestore.surat[0]?.title === "RESTORE-TEST Surat" &&
        /Letters 1/.test(countsAfterRestore),
      `agenda=${afterRestore.agenda[0]?.perihal} surat=${afterRestore.surat.length} counts=${countsAfterRestore}`,
    );
    await backupFileInput.uploadFile(originalPath);
    await sleep(500);
    await page.click("#home-backup-confirm-yes");
    await sleep(800);
    const afterRevert = await readLocalCollections();
    check(
      "restoring the original backup returns the seeded data",
      afterRevert.agenda[0]?.perihal !== "RESTORE-TEST agenda" &&
        afterRevert.pegawai[0]?.nama !== "RESTORE-TEST Pegawai" &&
        afterRevert.surat.length === groundTruth.surat.length &&
        afterRevert.agenda.length === groundTruth.agenda.length,
      `agenda=${afterRevert.agenda[0]?.perihal} surat=${afterRevert.surat.length}`,
    );
    // Corrupt file: rejected, data untouched, confirm panel stays hidden.
    writeFileSync(corruptPath, "this is not json {{{");
    await backupFileInput.uploadFile(corruptPath);
    await sleep(500);
    const corruptStatus = await page.$eval(
      "#home-backup-status",
      (el) => el.textContent ?? "",
    );
    const corruptConfirmHidden = await page.$eval(
      "#home-backup-confirm",
      (el) => el.hidden,
    );
    const agendaAfterCorrupt = await page.evaluate(
      () => JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]").length,
    );
    check(
      "corrupt backup file is rejected and data is unchanged",
      /invalid/i.test(corruptStatus) &&
        corruptConfirmHidden &&
        agendaAfterCorrupt === groundTruth.agenda.length,
      corruptStatus,
    );
    // Wrong format version: rejected, data untouched.
    writeFileSync(
      wrongVersionPath,
      JSON.stringify({ ...backupParsed, formatVersion: 99 }),
    );
    await backupFileInput.uploadFile(wrongVersionPath);
    await sleep(500);
    const wrongVerStatus = await page.$eval(
      "#home-backup-status",
      (el) => el.textContent ?? "",
    );
    const agendaAfterWrongVer = await page.evaluate(
      () => JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]").length,
    );
    check(
      "backup with unknown format version is rejected and data is unchanged",
      /invalid/i.test(wrongVerStatus) &&
        agendaAfterWrongVer === groundTruth.agenda.length,
      wrongVerStatus,
    );
    // Offline: backup export still produces a valid JSON file.
    await page.setOfflineMode(true);
    await page.click("#home-backup-export");
    await sleep(300);
    const offlineBackupJson = await readLastBlobText();
    await page.setOfflineMode(false);
    let offlineParsed = null;
    try {
      offlineParsed = JSON.parse(offlineBackupJson);
    } catch {
      offlineParsed = null;
    }
    check(
      "backup export works offline",
      !!offlineParsed &&
        offlineParsed.app === "desaai" &&
        offlineParsed.counts.agenda === groundTruth.agenda.length,
      offlineBackupJson.slice(0, 80),
    );
    // Dark mode: toggles, persists across reload, toggles back to light.
    await page.click("#theme-toggle");
    await sleep(300);
    const themeDark = await page.$eval("html", (el) => el.dataset.theme);
    const storedDark = await page.evaluate(() => localStorage.getItem("desaai-theme-v1"));
    check(
      "dark mode toggles on and is saved",
      themeDark === "dark" && storedDark === "dark",
      `theme=${themeDark} stored=${storedDark}`,
    );
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(1200);
    const themeAfterReload = await page.$eval("html", (el) => el.dataset.theme);
    check("dark mode persists across reload", themeAfterReload === "dark", `theme=${themeAfterReload}`);
    await page.click("#theme-toggle");
    await sleep(300);
    const themeLight = await page.$eval("html", (el) => el.dataset.theme);
    check("dark mode toggles back to light", themeLight === "light", `theme=${themeLight}`);
    // Deep link #beranda opens the home tab.
    await page.goto(`file://${join(DIST, "index.html")}#beranda`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    const berandaActive = await page.$eval('[data-tab="home"]', (el) => el.classList.contains("active"));
    check("deep link #beranda opens the home tab", berandaActive);

    // 2. Letters tab: fill form, generate (no live AI in this VM → config/AI message, no crash)
    await page.click('[data-tab="letters"]');
    await sleep(200);
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

    // Letter copy/download/print/save buttons exist and are wired (no-op without text is fine)
    const letterBtns = await page.$$eval(
      "#letter-copy, #letter-download, #letter-print, #letter-save",
      (els) => els.map((e) => e.id),
    );
    check("letter actions present", letterBtns.length === 4, letterBtns.join(","));

    // 2d. Print: the letter renders into a print-only area and calls window.print()
    await page.evaluate(() => {
      window.print = () => {
        window.__printed = true;
      };
      const out = document.getElementById("letter-output");
      out.value =
        "SURAT UNDANGAN\n\nDengan hormat, warga diundang musyawarah desa.";
      document.getElementById("letter-output-wrap").hidden = false;
    });
    await page.click("#letter-print");
    await sleep(300);
    const printOk = await page.evaluate(() => ({
      printed: window.__printed === true,
      body: document.getElementById("letter-print-body")?.textContent ?? "",
      title: document.getElementById("letter-print-title")?.textContent ?? "",
    }));
    check(
      "letter print fills the print area and calls window.print()",
      printOk.printed && /musyawarah desa/i.test(printOk.body) && printOk.title.length > 0,
      `printed=${printOk.printed} title=${printOk.title}`,
    );
    // The built CSS carries a real print stylesheet (checked on disk).
    const cssFiles = readdirSync(join(DIST, "assets")).filter((f) => f.endsWith(".css"));
    const cssText = cssFiles
      .map((f) => readFileSync(join(DIST, "assets", f), "utf8"))
      .join("\n");
    check(
      "print stylesheet hides the app chrome and shows only the letter",
      /@media print/.test(cssText) &&
        /letter-print-area/.test(cssText) &&
        /visibility:\s*hidden/.test(cssText),
      cssFiles.join(","),
    );

    // 2b. SK Pengangkatan template exists (kepegawaian integration)
    const tplOptions = await page.$$eval("#letter-template option", (els) => els.map((e) => e.value));
    check(
      "SK Pengangkatan template present",
      tplOptions.includes("sk-pengangkatan"),
      tplOptions.join(","),
    );
    // Paket 6: SKTM template exists with its own fields.
    check(
      "SKTM template present",
      tplOptions.includes("sktm"),
      tplOptions.join(","),
    );
    await page.select("#letter-template", "sktm");
    await sleep(200);
    const sktmFields = await page.$$eval("#letter-fields input, #letter-fields textarea", (els) => els.length);
    check("SKTM template renders 8 fields", sktmFields === 8, `${sktmFields} fields`);

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
        const masa = tr.children[8]?.textContent ?? "";
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
    check("kepegawaian seeds 23 demo records (8 kecamatan + 15 desa)", kegCounts.total === 23 && kegCounts.rows === 23, `total=${kegCounts.total} rows=${kegCounts.rows}`);
    check("kepegawaian covers 10 villages", kegCounts.desa === 10, `desa=${kegCounts.desa}`);
    check(
      "kepegawaian stats match masa bhakti dates",
      kegCounts.aktif === kegCounts.calcAktif &&
        kegCounts.akanHabis === kegCounts.calcAkanHabis &&
        kegCounts.habis === kegCounts.calcHabis &&
        kegCounts.aktif + kegCounts.akanHabis + kegCounts.habis === 23,
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
      /required/i.test(emptyStatus) && totalAfterEmpty === "23",
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
      /16 digits/i.test(nikStatus) && totalAfterNik === "23",
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
      /after the term start/i.test(dateStatus) && totalAfterDate === "23",
      `status=${dateStatus} total=${totalAfterDate}`,
    );
    await page.$eval("#keg-in-selesai", (el) => { el.value = "2027-12-31"; });
    await page.click("#keg-add");
    await sleep(400);
    const totalAfterAdd = await page.$eval("#keg-stat-total", (el) => el.textContent);
    const formStatus = await page.$eval("#keg-form-status", (el) => el.textContent);
    check("kepegawaian add form saves a record", totalAfterAdd === "24", `total=${totalAfterAdd} status=${formStatus}`);

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
    // (desa 1 habis + kecamatan 2 habis = 3; desa 2 akan-habis + kecamatan 2 = 4)
    await page.select("#keg-filter-status", "habis");
    await sleep(300);
    const habisRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian status filter shows expired terms", habisRows === 3, `${habisRows} rows`);
    await page.select("#keg-filter-status", "akan-habis");
    await sleep(300);
    const akanRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian status filter shows expiring terms", akanRows === 4, `${akanRows} rows`);
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
    check("kepegawaian delete removes the record", totalAfterDel === "23", `total=${totalAfterDel}`);

    // 6c. Officer detail dialog
    await page.$eval("#keg-search", (el) => {
      el.value = "";
    });
    await page.evaluate(() =>
      document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })),
    );
    await sleep(300);
    await page.evaluate(() => {
      document.querySelector('#keg-table-body tr button[data-action="detail"]')?.click();
    });
    await sleep(300);
    const kegDetail = await page.evaluate(() => ({
      open: document.getElementById("keg-detail").open,
      title: document.getElementById("keg-detail-title")?.textContent ?? "",
      text: document.getElementById("keg-detail-body")?.textContent ?? "",
    }));
    check(
      "kepegawaian detail dialog shows the officer record",
      kegDetail.open && /Ahmad Fauzi/.test(kegDetail.title) && /Masa bhakti/.test(kegDetail.text),
      `${kegDetail.title} | ${kegDetail.text.slice(0, 60)}`,
    );
    await page.evaluate(() => document.getElementById("keg-detail")?.close());

    // 6b. Unit dimension: kecamatan vs desa
    const unitStats = await page.evaluate(() => {
      const num = (id) => Number(document.getElementById(id)?.textContent ?? 0);
      return {
        kecTotal: num("keg-unit-kec-total"),
        kecAktif: num("keg-unit-kec-aktif"),
        kecAkan: num("keg-unit-kec-akanhabis"),
        kecHabis: num("keg-unit-kec-habis"),
        desaTotal: num("keg-unit-desa-total"),
        desaAktif: num("keg-unit-desa-aktif"),
        desaAkan: num("keg-unit-desa-akanhabis"),
        desaHabis: num("keg-unit-desa-habis"),
      };
    });
    check(
      "kepegawaian per-unit stats (kecamatan 8, desa 15)",
      unitStats.kecTotal === 8 && unitStats.desaTotal === 15,
      `kec=${unitStats.kecTotal} desa=${unitStats.desaTotal}`,
    );
    check(
      "kepegawaian per-unit status breakdown",
      unitStats.kecAktif === 4 && unitStats.kecAkan === 2 && unitStats.kecHabis === 2 &&
        unitStats.desaAktif === 12 && unitStats.desaAkan === 2 && unitStats.desaHabis === 1,
      `kec ${unitStats.kecAktif}/${unitStats.kecAkan}/${unitStats.kecHabis} desa ${unitStats.desaAktif}/${unitStats.desaAkan}/${unitStats.desaHabis}`,
    );
    // (The search box still holds "Tes Tambah" from the delete check above —
    // clear it first so the unit filter is measured on its own.)
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.evaluate(() => document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })));
    await sleep(200);
    await page.select("#keg-filter-unit", "kecamatan");
    await sleep(300);
    const kecRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian unit filter shows kecamatan staff", kecRows === 8, `${kecRows} rows`);
    await page.select("#keg-filter-unit", "desa");
    await sleep(300);
    const desaRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check("kepegawaian unit filter shows village officers", desaRows === 15, `${desaRows} rows`);
    await page.select("#keg-filter-unit", "");
    await sleep(200);
    const notifText = await page.$eval("#keg-notif-list", (el) => el.textContent);
    check(
      "kepegawaian notifications cover kecamatan staff",
      /Andi Wijaya|Rizky Ramadhan|Agus Setiawan|Dewi Lestari/.test(notifText),
      notifText.slice(0, 120),
    );
    // Form: unit switch changes the position options
    await page.select("#keg-in-unit", "kecamatan");
    await sleep(300);
    const kecJabOptions = await page.$$eval("#keg-in-jabatan option", (els) => els.map((e) => e.value));
    check(
      "kepegawaian form shows kecamatan positions for unit Kecamatan",
      kecJabOptions.includes("Camat") && !kecJabOptions.includes("Kepala Desa"),
      kecJabOptions.join(","),
    );
    const kecDesaDisabled = await page.$eval("#keg-in-desa", (el) => el.disabled);
    const kecDesaValue = await page.$eval("#keg-in-desa", (el) => el.value);
    check(
      "kepegawaian form locks village to Kecamatan Simpangkatis for unit Kecamatan",
      kecDesaDisabled && kecDesaValue === "Kecamatan Simpangkatis",
      `disabled=${kecDesaDisabled} value=${kecDesaValue}`,
    );
    await page.select("#keg-in-unit", "desa");
    await sleep(300);
    const desaJabOptions = await page.$$eval("#keg-in-jabatan option", (els) => els.map((e) => e.value));
    check(
      "kepegawaian form shows village positions for unit Desa",
      desaJabOptions.includes("Kepala Desa") && !desaJabOptions.includes("Camat"),
      desaJabOptions.join(","),
    );
    // Add a kecamatan record, then delete it again
    await page.select("#keg-in-unit", "kecamatan");
    await sleep(300);
    await page.type("#keg-in-nama", "Tes Kecamatan");
    await page.type("#keg-in-tempat", "Pangkalpinang");
    await page.type("#keg-in-nik", "1901010101010099");
    await page.select("#keg-in-agama", "Islam");
    await page.select("#keg-in-jabatan", "Staf Kecamatan");
    await page.$eval("#keg-in-tgl", (el) => { el.value = "1992-05-10"; });
    await page.$eval("#keg-in-mulai", (el) => { el.value = "2025-01-01"; });
    await page.$eval("#keg-in-selesai", (el) => { el.value = "2027-12-31"; });
    await page.click("#keg-add");
    await sleep(400);
    const totalAfterKecAdd = await page.$eval("#keg-stat-total", (el) => el.textContent);
    const kecTotalAfterAdd = await page.$eval("#keg-unit-kec-total", (el) => el.textContent);
    check(
      "kepegawaian add form saves a kecamatan record",
      totalAfterKecAdd === "24" && kecTotalAfterAdd === "9",
      `total=${totalAfterKecAdd} kec=${kecTotalAfterAdd}`,
    );
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.type("#keg-search", "Tes Kecamatan");
    await sleep(300);
    await page.evaluate(() => {
      const btn = document.querySelector('#keg-table-body tr button[data-action="delete"]');
      btn.click();
    });
    await sleep(400);
    const totalAfterKecDel = await page.$eval("#keg-stat-total", (el) => el.textContent);
    const kecTotalAfterDel = await page.$eval("#keg-unit-kec-total", (el) => el.textContent);
    check(
      "kepegawaian delete removes the kecamatan record",
      totalAfterKecDel === "23" && kecTotalAfterDel === "8",
      `total=${totalAfterKecDel} kec=${kecTotalAfterDel}`,
    );
    // "Buat SK" works for a kecamatan record too
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.type("#keg-search", "Rizky Ramadhan");
    await sleep(300);
    await page.evaluate(() => {
      const btn = document.querySelector('#keg-table-body tr button[data-action="sk"]');
      btn.click();
    });
    await sleep(400);
    const skKecNama = await page.$eval("#letter-field-nama", (el) => el.value);
    const skKecJab = await page.$eval("#letter-field-jabatan", (el) => el.value);
    check(
      "Buat SK prefills a kecamatan record",
      skKecNama === "Rizky Ramadhan" && skKecJab === "Kepala Seksi Pelayanan",
      `nama=${skKecNama} jabatan=${skKecJab}`,
    );
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.evaluate(() => document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })));
    await sleep(200);

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

    // 5b. Drafts search + delete + data backup export
    await page.type("#drafts-search", "Undangan");
    await sleep(400);
    const searchItems = await page.$$eval("#drafts-list .draft-item h3", (els) =>
      els.map((e) => e.textContent),
    );
    check(
      "drafts search filters by title",
      searchItems.length === 1 && searchItems[0] === "Surat Undangan",
      searchItems.join(" | "),
    );
    await page.$eval("#drafts-search", (el) => {
      el.value = "";
    });
    await page.evaluate(() =>
      document.getElementById("drafts-search")?.dispatchEvent(new Event("input", { bubbles: true })),
    );
    await sleep(400);
    const allDraftItems = await page.$$eval("#drafts-list .draft-item h3", (els) => els.length);
    check("clearing drafts search shows all drafts", allDraftItems === 2, `${allDraftItems} items`);
    await page.click("#backup-export");
    await sleep(300);
    const backupStatus = await page.$eval("#drafts-status", (el) => el.textContent);
    check("backup export reports the download", /downloaded/i.test(backupStatus), backupStatus);
    await page.evaluate(() => {
      const items = [...document.querySelectorAll("#drafts-list .draft-item")];
      const target = items.find(
        (d) => d.querySelector("h3")?.textContent === "Ringkasan dokumen",
      );
      const btns = [...(target?.querySelectorAll(".actions .btn") ?? [])];
      btns.find((b) => b.textContent.trim() === "Delete")?.click();
    });
    await sleep(500);
    const afterDelete = await page.$$eval("#drafts-list .draft-item h3", (els) =>
      els.map((e) => e.textContent),
    );
    const deleteStatus = await page.$eval("#drafts-status", (el) => el.textContent);
    check(
      "drafts delete removes the draft",
      afterDelete.length === 1 && afterDelete[0] === "Surat Undangan" && /deleted/i.test(deleteStatus),
      `${afterDelete.join(" | ")} status=${deleteStatus}`,
    );

    const rateBtn = await page.$(".draft-item .rate-btn");
    check("archive letter item has a rate-this-service link", rateBtn !== null);
    if (rateBtn) {
      await page.evaluate(() => {
        document.querySelector(".draft-item .rate-btn").click();
      });
      await sleep(400);
      const ikmVisibleAfterRate = await page.$eval("#panel-ikm", (el) => !el.hidden);
      check("rate link opens the IKM tab", ikmVisibleAfterRate);
    }
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);

    // Offline personnel summary (no live AI in this VM)
    await page.$eval("#keg-search", (el) => { el.value = ""; });
    await page.evaluate(() => document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })));
    await sleep(200);
    await page.click("#keg-summarize");
    // The AI path may take a while to fail in this VM; wait for the recap
    // text instead of a fixed sleep (was flaky at 600 ms).
    await page
      .waitForFunction(
        () =>
          /Rekap kepegawaian/.test(
            document.getElementById("keg-sum-output")?.textContent ?? "",
          ),
        { timeout: 30000 },
      )
      .catch(() => {});
    const sumWrapVisible = await page.$eval("#keg-sum-output-wrap", (el) => !el.hidden);
    const sumText = await page.$eval("#keg-sum-output", (el) => el.textContent);
    check(
      "kepegawaian summary renders an offline recap without AI",
      sumWrapVisible && /Rekap kepegawaian/.test(sumText) && /masa bhakti/i.test(sumText),
      sumText.slice(0, 80),
    );

    // 7. IKM tab (PermenPAN-RB No. 14/2017 — 9 elements, scale 1-4)
    await page.click('[data-tab="ikm"]');
    await sleep(400);
    const ikmVisible = await page.$eval("#panel-ikm", (el) => !el.hidden);
    check("ikm tab opens", ikmVisible);
    const ikmNote = await page.$eval("#ikm-demo-note", (el) => el.textContent);
    check(
      "ikm shows clear SAMPLE DATA label",
      /contoh|sample/i.test(ikmNote) && /bukan data asli|not real data/i.test(ikmNote),
      ikmNote.slice(0, 80),
    );
    const ikmDash = await page.evaluate(() => {
      const avgs = [...document.querySelectorAll("#ikm-bars .ikm-bar-value")].map((el) =>
        Number(el.dataset.avg ?? 0),
      );
      const score = Number(document.getElementById("ikm-score")?.dataset.score ?? 0);
      const count = Number(
        (document.getElementById("ikm-count")?.textContent ?? "0").replace(/\D/g, ""),
      );
      const cat = document.getElementById("ikm-category")?.textContent ?? "";
      return { avgs, score, count, cat };
    });
    check("ikm dashboard shows 12 sample respondents", ikmDash.count === 12 && ikmDash.avgs.length === 9, `count=${ikmDash.count} bars=${ikmDash.avgs.length}`);
    const ikmMean = ikmDash.avgs.reduce((a, b) => a + b, 0) / 9;
    check(
      "ikm score = mean per element x 25",
      Math.abs(ikmDash.score - ikmMean * 25) < 0.05,
      `score=${ikmDash.score} mean=${ikmMean.toFixed(4)} expected=${(ikmMean * 25).toFixed(2)}`,
    );
    const ikmCatOk =
      (ikmDash.score >= 88.31 && ikmDash.cat.startsWith("A")) ||
      (ikmDash.score >= 76.61 && ikmDash.cat.startsWith("B")) ||
      (ikmDash.score >= 65 && ikmDash.cat.startsWith("C")) ||
      (ikmDash.score < 65 && ikmDash.cat.startsWith("D"));
    check("ikm category matches the score band", ikmCatOk, `score=${ikmDash.score} cat=${ikmDash.cat}`);
    const ikmShareBtns = await page.$$eval("#ikm-share-survey, #ikm-share-results", (els) => els.map((e) => e.id));
    check("ikm share buttons exist", ikmShareBtns.length === 2, ikmShareBtns.join(","));
    await page.click("#ikm-share-survey");
    await sleep(400);
    const shareStatus = await page.$eval("#ikm-share-status", (el) => el.textContent);
    const shareOutVisible = await page.$eval("#ikm-share-output-wrap", (el) => !el.hidden);
    const shareOutText = await page.$eval("#ikm-share-output", (el) => el.value);
    check(
      "ikm share survey copies or shows the share text",
      /disalin|dibagikan|salin|copied/i.test(shareStatus) ||
        (shareOutVisible && /IKM|Survei/i.test(shareOutText)),
      `status=${shareStatus} output=${shareOutText.slice(0, 60)}`,
    );
    // Submit a full survey (all 4s) — count rises and the formula still holds
    const fillIkm = async (value) => {
      await page.evaluate((v) => {
        for (let i = 0; i < 9; i += 1) {
          document.querySelector(`input[name="ikm-q${i}"][value="${v}"]`).click();
        }
      }, value);
    };
    await fillIkm(4);
    await page.select("#ikm-in-surat", "undangan");
    await page.click("#ikm-submit");
    await sleep(400);
    const ikmAfter = await page.evaluate(() => {
      const avgs = [...document.querySelectorAll("#ikm-bars .ikm-bar-value")].map((el) =>
        Number(el.dataset.avg ?? 0),
      );
      const score = Number(document.getElementById("ikm-score")?.dataset.score ?? 0);
      const count = Number(
        (document.getElementById("ikm-count")?.textContent ?? "0").replace(/\D/g, ""),
      );
      return { avgs, score, count };
    });
    const ikmMeanAfter = ikmAfter.avgs.reduce((a, b) => a + b, 0) / 9;
    check(
      "ikm submit adds a response and keeps the formula",
      ikmAfter.count === 13 && Math.abs(ikmAfter.score - ikmMeanAfter * 25) < 0.05,
      `count=${ikmAfter.count} score=${ikmAfter.score}`,
    );
    // Exact endpoints: all 4s -> 100 (A); all 1s -> 25 (D), from a clean state
    const resetIkm = async () => {
      await page.evaluate(() => {
        localStorage.setItem("desaai-ikm-v1", "[]");
        localStorage.setItem("desaai-ikm-meta-v1", JSON.stringify({ seeded: true }));
      });
      await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
      await sleep(1200);
      await page.click('[data-tab="ikm"]');
      await sleep(400);
    };
    await resetIkm();
    const ikmEmpty = await page.$eval("#ikm-count", (el) => el.textContent);
    check("ikm can start from zero respondents", /0/.test(ikmEmpty), ikmEmpty);
    await fillIkm(4);
    await page.select("#ikm-in-surat", "pengantar");
    await page.click("#ikm-submit");
    await sleep(400);
    const ikmAll4 = await page.evaluate(() => ({
      score: Number(document.getElementById("ikm-score")?.dataset.score ?? 0),
      cat: document.getElementById("ikm-category")?.textContent ?? "",
    }));
    check("ikm all-4 survey scores 100, category A", ikmAll4.score === 100 && ikmAll4.cat.startsWith("A"), `score=${ikmAll4.score} cat=${ikmAll4.cat}`);
    await resetIkm();
    await fillIkm(1);
    await page.select("#ikm-in-surat", "keterangan");
    await page.click("#ikm-submit");
    await sleep(400);
    const ikmAll1 = await page.evaluate(() => ({
      score: Number(document.getElementById("ikm-score")?.dataset.score ?? 0),
      cat: document.getElementById("ikm-category")?.textContent ?? "",
    }));
    check("ikm all-1 survey scores 25, category D", ikmAll1.score === 25 && ikmAll1.cat.startsWith("D"), `score=${ikmAll1.score} cat=${ikmAll1.cat}`);
    // 7b. Per-element chart bands + CSV export
    const ikmBands = await page.$$eval("#ikm-bars .ikm-fill", (els) =>
      els.map((e) => e.dataset.band),
    );
    check(
      "ikm chart fills carry a readability band",
      ikmBands.length === 9 && ikmBands.every((b) => ["good", "mid", "low"].includes(b)),
      ikmBands.join(","),
    );
    await page.click("#ikm-export");
    await sleep(300);
    const ikmExpStatus = await page.$eval("#ikm-share-status", (el) => el.textContent);
    check("ikm export reports the CSV download", /downloaded/i.test(ikmExpStatus), ikmExpStatus);
    // Link from IKM to Pengaduan
    await page.click("#ikm-to-pengaduan");
    await sleep(400);
    const aduVisibleAfterLink = await page.$eval("#panel-pengaduan", (el) => !el.hidden);
    check("ikm links to the pengaduan tab", aduVisibleAfterLink);

    // 8. Pengaduan tab
    const aduVisible = await page.$eval("#panel-pengaduan", (el) => !el.hidden);
    check("pengaduan tab opens", aduVisible);
    const aduNote = await page.$eval("#adu-demo-note", (el) => el.textContent);
    check(
      "pengaduan shows clear SAMPLE DATA label",
      /contoh|sample/i.test(aduNote) && /bukan data asli|not real data/i.test(aduNote),
      aduNote.slice(0, 80),
    );
    const aduStats = await page.evaluate(() => ({
      baru: Number(document.getElementById("adu-stat-baru")?.textContent ?? 0),
      diproses: Number(document.getElementById("adu-stat-diproses")?.textContent ?? 0),
      selesai: Number(document.getElementById("adu-stat-selesai")?.textContent ?? 0),
      items: document.querySelectorAll("#adu-list .aduan-item").length,
    }));
    check(
      "pengaduan seeds 6 demo complaints (3 baru, 2 diproses, 1 selesai)",
      aduStats.items === 6 && aduStats.baru === 3 && aduStats.diproses === 2 && aduStats.selesai === 1,
      `items=${aduStats.items} baru=${aduStats.baru} diproses=${aduStats.diproses} selesai=${aduStats.selesai}`,
    );
    await page.click("#adu-submit");
    await sleep(300);
    const aduEmptyStatus = await page.$eval("#adu-form-status", (el) => el.textContent);
    const aduCountAfterEmpty = await page.$eval("#adu-count", (el) => el.textContent);
    check(
      "pengaduan form rejects an empty submit",
      /wajib|describe/i.test(aduEmptyStatus) && /6/.test(aduCountAfterEmpty),
      `status=${aduEmptyStatus} count=${aduCountAfterEmpty}`,
    );
    await page.select("#adu-in-jenis", "Keterlambatan");
    await page.select("#adu-in-surat", "pengantar");
    await page.type("#adu-in-isi", "Surat pengantar saya tertunda tiga hari.");
    await page.click("#adu-submit");
    await sleep(400);
    const aduAfterAdd = await page.evaluate(() => ({
      baru: Number(document.getElementById("adu-stat-baru")?.textContent ?? 0),
      items: document.querySelectorAll("#adu-list .aduan-item").length,
      firstText: document.querySelector("#adu-list .aduan-item")?.textContent ?? "",
    }));
    check(
      "pengaduan submit adds a complaint",
      aduAfterAdd.items === 7 && aduAfterAdd.baru === 4 && /tertunda tiga hari/.test(aduAfterAdd.firstText),
      `items=${aduAfterAdd.items} baru=${aduAfterAdd.baru}`,
    );
    await page.select("#adu-list .aduan-item:first-child .aduan-status", "selesai");
    await sleep(400);
    const aduAfterStatus = await page.evaluate(() => ({
      baru: Number(document.getElementById("adu-stat-baru")?.textContent ?? 0),
      selesai: Number(document.getElementById("adu-stat-selesai")?.textContent ?? 0),
    }));
    check(
      "pengaduan status change updates the stats",
      aduAfterStatus.baru === 3 && aduAfterStatus.selesai === 2,
      `baru=${aduAfterStatus.baru} selesai=${aduAfterStatus.selesai}`,
    );
    await page.select("#adu-filter-status", "selesai");
    await sleep(300);
    const selesaiItems = await page.$$eval("#adu-list .aduan-item", (els) => els.length);
    check("pengaduan status filter shows done complaints", selesaiItems === 2, `${selesaiItems} items`);
    await page.select("#adu-filter-status", "baru");
    await sleep(300);
    const baruItems = await page.$$eval("#adu-list .aduan-item", (els) => els.length);
    check("pengaduan status filter shows new complaints", baruItems === 3, `${baruItems} items`);
    await page.select("#adu-filter-status", "");
    await sleep(200);
    // Paket 6: CSV export reports success.
    await page.click("#adu-export");
    await sleep(200);
    const aduExportStatus = await page.$eval("#adu-export-status", (el) => el.textContent ?? "");
    check(
      "pengaduan CSV export reports success",
      /diekspor|exported/i.test(aduExportStatus),
      `status=${aduExportStatus}`,
    );

    // 8b. Complaint type filter + detail dialog
    await page.select("#adu-filter-jenis", "Keterlambatan");
    await sleep(300);
    const keterItems = await page.$$eval("#adu-list .aduan-item", (els) => els.length);
    check("pengaduan type filter shows delay complaints", keterItems === 3, `${keterItems} items`);
    await page.evaluate(() => {
      document.querySelector("#adu-list .aduan-item .actions .btn")?.click();
    });
    await sleep(300);
    const aduDetail = await page.evaluate(() => ({
      open: document.getElementById("adu-detail").open,
      isi: document.getElementById("adu-detail-isi")?.textContent ?? "",
      body: document.getElementById("adu-detail-body")?.textContent ?? "",
    }));
    check(
      "pengaduan detail dialog shows the complaint",
      aduDetail.open && aduDetail.isi.length > 10 && /Keterlambatan/.test(aduDetail.body),
      aduDetail.isi.slice(0, 60),
    );
    await page.evaluate(() => document.getElementById("adu-detail")?.close());
    await page.select("#adu-filter-jenis", "");
    await sleep(200);

    // 8c. Buku Agenda Surat (Paket 11): seeds, auto-number, filters, CSV, delete
    await page.click('[data-tab="agenda"]');
    await sleep(300);
    const agsVisible = await page.$eval("#panel-agenda", (el) => !el.hidden);
    check("agenda tab opens", agsVisible);
    const agsNote = await page.$eval("#agenda-demo-note", (el) => el.textContent);
    check(
      "agenda shows clear SAMPLE DATA label",
      /contoh|sample/i.test(agsNote) && /bukan data asli|not real data/i.test(agsNote),
      agsNote.slice(0, 80),
    );
    const agsStats = await page.evaluate(() => ({
      masuk: Number(document.getElementById("agenda-stat-masuk")?.textContent ?? 0),
      keluar: Number(document.getElementById("agenda-stat-keluar")?.textContent ?? 0),
      belum: Number(document.getElementById("agenda-stat-belum")?.textContent ?? 0),
      items: document.querySelectorAll("#agenda-list .aduan-item").length,
    }));
    check(
      "agenda seeds 4 demo entries (2 masuk, 2 keluar, 2 need follow-up)",
      agsStats.items === 4 && agsStats.masuk === 2 && agsStats.keluar === 2 && agsStats.belum === 2,
      `items=${agsStats.items} masuk=${agsStats.masuk} keluar=${agsStats.keluar} belum=${agsStats.belum}`,
    );
    await page.click("#agenda-submit");
    await sleep(300);
    const agsEmptyStatus = await page.$eval("#agenda-form-status", (el) => el.textContent);
    const agsCountAfterEmpty = await page.$eval("#agenda-count", (el) => el.textContent);
    check(
      "agenda form rejects an empty submit",
      /Isi pengirim|fill in/i.test(agsEmptyStatus) && /4/.test(agsCountAfterEmpty),
      `status=${agsEmptyStatus} count=${agsCountAfterEmpty}`,
    );
    const agsYear = new Date().getFullYear();
    await page.select("#agenda-in-arah", "masuk");
    await page.type("#agenda-in-nomor", "123/DS-BRS/XI/2026");
    await page.type("#agenda-in-pihak", "Desa Beruas");
    await page.type("#agenda-in-perihal", "Permohonan data warga pindah");
    await page.click("#agenda-submit");
    await sleep(400);
    const agsAfterAdd = await page.evaluate(() => ({
      masuk: Number(document.getElementById("agenda-stat-masuk")?.textContent ?? 0),
      belum: Number(document.getElementById("agenda-stat-belum")?.textContent ?? 0),
      items: document.querySelectorAll("#agenda-list .aduan-item").length,
      firstText: document.querySelector("#agenda-list .aduan-item")?.textContent ?? "",
    }));
    check(
      "agenda submit adds an entry with the next auto number",
      agsAfterAdd.items === 5 && agsAfterAdd.masuk === 3 && agsAfterAdd.belum === 3 &&
        new RegExp(`005/AGS/${agsYear}`).test(agsAfterAdd.firstText) &&
        /Permohonan data warga pindah/.test(agsAfterAdd.firstText),
      `items=${agsAfterAdd.items} masuk=${agsAfterAdd.masuk} belum=${agsAfterAdd.belum}`,
    );
    await page.select("#agenda-filter-arah", "keluar");
    await sleep(300);
    const agsKeluar = await page.$$eval("#agenda-list .aduan-item", (els) => els.length);
    check("agenda direction filter shows outgoing letters", agsKeluar === 2, `${agsKeluar} items`);
    await page.select("#agenda-filter-arah", "");
    await sleep(200);
    await page.select("#agenda-list .aduan-item:first-child .aduan-status", "selesai");
    await sleep(400);
    const agsAfterStatus = await page.evaluate(() => ({
      belum: Number(document.getElementById("agenda-stat-belum")?.textContent ?? 0),
    }));
    check("agenda status change updates the follow-up count", agsAfterStatus.belum === 2, `belum=${agsAfterStatus.belum}`);
    await page.click("#agenda-export");
    await sleep(200);
    const agsExportStatus = await page.$eval("#agenda-export-status", (el) => el.textContent ?? "");
    check(
      "agenda CSV export reports success",
      /diekspor|exported/i.test(agsExportStatus),
      `status=${agsExportStatus}`,
    );
    await page.evaluate(() => {
      document.querySelector("#agenda-list .aduan-item .actions .btn")?.click();
    });
    await sleep(400);
    const agsAfterDelete = await page.$$eval("#agenda-list .aduan-item", (els) => els.length);
    check("agenda delete removes the entry", agsAfterDelete === 4, `${agsAfterDelete} items`);
    // Global search finds agenda entries by subject.
    await page.click('[data-tab="home"]');
    await sleep(300);
    await page.$eval("#home-search", (el) => { el.value = ""; });
    await page.type("#home-search", "BOS 2026");
    await sleep(300);
    const searchAgs = await page.$eval("#home-search-results", (el) => el.textContent);
    check(
      "global search finds mail-register entries by subject",
      /Undangan sosialisasi BOS 2026/.test(searchAgs) && /Agenda surat|Mail register/.test(searchAgs),
      searchAgs.slice(0, 120),
    );
    await page.$eval("#home-search", (el) => { el.value = ""; });

    // 9. Modern layout: no horizontal overflow at phone width; all 7 tabs work
    await page.setViewport({ width: 390, height: 844 });
    await sleep(400);
    const overflow = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("body *").forEach((el) => {
        // Tables and the tab bar scroll horizontally by design — their
        // off-screen children are not page overflow.
        if (el.closest(".table-wrap") || el.closest(".tabs")) return;
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1 || r.left < -1) {
          bad.push(`${el.tagName}#${el.id || ""} right=${Math.round(r.right)}`);
        }
      });
      return {
        docScroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        bad: bad.slice(0, 5),
      };
    });
    check(
      "no horizontal overflow at phone width (390px)",
      overflow.docScroll <= overflow.inner + 1 && overflow.bad.length === 0,
      `scrollWidth=${overflow.docScroll} inner=${overflow.inner} bad=${overflow.bad.join(" | ")}`,
    );
    const tabs = ["home", "letters", "summarize", "qa", "drafts", "kepegawaian", "ikm", "pengaduan", "agenda"];
    let tabsOk = true;
    let tabsDetail = "";
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`);
      await sleep(250);
      const visible = await page.$eval(`#panel-${tab}`, (el) => !el.hidden);
      if (!visible) {
        tabsOk = false;
        tabsDetail = `tab ${tab} did not open`;
        break;
      }
    }
    check("all 9 tabs open at phone width", tabsOk, tabsDetail || "9/9 tabs");
    const heroPhoneH = await page.$eval(".hero", (el) => el.getBoundingClientRect().height);
    check(
      "hero is slim on phones (180–280px)",
      heroPhoneH >= 180 && heroPhoneH <= 280,
      `height=${Math.round(heroPhoneH)}px`,
    );
    await page.setViewport({ width: 1280, height: 900 });
    await sleep(300);

    // 9b. Deep links, logo, tab icons, QR distribution, quick stats
    // Fresh load with #ikm opens the IKM tab directly (no click needed)
    await page.goto(`file://${join(DIST, "index.html")}#ikm`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    const ikmFromHash = await page.$eval("#panel-ikm", (el) => !el.hidden);
    const hashAfterIkm = await page.evaluate(() => window.location.hash);
    check(
      "deep link #ikm opens the IKM tab on load",
      ikmFromHash && hashAfterIkm === "#ikm",
      `visible=${ikmFromHash} hash=${hashAfterIkm}`,
    );
    // Clicking a tab updates the hash (so the URL is shareable per tab)
    await page.click('[data-tab="pengaduan"]');
    await sleep(300);
    const hashAfterClick = await page.evaluate(() => window.location.hash);
    check(
      "switching tabs updates location.hash",
      hashAfterClick === "#pengaduan",
      `hash=${hashAfterClick}`,
    );
    // Fresh load with #pengaduan opens the Pengaduan tab
    await page.goto(`file://${join(DIST, "index.html")}#pengaduan`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    const aduFromHash = await page.$eval("#panel-pengaduan", (el) => !el.hidden);
    check("deep link #pengaduan opens the Pengaduan tab on load", aduFromHash);
    // Back to the IKM tab for the QR checks
    await page.goto(`file://${join(DIST, "index.html")}#ikm`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    // Logo + favicon (Bos's "Heritage of Simpangkatis" emblem)
    const logoOk = await page.$eval("#brand-logo", (el) => el.naturalWidth > 0 && el.complete);
    check("header logo loads (naturalWidth > 0)", logoOk);
    const faviconHref = await page.$eval(
      'link[rel="icon"]',
      (el) => el.getAttribute("href") ?? "",
    );
    check("favicon link is set", /favicon\.png/.test(faviconHref), faviconHref);
    // Office photo hero (Paket 4): photo loads, overlay keeps text readable
    const heroOk = await page.$eval("#hero-photo", (el) => el.naturalWidth > 0 && el.complete);
    check("hero office photo loads (naturalWidth > 0)", heroOk);
    check("office photo is bundled in dist", existsSync(join(DIST, "kantor.jpg")));
    const heroOverlay = await page.$eval(".hero-overlay", (el) =>
      getComputedStyle(el).backgroundImage.includes("linear-gradient"),
    );
    check("hero has a dark overlay gradient for readable text", heroOverlay);
    const heroH1Color = await page.$eval(".hero h1", (el) => getComputedStyle(el).color);
    check("hero title is white over the photo", heroH1Color === "rgb(255, 255, 255)", heroH1Color);
    const heroDeskH = await page.$eval(".hero", (el) => el.getBoundingClientRect().height);
    check(
      "hero is taller on desktop (260–340px)",
      heroDeskH >= 260 && heroDeskH <= 340,
      `height=${Math.round(heroDeskH)}px`,
    );
    // Design polish: gentle panel entrance + quiet white stat cards
    const panelAnim = await page.$eval("#panel-letters", (el) =>
      getComputedStyle(el).animationName,
    );
    check("panels have a gentle entrance animation", panelAnim === "panel-in", panelAnim);
    const statBg = await page.$eval(".stat-card", (el) => getComputedStyle(el).backgroundColor);
    check("stat cards use a quiet white surface", statBg === "rgb(255, 255, 255)", statBg);
    // Every tab has an inline SVG icon + a label (no emoji tabs anymore)
    const tabIcons = await page.$$eval(".tab", (els) =>
      els.map((b) => ({
        hasSvg: !!b.querySelector("svg.tab-icon"),
        label: (b.querySelector("span")?.textContent ?? "").trim(),
      })),
    );
    check(
      "all 9 tabs have an SVG icon + label",
      tabIcons.length === 9 && tabIcons.every((t) => t.hasSvg && t.label.length > 0),
      tabIcons.map((t) => `${t.label}:${t.hasSvg ? "svg" : "NO-SVG"}`).join(" | "),
    );
    // Survey distribution: link + QR code (generated locally, offline)
    const surveyLink = await page.$eval("#ikm-survey-link", (el) => el.value);
    check(
      "survey link is shown and deep-links to #ikm",
      surveyLink.includes("#ikm"),
      surveyLink,
    );
    const qrOk = await page.$eval("#ikm-qr", (el) => {
      const svg = el.querySelector("svg");
      return {
        hasSvg: !!svg,
        hasModules: !!svg?.querySelector("path"),
        ready: el.dataset.qrReady === "1",
      };
    });
    check(
      "QR code renders in the IKM share card",
      qrOk.hasSvg && qrOk.hasModules && qrOk.ready,
      JSON.stringify(qrOk),
    );
    const waHref = await page.$eval("#ikm-qr-wa", (el) => el.getAttribute("href") ?? "");
    check(
      "WhatsApp share link points to wa.me with the survey link",
      waHref.startsWith("https://wa.me/?text=") && /%23ikm/.test(waHref),
      waHref.slice(0, 80),
    );
    const qrBtns = await page.$$eval("#ikm-qr-copy, #ikm-qr-download", (els) => els.map((e) => e.id));
    check("QR copy + download buttons exist", qrBtns.length === 2, qrBtns.join(","));
    await page.click("#ikm-qr-copy");
    await sleep(300);
    const copyStatus = await page.$eval("#ikm-share-status", (el) => el.textContent);
    const copyOutVisible = await page.$eval("#ikm-share-output-wrap", (el) => !el.hidden);
    check(
      "QR copy button copies the survey link or shows it for manual copy",
      /disalin|salin|copied/i.test(copyStatus) || copyOutVisible,
      `status=${copyStatus} manualBox=${copyOutVisible}`,
    );
    await page.click("#ikm-qr-download");
    await sleep(300);
    const dlStatus = await page.$eval("#ikm-share-status", (el) => el.textContent);
    check("QR download button reports the download", /diunduh|downloaded/i.test(dlStatus), dlStatus);
    // Quick-stats strip reflects live data (1 letter draft seeded,
    // IKM all-1s score 25.00, 2 complaints resolved)
    const qs = await page.evaluate(() => ({
      letters: document.getElementById("qs-letters")?.textContent ?? "",
      ikm: document.getElementById("qs-ikm")?.textContent ?? "",
      aduan: document.getElementById("qs-aduan")?.textContent ?? "",
      dashIkm: document.getElementById("ikm-score")?.textContent ?? "",
      items: document.querySelectorAll("#quick-stats .quick-stat").length,
    }));
    check(
      "quick-stats strip shows 3 live stats",
      qs.items === 3,
      `items=${qs.items}`,
    );
    check(
      "quick-stats match live data (1 letter, IKM = dashboard, 2 resolved)",
      qs.letters === "1" && qs.ikm === qs.dashIkm && qs.aduan === "2",
      `letters=${qs.letters} ikm=${qs.ikm} dash=${qs.dashIkm} aduan=${qs.aduan}`,
    );

    // 9b. Paket 7 — command palette, citizen mode, complaints chart
    await page.click('[data-tab="home"]');
    await sleep(200);
    await page.keyboard.down("Control");
    await page.keyboard.press("k");
    await page.keyboard.up("Control");
    await sleep(300);
    check(
      "command palette opens with Ctrl+K",
      await page.$eval("#palette", (el) => el.open),
    );
    await page.type("#palette-input", "letter");
    await sleep(200);
    const paletteItems = await page.$$eval("#palette-list .palette-item", (els) =>
      els.map((e) => e.textContent ?? ""),
    );
    check(
      "palette filters commands by keyword",
      paletteItems.length >= 1 && paletteItems.every((s) => /letter/i.test(s)),
      paletteItems.join(" | ").slice(0, 120),
    );
    await page.keyboard.press("Enter");
    await sleep(300);
    check(
      "palette Enter opens the matching tab and closes",
      (await page.$eval('[data-tab="letters"]', (el) => el.classList.contains("active"))) &&
        (await page.$eval("#palette", (el) => !el.open)),
    );
    await page.click('[data-tab="home"]');
    await page.click("#mode-toggle");
    await sleep(200);
    const warga = await page.evaluate(() => ({
      bodyWarga: document.body.classList.contains("mode-warga"),
      lettersHidden:
        getComputedStyle(document.querySelector('[data-tab="letters"]')).display === "none",
      cardVisible: !document.getElementById("home-warga-card").hidden,
      briefingHidden:
        getComputedStyle(document.getElementById("home-briefing")).display === "none",
      backupHidden:
        getComputedStyle(document.getElementById("home-backup-card")).display === "none",
      agendaHidden:
        getComputedStyle(document.querySelector('[data-tab="agenda"]')).display === "none",
    }));
    check(
      "citizen mode hides officer tabs + briefing + agenda + backup card and shows resident card",
      warga.bodyWarga && warga.lettersHidden && warga.cardVisible && warga.briefingHidden && warga.agendaHidden && warga.backupHidden,
      JSON.stringify(warga),
    );
    await page.click("#warga-go-ikm");
    await sleep(200);
    check(
      "resident card opens the IKM survey",
      await page.$eval('[data-tab="ikm"]', (el) => el.classList.contains("active")),
    );
    await page.click("#mode-toggle");
    await sleep(200);
    check(
      "mode toggle returns to officer mode",
      await page.evaluate(
        () =>
          !document.body.classList.contains("mode-warga") &&
          getComputedStyle(document.querySelector('[data-tab="letters"]')).display !== "none",
      ),
    );
    await page.click('[data-tab="home"]');
    await sleep(200);
    const chart = await page.$$eval("#home-aduan-chart .chart-row", (rows) => ({
      n: rows.length,
      sum: rows.reduce(
        (s, r) => s + Number(r.querySelector(".chart-value")?.textContent ?? 0),
        0,
      ),
    }));
    check(
      "complaints-by-type chart shows 5 rows with a positive total",
      chart.n === 5 && chart.sum > 0,
      `rows=${chart.n} sum=${chart.sum}`,
    );

    // 10. No console errors / failed requests (excluding the VM tunnel noise)
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
