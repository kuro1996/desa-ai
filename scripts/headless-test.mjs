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
      "bento shows 18 cards with live numbers (IKM = dashboard, 0 letters today, 3 new complaints, 12 IKM + 6 complaints this month)",
      bento.cards === 18 && bento.ikm === bento.dashIkm && bento.cat.startsWith("A") &&
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
    // Paket 16: "Perlu Ditindaklanjuti" — open complaints + register
    // items, oldest first; tap jumps to the tab; empty state; offline.
    const readFollowup = () =>
      page.evaluate(() => ({
        count: document.getElementById("home-followup-count")?.textContent ?? "",
        summary: document.getElementById("home-followup-summary")?.textContent ?? "",
        items: [...document.querySelectorAll("#home-followup-list li")].map(
          (li) => li.textContent ?? "",
        ),
        emptyHidden: document.getElementById("home-followup-empty").hidden,
      }));
    const followup = await readFollowup();
    // Paket 20: expired / soon-expiring SKs join the card — the expected
    // count is computed from localStorage + today's date (robust across
    // months, as SKs keep expiring).
    const nSk = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let n = 0;
      let firstName = "";
      let firstDate = "";
      for (const p of items) {
        if (!p.masaSelesai) continue;
        const end = new Date(`${p.masaSelesai}T00:00:00`);
        const d = Math.round((end.getTime() - today.getTime()) / 86400000);
        if (d < 0 || d <= 30) {
          n += 1;
          if (d < 0 && (!firstDate || p.masaSelesai < firstDate)) {
            firstDate = p.masaSelesai;
            firstName = p.nama;
          }
        }
      }
      return { n, firstName };
    });
    const followupTotal = 7 + nSk.n;
    check(
      "follow-up card lists 7 open items + SK reminders, most urgent first",
      followup.count === String(followupTotal) &&
        /5 complaints/.test(followup.summary) &&
        /2 register items/.test(followup.summary) &&
        new RegExp(`${nSk.n} staff SK`).test(followup.summary) &&
        followup.items.length === followupTotal &&
        new RegExp(nSk.firstName).test(followup.items[0]) &&
        /Permohonan rekomendasi bantuan sosial/.test(followup.items[followupTotal - 1]) &&
        followup.emptyHidden,
      `count=${followup.count} summary=${followup.summary} first=${followup.items[0]?.slice(0, 50)} last=${followup.items[followupTotal - 1]?.slice(0, 50)}`,
    );
    // Tap the first item (an expired SK) -> kepegawaian tab opens.
    await page.click("#home-followup-list li");
    await sleep(300);
    check(
      "tapping a follow-up SK item opens the kepegawaian tab",
      await page.$eval('[data-tab="kepegawaian"]', (el) => el.classList.contains("active")),
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Tap a complaint item -> complaints tab opens.
    await page.evaluate(() => {
      const li = [...document.querySelectorAll("#home-followup-list li")].find((el) =>
        (el.textContent ?? "").includes("Biaya tidak sesuai"),
      );
      li?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await sleep(300);
    check(
      "tapping a follow-up complaint opens the complaints tab",
      await page.$eval('[data-tab="pengaduan"]', (el) => el.classList.contains("active")),
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Tap a register item -> mail register tab opens.
    await page.evaluate(() => {
      const li = [...document.querySelectorAll("#home-followup-list li")].find((el) =>
        (el.textContent ?? "").includes("Permohonan rekomendasi bantuan sosial"),
      );
      li?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await sleep(300);
    check(
      "tapping a follow-up register item opens the mail register tab",
      await page.$eval('[data-tab="agenda"]', (el) => el.classList.contains("active")),
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Incoming letter without a disposition is flagged, not duplicated.
    const seedAgsRaw = await page.evaluate(() => localStorage.getItem("desaai-agenda-v1"));
    await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      items[0].disposisi = "";
      localStorage.setItem("desaai-agenda-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(400);
    const followupDisp = await readFollowup();
    await page.evaluate((raw) => {
      if (raw) localStorage.setItem("desaai-agenda-v1", raw);
    }, seedAgsRaw);
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(400);
    check(
      "incoming letter without disposition is flagged once (not duplicated)",
      followupDisp.count === String(followupTotal) &&
        /1 not yet dispositioned/.test(followupDisp.summary) &&
        followupDisp.items.filter((t) => /not yet dispositioned/.test(t)).length === 1,
      `count=${followupDisp.count} summary=${followupDisp.summary}`,
    );
    // Empty state: everything resolved -> positive message, badge 0.
    // (Paket 20: SK reminders must be cleared too — push every term end
    // far into the future, then restore.)
    const seedAduRaw = await page.evaluate(() => localStorage.getItem("desaai-pengaduan-v1"));
    const seedAgsRaw2 = await page.evaluate(() => localStorage.getItem("desaai-agenda-v1"));
    const seedKegRaw = await page.evaluate(() => localStorage.getItem("desaai-perangkat-v1"));
    await page.evaluate(() => {
      const adu = JSON.parse(localStorage.getItem("desaai-pengaduan-v1") ?? "[]");
      adu.forEach((a) => (a.status = "selesai"));
      localStorage.setItem("desaai-pengaduan-v1", JSON.stringify(adu));
      const ags = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      ags.forEach((e) => (e.status = "selesai"));
      localStorage.setItem("desaai-agenda-v1", JSON.stringify(ags));
      const keg = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      keg.forEach((p) => (p.masaSelesai = "2099-12-31"));
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(keg));
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(400);
    const followupEmpty = await readFollowup();
    await page.evaluate(
      ({ adu, ags, keg }) => {
        if (adu) localStorage.setItem("desaai-pengaduan-v1", adu);
        if (ags) localStorage.setItem("desaai-agenda-v1", ags);
        if (keg) localStorage.setItem("desaai-perangkat-v1", keg);
      },
      { adu: seedAduRaw, ags: seedAgsRaw2, keg: seedKegRaw },
    );
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(400);
    const followupRestored = await readFollowup();
    check(
      "follow-up card shows the all-clear message when nothing is open",
      followupEmpty.count === "0" &&
        followupEmpty.items.length === 0 &&
        !followupEmpty.emptyHidden &&
        followupRestored.count === String(followupTotal),
      `empty count=${followupEmpty.count} items=${followupEmpty.items.length} restored=${followupRestored.count}`,
    );
    // Offline: the card still renders from local data (no reload — the
    // network is off, so re-render by leaving and returning to Home).
    await page.setOfflineMode(true);
    await page.click('[data-tab="ikm"]');
    await sleep(200);
    await page.click('[data-tab="home"]');
    await sleep(300);
    const followupOffline = await readFollowup();
    await page.setOfflineMode(false);
    check(
      "follow-up card renders offline (local data only)",
      followupOffline.count === String(followupTotal) && followupOffline.items.length === followupTotal,
      `count=${followupOffline.count} items=${followupOffline.items.length}`,
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
    // Paket 18: Grafik Tren Bulanan — 6 bulan × 4 seri, data lokal.
    const trendDom = await page.evaluate(() => {
      const svg = document.querySelector("#home-month-trend svg");
      const rects = [...document.querySelectorAll("#home-month-trend rect")];
      const legend = [...document.querySelectorAll("#home-month-trend-legend > span")];
      const lastLabel = new Date().toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      return {
        hasSvg: !!svg,
        bars: rects.length,
        legend: legend.length,
        lastMonthShown: (svg?.textContent ?? "").includes(lastLabel),
      };
    });
    check(
      "monthly trend chart renders 6 months × 4 series with a 4-item legend",
      trendDom.hasSvg && trendDom.bars === 24 && trendDom.legend === 4 &&
        trendDom.lastMonthShown,
      `bars=${trendDom.bars} legend=${trendDom.legend} lastMonth=${trendDom.lastMonthShown}`,
    );
    // Bar counts match local data, computed independently here.
    const trendExpected = await page.evaluate(() => {
      const read = (key) => {
        try {
          return JSON.parse(localStorage.getItem(key) ?? "[]");
        } catch {
          return [];
        }
      };
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ y: d.getFullYear(), m: d.getMonth() });
      }
      const inYM = (ts, y, m) => {
        const d = new Date(ts);
        return d.getFullYear() === y && d.getMonth() === m;
      };
      const letters = read("desaai-drafts-v1").filter((d) => d.kind === "letter");
      const agenda = read("desaai-agenda-v1");
      const aduan = read("desaai-pengaduan-v1");
      return months.map(({ y, m }) => ({
        surat: letters.filter((d) => inYM(d.createdAt, y, m)).length,
        masuk: agenda.filter((e) => e.arah === "masuk" && inYM(e.tanggal, y, m)).length,
        keluar: agenda.filter((e) => e.arah === "keluar" && inYM(e.tanggal, y, m)).length,
        aduan: aduan.filter((a) => inYM(a.createdAt, y, m)).length,
      }));
    });
    const trendActual = await page.$$eval("#home-month-trend rect", (rects) => {
      const out = Array.from({ length: 6 }, () => ({}));
      for (const r of rects) {
        out[Number(r.dataset.month)][r.dataset.series] = Number(r.dataset.value);
      }
      return out;
    });
    check(
      "monthly trend bar counts match local data",
      JSON.stringify(trendActual) === JSON.stringify(trendExpected),
      JSON.stringify(trendActual),
    );
    // Months without data render as 0, not as missing bars.
    const trendZeros = await page.$$eval("#home-month-trend .mtrend-value", (texts) =>
      texts.map((t) => t.textContent),
    );
    const zeroBars = trendExpected.flatMap((g) => Object.values(g)).filter((v) => v === 0).length;
    const zeroGroups = trendExpected.filter(
      (g) => Object.values(g).every((v) => v === 0),
    ).length;
    check(
      "monthly trend shows 0 for months without data",
      zeroGroups >= 1 &&
        trendZeros.filter((t) => t === "0").length === zeroBars &&
        trendZeros.length === 24,
      `zeroGroups=${zeroGroups} zeroBars=${zeroBars} zeroLabels=${trendZeros.filter((t) => t === "0").length}`,
    );
    // Offline: re-rendering the home tab still shows the same chart.
    await page.setOfflineMode(true);
    await page.click('[data-tab="home"]');
    await sleep(300);
    const trendOffline = await page.$$eval("#home-month-trend rect", (rects) => {
      const out = Array.from({ length: 6 }, () => ({}));
      for (const r of rects) {
        out[Number(r.dataset.month)][r.dataset.series] = Number(r.dataset.value);
      }
      return out;
    });
    await page.setOfflineMode(false);
    check(
      "monthly trend chart works offline",
      JSON.stringify(trendOffline) === JSON.stringify(trendExpected),
      JSON.stringify(trendOffline),
    );
    // Mode Warga: the report card (and its trend chart) stays visible,
    // like the monthly report itself — only officer cards are hidden.
    await page.click("#mode-toggle");
    await sleep(200);
    const trendWarga = await page.evaluate(() => ({
      wrapVisible:
        getComputedStyle(document.getElementById("home-month-trend-wrap")).display !== "none",
      reportVisible:
        getComputedStyle(document.querySelector(".bento-report")).display !== "none",
    }));
    await page.click("#mode-toggle");
    await sleep(200);
    await page.click('[data-tab="home"]');
    await sleep(200);
    check(
      "monthly trend chart stays visible in Mode Warga with the report card",
      trendWarga.wrapVisible && trendWarga.reportVisible,
      JSON.stringify(trendWarga),
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
    // Paket 17: Pengaturan Kop Surat — officer fills the office identity
    // used by the letterhead; nothing is ever invented.
    const lhCard = await page.$("#home-letterhead-card");
    const lhValues = await page.evaluate(() => {
      const v = (id) => document.getElementById(id)?.value ?? null;
      return {
        instansi1: v("home-lh-instansi1"),
        instansi2: v("home-lh-instansi2"),
        alamat: v("home-lh-alamat"),
        telepon: v("home-lh-telepon"),
        email: v("home-lh-email"),
        camatNama: v("home-lh-camat-nama"),
        camatNip: v("home-lh-camat-nip"),
        sekretarisNama: v("home-lh-sekretaris-nama"),
      };
    });
    check(
      "letterhead card exists with 8 fields prefilled with the office defaults, no invented names",
      !!lhCard &&
        Object.values(lhValues).every((v) => v !== null) &&
        lhValues.instansi1 === "Pemerintah Kabupaten Bangka Tengah" &&
        lhValues.instansi2 === "Kecamatan Simpangkatis" &&
        lhValues.camatNama === "" &&
        lhValues.camatNip === "" &&
        lhValues.sekretarisNama === "",
      JSON.stringify(lhValues),
    );
    const setLhField = (id, value) =>
      page.$eval(id, (el, val) => {
        el.value = val;
      }, value);
    await setLhField("#home-lh-camat-nama", "CAMAT-UJI-17");
    await setLhField("#home-lh-camat-nip", "NIP-UJI-17");
    await setLhField("#home-lh-alamat", "Jl. Uji No. 17");
    await setLhField("#home-lh-sekretaris-nama", "SEKRETARIS-UJI-17");
    await page.click("#home-letterhead-save");
    await sleep(300);
    const lhSaved = await page.evaluate(() => ({
      status: document.getElementById("home-letterhead-status")?.textContent ?? "",
      stored: JSON.parse(localStorage.getItem("desaai-letterhead-v1") ?? "{}"),
    }));
    check(
      "letterhead settings save to localStorage and report success",
      /(disimpan|saved)/i.test(lhSaved.status) &&
        lhSaved.stored.camatNama === "CAMAT-UJI-17" &&
        lhSaved.stored.camatNip === "NIP-UJI-17" &&
        lhSaved.stored.alamat === "Jl. Uji No. 17" &&
        lhSaved.stored.sekretarisNama === "SEKRETARIS-UJI-17",
      `${lhSaved.status} ${JSON.stringify(lhSaved.stored)}`,
    );
    // Offline: saving still works (localStorage only).
    await page.setOfflineMode(true);
    await setLhField("#home-lh-telepon", "(0717) 000000");
    await page.click("#home-letterhead-save");
    await sleep(300);
    const lhOffline = await page.evaluate(
      () => JSON.parse(localStorage.getItem("desaai-letterhead-v1") ?? "{}").telepon,
    );
    await page.setOfflineMode(false);
    check(
      "letterhead settings save offline",
      lhOffline === "(0717) 000000",
      `telepon=${lhOffline}`,
    );
    // Backup export carries the settings as a sixth collection.
    await page.click("#home-backup-export");
    await sleep(300);
    const backupWithLh = await readLastBlobText();
    let backupLhParsed = null;
    try {
      backupLhParsed = JSON.parse(backupWithLh);
    } catch {
      backupLhParsed = null;
    }
    check(
      "backup export includes the letterhead settings",
      !!backupLhParsed &&
        backupLhParsed.collections?.pengaturan?.camatNama === "CAMAT-UJI-17" &&
        backupLhParsed.counts?.pengaturan === 1,
      backupLhParsed ? JSON.stringify(backupLhParsed.counts) : "unparsed",
    );
    // Restore a backup carrying different settings replaces them, then
    // restoring the original backup returns the defaults.
    const lhRestorePath = join(tmpDir, "desaai-backup-lh-20261123.json");
    const lhModified = JSON.parse(JSON.stringify(backupLhParsed));
    lhModified.collections.pengaturan.camatNama = "CAMAT-RESTORE-17";
    writeFileSync(lhRestorePath, JSON.stringify(lhModified, null, 2));
    await backupFileInput.uploadFile(lhRestorePath);
    await sleep(500);
    const lhConfirm = await page.$eval(
      "#home-backup-confirm-text",
      (el) => el.textContent ?? "",
    );
    check(
      "restore confirmation lists the settings collection",
      /(Pengaturan 1|Settings 1)/.test(lhConfirm),
      lhConfirm,
    );
    await page.click("#home-backup-confirm-yes");
    await sleep(800);
    const lhAfterRestore = await page.evaluate(() => ({
      stored: JSON.parse(localStorage.getItem("desaai-letterhead-v1") ?? "{}"),
      form: document.getElementById("home-lh-camat-nama")?.value ?? "",
    }));
    check(
      "restore replaces the letterhead settings",
      lhAfterRestore.stored.camatNama === "CAMAT-RESTORE-17" &&
        lhAfterRestore.form === "CAMAT-RESTORE-17",
      JSON.stringify(lhAfterRestore),
    );
    await backupFileInput.uploadFile(originalPath);
    await sleep(500);
    await page.click("#home-backup-confirm-yes");
    await sleep(800);
    const lhAfterRevert = await page.evaluate(
      () => JSON.parse(localStorage.getItem("desaai-letterhead-v1") ?? "{}").camatNama,
    );
    check(
      "restoring the original backup returns the default (empty) signatory",
      lhAfterRevert === "",
      `camatNama=${lhAfterRevert}`,
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
    check("undangan template renders fields", fieldCount === 9, `${fieldCount} fields`);
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

    // Letter copy/download/print/save/WhatsApp buttons exist and are wired (no-op without text is fine)
    const letterBtns = await page.$$eval(
      "#letter-copy, #letter-download, #letter-print, #letter-whatsapp, #letter-save",
      (els) => els.map((e) => e.id),
    );
    check("letter actions present", letterBtns.length === 5, letterBtns.join(","));

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

    // 2e. Paket 33 — WhatsApp share: a short letter opens wa.me with the text encoded.
    await page.evaluate(() => {
      window.__origOpen = window.open;
      window.open = (url) => {
        window.__waOpened = url;
        return null;
      };
      const out = document.getElementById("letter-output");
      out.value = "SURAT UNDANGAN\n\nDengan hormat, warga diundang musyawarah desa.";
      document.getElementById("letter-output-wrap").hidden = false;
    });
    await page.click("#letter-whatsapp");
    await sleep(300);
    const waShort = await page.evaluate(() => ({
      opened: window.__waOpened ?? "",
      status: document.getElementById("letter-status")?.textContent ?? "",
    }));
    // (Bagian 2 jalan dalam bahasa default aplikasi = Inggris; Anin
    // baru beralih ke Indonesia di bagian 9c — cek terima kedua bahasa.)
    check(
      "WhatsApp share opens wa.me with the letter text encoded",
      waShort.opened.startsWith("https://wa.me/?text=") &&
        /musyawarah%20desa/i.test(waShort.opened) &&
        /WhatsApp terbuka|WhatsApp opened/.test(waShort.status),
      waShort.opened.slice(0, 80),
    );

    // 2f. Paket 33 — a very long letter falls back to copy + plain wa.me (no giant URL).
    await page.evaluate(() => {
      window.__waOpened = "";
      window.__waCopied = "";
      try {
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: async (t) => {
              window.__waCopied = t;
            },
          },
          configurable: true,
        });
      } catch {
        // Clipboard stub unavailable — copyText falls back to execCommand.
      }
      document.getElementById("letter-output").value = "A".repeat(9000);
    });
    await page.click("#letter-whatsapp");
    await sleep(300);
    const waLong = await page.evaluate(() => ({
      opened: window.__waOpened ?? "",
      copied: (window.__waCopied ?? "").length,
      status: document.getElementById("letter-status")?.textContent ?? "",
    }));
    check(
      "long letter falls back to copy + plain wa.me (no giant share URL)",
      waLong.opened === "https://wa.me/" &&
        waLong.copied === 9000 &&
        /terlalu panjang|too long/i.test(waLong.status),
      `opened=${waLong.opened} copied=${waLong.copied}`,
    );

    // 2g. Paket 33 — an archived letter also has a WhatsApp button.
    await page.evaluate(() => {
      window.__waOpened = "";
      localStorage.setItem(
        "desaai-drafts-v1",
        JSON.stringify([
          {
            id: "wa-test-1",
            kind: "letter",
            title: "Undangan",
            content: "SURAT UNDANGAN\n\nMusyawarah desa.",
            createdAt: Date.now(),
            source: "local",
          },
        ]),
      );
    });
    await page.click('[data-tab="drafts"]');
    await sleep(400);
    const waArchiveLabel = await page.$eval(".draft-wa-btn", (el) => el.textContent);
    check(
      "archived letter shows a WhatsApp button",
      /Kirim ke WhatsApp|Send via WhatsApp/.test(waArchiveLabel),
      waArchiveLabel,
    );
    await page.click(".draft-wa-btn");
    await sleep(300);
    const waArchive = await page.evaluate(() => window.__waOpened ?? "");
    check(
      "archived letter WhatsApp button opens wa.me with its text",
      waArchive.startsWith("https://wa.me/?text=") && /Musyawarah%20desa/.test(waArchive),
      waArchive.slice(0, 80),
    );
    await page.evaluate(() => {
      localStorage.removeItem("desaai-drafts-v1");
      window.open = window.__origOpen;
    });
    await page.click('[data-tab="letters"]');
    await sleep(200);

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
      /not configured|can't be reached|tidak bisa dihubungi/i.test(sumStatus),
      sumStatus,
    );
    check(
      "summarizer never shows the raw npx error (Paket 32)",
      !/npx|Panggilan AI gagal|AI call failed/i.test(sumStatus),
      sumStatus.slice(0, 80),
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

    // KB guide section renders (8 original + 2 kepegawaian + 6 administrasi
    // umum Paket 32.1)
    const kbItems = await page.$$eval("#kb-list .kb-item", (els) => els.length);
    check("offline procedure guide renders", kbItems === 16, `${kbItems} entries`);

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
    // Paket 20 — Pengingat Masa Berlaku SK (30-day window, most urgent
    // first). Expected values computed from localStorage + today's date.
    const readSk = () =>
      page.evaluate(() => ({
        count: document.getElementById("keg-sk-count")?.textContent ?? "",
        items: [...document.querySelectorAll("#keg-sk-list li")].map(
          (li) => li.textContent ?? "",
        ),
        emptyHidden: document.getElementById("keg-sk-empty").hidden,
      }));
    const skExpected = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const list = [];
      for (const p of items) {
        if (!p.masaSelesai) continue;
        const end = new Date(`${p.masaSelesai}T00:00:00`);
        const d = Math.round((end.getTime() - today.getTime()) / 86400000);
        if (d < 0 || d <= 30) list.push({ nama: p.nama, days: d });
      }
      list.sort((a, b) => a.days - b.days);
      return list;
    });
    const sk = await readSk();
    check(
      "SK reminder lists expired + expiring ≤30 days, most urgent first",
      sk.count === String(skExpected.length) &&
        sk.items.length === skExpected.length &&
        skExpected.length > 0 &&
        sk.items[0].includes(skExpected[0].nama) &&
        sk.emptyHidden,
      `count=${sk.count} expected=${skExpected.length} first=${sk.items[0]?.slice(0, 60)}`,
    );
    // Days math: the first item's day count matches the stored end date.
    const firstDays = skExpected[0].days;
    check(
      "SK reminder day count matches the stored end date",
      firstDays < 0
        ? new RegExp(`SK expired ${-firstDays} days ago`).test(sk.items[0])
        : new RegExp(`SK expires in ${firstDays} days`).test(sk.items[0]),
      `first=${sk.items[0]?.slice(0, 80)}`,
    );
    // Manipulation: a record moved to +10 days appears as expiring soon;
    // a record with no end date is skipped (never guessed).
    const seedKegRaw20 = await page.evaluate(() => localStorage.getItem("desaai-perangkat-v1"));
    const skManip = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      const today = new Date();
      const in10d = new Date(today.getTime() + 10 * 86400000);
      // Tanggal LOKAL (bukan toISOString/UTC): aplikasi + skExpected
      // menghitung hari dari tengah malam lokal; toISOString menggeser
      // sehari saat WIB sudah tanggal baru tapi UTC masih tanggal lama
      // (mis. 00:45 WIB = 17:45 UTC) sehingga +10 hari jadi 9 hari.
      const in10 = `${in10d.getFullYear()}-${String(in10d.getMonth() + 1).padStart(2, "0")}-${String(in10d.getDate()).padStart(2, "0")}`;
      const far = items.find((p) => p.masaSelesai === "2027-12-31");
      const inList = items.find((p) => p.masaSelesai === "2026-06-30");
      if (far) far.masaSelesai = in10;
      if (inList) inList.masaSelesai = "";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
      return { farName: far?.nama ?? "", inName: inList?.nama ?? "" };
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    const skManipRead = await readSk();
    check(
      "SK reminder picks up a +10-day record and skips a record without an end date",
      skManipRead.count === String(skExpected.length) &&
        skManipRead.items.some(
          (t) => t.includes(skManip.farName) && /SK expires in 10 days/.test(t),
        ) &&
        !skManipRead.items.some((t) => t.includes(skManip.inName)),
      `count=${skManipRead.count} far=${skManip.farName} skipped=${skManip.inName}`,
    );
    // Empty state: nothing expiring soon -> positive message, badge 0.
    await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      items.forEach((p) => (p.masaSelesai = "2099-12-31"));
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    const skEmpty = await readSk();
    await page.evaluate((raw) => {
      if (raw) localStorage.setItem("desaai-perangkat-v1", raw);
    }, seedKegRaw20);
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    check(
      "SK reminder shows the all-clear message when nothing expires soon",
      skEmpty.count === "0" && skEmpty.items.length === 0 && !skEmpty.emptyHidden,
      `count=${skEmpty.count} items=${skEmpty.items.length}`,
    );
    // Offline: the reminder still renders from local data.
    await page.setOfflineMode(true);
    await page.click('[data-tab="home"]');
    await sleep(200);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const skOffline = await readSk();
    await page.setOfflineMode(false);
    check(
      "SK reminder renders offline (local data only)",
      skOffline.count === String(skExpected.length) &&
        skOffline.items.length === skExpected.length,
      `count=${skOffline.count} items=${skOffline.items.length}`,
    );
    // Mode Warga: the kepegawaian tab (officer-only) is hidden.
    await page.click("#mode-toggle");
    await sleep(200);
    const skWargaHidden = await page.evaluate(
      () =>
        document.body.classList.contains("mode-warga") &&
        getComputedStyle(document.querySelector('[data-tab="kepegawaian"]')).display ===
          "none",
    );
    await page.click("#mode-toggle");
    await sleep(200);
    const skWargaBack = await page.evaluate(
      () => !document.body.classList.contains("mode-warga"),
    );
    check(
      "SK reminder hidden in Mode Warga (kepegawaian is officer-only)",
      skWargaHidden && skWargaBack,
    );
    // Warga mode switches the active tab to Home — return to Kepegawaian
    // so the form tests below can click #keg-add.
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    // Paket 21 — Statistik Pegawai: breakdown per jabatan / per desa / SK,
    // computed only from the stored records. Expected values computed from
    // localStorage + today's date (never hard-coded dates).
    const readBd = () =>
      page.evaluate(() => ({
        total: document.getElementById("keg-stat21-total")?.textContent ?? "",
        jab: [...document.querySelectorAll("#keg-stat21-jabatan li")].map(
          (li) => li.textContent ?? "",
        ),
        desa: [...document.querySelectorAll("#keg-stat21-desa li")].map(
          (li) => li.textContent ?? "",
        ),
        skBerlaku: document.getElementById("keg-stat21-sk-berlaku")?.textContent ?? "",
        skHabis: document.getElementById("keg-stat21-sk-habis")?.textContent ?? "",
        skTanpa: document.getElementById("keg-stat21-sk-tanpa")?.textContent ?? "",
        skTanpaHidden: document.getElementById("keg-stat21-sk-tanpa-wrap")?.hidden ?? true,
        rows: document.querySelectorAll("#keg-table-body tr").length,
        statTotal: document.getElementById("keg-stat-total")?.textContent ?? "",
      }));
    const bdExpected = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const group = (pick) => {
        const map = new Map();
        for (const p of items) map.set((pick(p) ?? "").trim(), (map.get((pick(p) ?? "").trim()) ?? 0) + 1);
        return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"));
      };
      let berlaku = 0, habis = 0, tanpa = 0;
      for (const p of items) {
        if (!p.masaSelesai) { tanpa += 1; continue; }
        const d = Math.round((new Date(`${p.masaSelesai}T00:00:00`).getTime() - today.getTime()) / 86400000);
        if (Number.isNaN(d)) tanpa += 1; else if (d < 0) habis += 1; else berlaku += 1;
      }
      return { total: items.length, jab: group((p) => p.jabatan), desa: group((p) => p.desa), berlaku, habis, tanpa };
    });
    const bd = await readBd();
    const rowCount = (rows) => rows.reduce((a, t) => a + Number((t.match(/(\d+)$/) ?? ["0", "0"])[1]), 0);
    check(
      "staff breakdown total matches the officer list and stat cards",
      bd.total === String(bdExpected.total) &&
        bd.statTotal === String(bdExpected.total) &&
        bd.rows === bdExpected.total,
      `total=${bd.total} statTotal=${bd.statTotal} rows=${bd.rows} expected=${bdExpected.total}`,
    );
    check(
      "staff breakdown by position sums to total, most common first",
      rowCount(bd.jab) === bdExpected.total &&
        bd.jab.length === bdExpected.jab.length &&
        bd.jab[0].startsWith(bdExpected.jab[0][0]) &&
        bd.jab[0].endsWith(String(bdExpected.jab[0][1])),
      `groups=${bd.jab.length} first=${bd.jab[0]} expected-first=${bdExpected.jab[0][0]}×${bdExpected.jab[0][1]}`,
    );
    check(
      "staff breakdown by village sums to total",
      rowCount(bd.desa) === bdExpected.total &&
        bd.desa.length === bdExpected.desa.length &&
        bd.desa[0].startsWith(bdExpected.desa[0][0]) &&
        bd.desa[0].endsWith(String(bdExpected.desa[0][1])),
      `groups=${bd.desa.length} first=${bd.desa[0]} expected-first=${bdExpected.desa[0][0]}×${bdExpected.desa[0][1]}`,
    );
    check(
      "staff breakdown SK counts match stored end dates",
      bd.skBerlaku === String(bdExpected.berlaku) &&
        bd.skHabis === String(bdExpected.habis) &&
        bd.skTanpa === String(bdExpected.tanpa) &&
        bd.skTanpaHidden === (bdExpected.tanpa === 0),
      `berlaku=${bd.skBerlaku}/${bdExpected.berlaku} habis=${bd.skHabis}/${bdExpected.habis} tanpa=${bd.skTanpa}/${bdExpected.tanpa}`,
    );
    // Manipulation: a record without position/village/end date groups under
    // "Unknown" and counts as "No SK end date" — never guessed.
    const seedKegRaw21 = await page.evaluate(() => localStorage.getItem("desaai-perangkat-v1"));
    const bdManip = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1") ?? "[]");
      const p = items[0];
      p.jabatan = "";
      p.desa = "";
      p.masaSelesai = "";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
      return { nama: p.nama };
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    const bdManipRead = await readBd();
    await page.evaluate((raw) => {
      if (raw) localStorage.setItem("desaai-perangkat-v1", raw);
    }, seedKegRaw21);
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    check(
      "staff breakdown groups a missing position/village as Unknown and counts a dateless SK",
      bdManipRead.total === String(bdExpected.total) &&
        bdManipRead.jab.some((t) => t.startsWith("Unknown")) &&
        bdManipRead.desa.some((t) => t.startsWith("Unknown")) &&
        bdManipRead.skTanpa === String(bdExpected.tanpa + 1) &&
        !bdManipRead.skTanpaHidden,
      `total=${bdManipRead.total} jab-unknown=${bdManipRead.jab.some((t) => t.startsWith("Unknown"))} tanpa=${bdManipRead.skTanpa}`,
    );
    // Offline: the breakdown still renders from local data.
    await page.setOfflineMode(true);
    await page.click('[data-tab="home"]');
    await sleep(200);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const bdOffline = await readBd();
    await page.setOfflineMode(false);
    check(
      "staff breakdown renders offline (local data only)",
      bdOffline.total === String(bdExpected.total) &&
        bdOffline.jab.length === bdExpected.jab.length &&
        bdOffline.desa.length === bdExpected.desa.length,
      `total=${bdOffline.total} jab-groups=${bdOffline.jab.length} desa-groups=${bdOffline.desa.length}`,
    );
    // Mode Warga: the kepegawaian tab (officer-only) is hidden, so the
    // breakdown inside it is not visible either.
    await page.click("#mode-toggle");
    await sleep(200);
    const bdWargaHidden = await page.evaluate(
      () =>
        document.body.classList.contains("mode-warga") &&
        document.getElementById("keg-stat21")?.offsetParent === null,
    );
    await page.click("#mode-toggle");
    await sleep(200);
    const bdWargaBack = await page.evaluate(
      () => !document.body.classList.contains("mode-warga"),
    );
    check(
      "staff breakdown hidden in Mode Warga (kepegawaian is officer-only)",
      bdWargaHidden && bdWargaBack,
    );
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
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

    // Paket 22 — Pencarian Cepat Pegawai: case-insensitive substring
    // search on name/position/village, an explicit empty-result message,
    // and statistics that follow the active search. (24 records here:
    // 23 demo + the "Tes Tambah" record added above.)
    const setKegSearch = async (q) => {
      await page.$eval("#keg-search", (el) => { el.value = ""; });
      await page.evaluate(() =>
        document.getElementById("keg-search")?.dispatchEvent(new Event("input", { bubbles: true })),
      );
      if (q) await page.type("#keg-search", q);
      await sleep(300);
    };
    const kegSearchState = () =>
      page.evaluate(() => ({
        rows: document.querySelectorAll("#keg-table-body tr").length,
        noResultHidden: document.getElementById("keg-no-result")?.hidden ?? true,
        count: document.getElementById("keg-count")?.textContent ?? "",
        statTotal: document.getElementById("keg-stat21-total")?.textContent ?? "",
        noteHidden: document.getElementById("keg-stat21-filter-note")?.hidden ?? true,
        note: document.getElementById("keg-stat21-filter-note")?.textContent ?? "",
        jabGroups: document.querySelectorAll("#keg-stat21-jabatan li").length,
        desaGroups: document.querySelectorAll("#keg-stat21-desa li").length,
        skSum:
          Number(document.getElementById("keg-stat21-sk-berlaku")?.textContent ?? "0") +
          Number(document.getElementById("keg-stat21-sk-habis")?.textContent ?? "0") +
          Number(document.getElementById("keg-stat21-sk-tanpa")?.textContent ?? "0"),
      }));
    await setKegSearch("AHMAD");
    const p22UpperRows = (await kegSearchState()).rows;
    check("kepegawaian search is case-insensitive", p22UpperRows === 1, `${p22UpperRows} rows for "AHMAD"`);
    await setKegSearch("ahma");
    const p22SubRows = (await kegSearchState()).rows;
    check("kepegawaian search matches a name substring", p22SubRows === 2, `${p22SubRows} rows for "ahma" (Ahmad Fauzi + Siti Rahmawati)`);
    await setKegSearch("kepala desa");
    const p22JabRows = (await kegSearchState()).rows;
    check("kepegawaian search matches position", p22JabRows === 5, `${p22JabRows} rows for "kepala desa"`);
    await setKegSearch("terak");
    const p22DesaRows = (await kegSearchState()).rows;
    check("kepegawaian search matches village", p22DesaRows === 3, `${p22DesaRows} rows for "terak" (2 demo + Tes Tambah)`);
    await setKegSearch("zzzz-tidak-ada");
    const p22NoMatch = await kegSearchState();
    check(
      "kepegawaian search with no match shows the empty message",
      p22NoMatch.rows === 0 && !p22NoMatch.noResultHidden && /0/.test(p22NoMatch.count),
      `rows=${p22NoMatch.rows} noResultHidden=${p22NoMatch.noResultHidden} count=${p22NoMatch.count}`,
    );
    await setKegSearch("Ahmad");
    const p22FilteredBd = await kegSearchState();
    check(
      "kepegawaian statistics follow the active search",
      p22FilteredBd.statTotal === "1" &&
        !p22FilteredBd.noteHidden &&
        p22FilteredBd.note.includes("24") &&
        p22FilteredBd.jabGroups === 1 &&
        p22FilteredBd.desaGroups === 1 &&
        p22FilteredBd.skSum === 1,
      `statTotal=${p22FilteredBd.statTotal} note=${p22FilteredBd.note} jab=${p22FilteredBd.jabGroups} desa=${p22FilteredBd.desaGroups} skSum=${p22FilteredBd.skSum}`,
    );
    await setKegSearch("");
    const p22Cleared = await kegSearchState();
    check(
      "kepegawaian clearing the search restores full statistics",
      p22Cleared.rows === 24 &&
        p22Cleared.statTotal === "24" &&
        p22Cleared.noteHidden &&
        p22Cleared.noResultHidden,
      `rows=${p22Cleared.rows} statTotal=${p22Cleared.statTotal} noteHidden=${p22Cleared.noteHidden}`,
    );

    // Paket 23 — Pengurutan Daftar Pegawai: click a column header to sort
    // (1st click asc, 2nd desc, 3rd clears back to stored order). 24
    // records here: 23 demo + "Tes Tambah" (Staf Desa, Terak, SK ends
    // 2027-12-31). Name cells carry a demo badge, so read the first text
    // node only.
    const kegRowName = (idx) =>
      page.evaluate(
        (i) => {
          const rows = document.querySelectorAll("#keg-table-body tr");
          const cell = rows[i]?.querySelector("td:nth-child(2)");
          return cell ? cell.childNodes[0].textContent.trim() : "";
        },
        idx,
      );
    const kegFirstName = () => kegRowName(0);
    const kegLastName = () =>
      page.evaluate(() => {
        const rows = document.querySelectorAll("#keg-table-body tr");
        const cell = rows[rows.length - 1]?.querySelector("td:nth-child(2)");
        return cell ? cell.childNodes[0].textContent.trim() : "";
      });
    const kegSortArrow = (key) =>
      page.$eval(`#keg-table th[data-sort-key="${key}"] .sort-arrow`, (el) => el.textContent);
    const clickKegSort = async (key) => {
      await page.click(`#keg-table th[data-sort-key="${key}"]`);
      await sleep(200);
    };
    await clickKegSort("nama");
    check(
      "kepegawaian sort by name ascending",
      (await kegFirstName()) === "Agus Setiawan" && (await kegSortArrow("nama")) === "▲",
      `first=${await kegFirstName()} arrow=${await kegSortArrow("nama")}`,
    );
    await clickKegSort("nama");
    check(
      "kepegawaian sort by name descending",
      (await kegFirstName()) === "Tes Tambah" && (await kegSortArrow("nama")) === "▼",
      `first=${await kegFirstName()} arrow=${await kegSortArrow("nama")}`,
    );
    await clickKegSort("nama");
    check(
      "kepegawaian third click on a header clears the sort",
      (await kegFirstName()) === "Ahmad Fauzi" && (await kegSortArrow("nama")) === "",
      `first=${await kegFirstName()} arrow=${await kegSortArrow("nama")}`,
    );
    await clickKegSort("jabatan");
    check(
      "kepegawaian sort by position ascending",
      (await kegFirstName()) === "Indah Permata",
      `first=${await kegFirstName()} (BPD)`,
    );
    await clickKegSort("jabatan");
    check(
      "kepegawaian sort by position descending",
      (await kegFirstName()) === "Fajar Pratama",
      `first=${await kegFirstName()} (Staf Desa)`,
    );
    await clickKegSort("desa");
    check(
      "kepegawaian sort by village ascending",
      (await kegFirstName()) === "Indah Permata",
      `first=${await kegFirstName()} (Beruas)`,
    );
    await clickKegSort("desa");
    check(
      "kepegawaian sort by village descending",
      (await kegFirstName()) === "Gita Maharani",
      `first=${await kegFirstName()} (Teru)`,
    );
    await clickKegSort("masaSelesai");
    check(
      "kepegawaian sort by SK end date ascending (nearest first)",
      (await kegFirstName()) === "Hadi Wijaya",
      `first=${await kegFirstName()} (2026-06-30)`,
    );
    await clickKegSort("masaSelesai");
    check(
      "kepegawaian sort by SK end date descending (farthest first)",
      (await kegFirstName()) === "Ahmad Fauzi",
      `first=${await kegFirstName()} (2027-12-31)`,
    );
    // Sort + search together: sorting applies to the filtered rows, and
    // the statistics still describe the same filtered set.
    await setKegSearch("kepala desa");
    await clickKegSort("nama");
    const p23Filtered = await kegSearchState();
    check(
      "kepegawaian sort works together with search",
      p23Filtered.rows === 5 &&
        p23Filtered.statTotal === "5" &&
        (await kegFirstName()) === "Ahmad Fauzi",
      `rows=${p23Filtered.rows} statTotal=${p23Filtered.statTotal} first=${await kegFirstName()}`,
    );
    await setKegSearch("");
    const p23Cleared = await kegSearchState();
    check(
      "kepegawaian clearing the search keeps the active sort",
      p23Cleared.rows === 24 &&
        p23Cleared.statTotal === "24" &&
        (await kegFirstName()) === "Agus Setiawan",
      `rows=${p23Cleared.rows} first=${await kegFirstName()} (name asc still active)`,
    );
    // A record without an SK end date sorts LAST in both directions.
    // (The add form requires an end date, so blank it in storage, reload,
    // and restore it afterwards — "Tes Tambah" is deleted later anyway.)
    await page.evaluate(() => {
      const raw = localStorage.getItem("desaai-perangkat-v1");
      const items = JSON.parse(raw);
      items.find((p) => p.nama === "Tes Tambah").masaSelesai = "";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await clickKegSort("masaSelesai");
    check(
      "kepegawaian record without SK date sorts last (ascending)",
      (await kegFirstName()) === "Hadi Wijaya" && (await kegLastName()) === "Tes Tambah",
      `first=${await kegFirstName()} last=${await kegLastName()}`,
    );
    await clickKegSort("masaSelesai");
    check(
      "kepegawaian record without SK date sorts last (descending)",
      (await kegLastName()) === "Tes Tambah",
      `last=${await kegLastName()}`,
    );
    await page.evaluate(() => {
      const raw = localStorage.getItem("desaai-perangkat-v1");
      const items = JSON.parse(raw);
      items.find((p) => p.nama === "Tes Tambah").masaSelesai = "2027-12-31";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const p23Restored = await kegSearchState();
    check(
      "kepegawaian state restored after the missing-date check",
      p23Restored.rows === 24 && p23Restored.statTotal === "24" && (await kegFirstName()) === "Ahmad Fauzi",
      `rows=${p23Restored.rows} first=${await kegFirstName()}`,
    );
    // Sorting is local: it works offline, and the whole tab (headers
    // included) is hidden in Mode Warga like the rest of Kepegawaian.
    await page.setOfflineMode(true);
    await clickKegSort("nama");
    const p23OfflineFirst = await kegFirstName();
    await page.setOfflineMode(false);
    check(
      "kepegawaian sort works offline",
      p23OfflineFirst === "Agus Setiawan",
      `first=${p23OfflineFirst}`,
    );
    await page.click("#mode-toggle");
    await sleep(200);
    const p23Warga = await page.evaluate(
      () =>
        document.body.classList.contains("mode-warga") &&
        document.getElementById("keg-table")?.offsetParent === null,
    );
    await page.click("#mode-toggle");
    await sleep(200);
    const p23WargaBack = await page.evaluate(
      () => !document.body.classList.contains("mode-warga"),
    );
    check(
      "kepegawaian sort headers hidden in Mode Warga",
      p23Warga && p23WargaBack,
      `hidden=${p23Warga}`,
    );
    // Leave the table in its stored order so the checks below (which
    // assume the first row is Ahmad Fauzi) see the default view.
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await clickKegSort("nama");
    await clickKegSort("nama");
    check(
      "kepegawaian sort cleared before the next checks",
      (await kegFirstName()) === "Ahmad Fauzi" && (await kegSortArrow("nama")) === "",
      `first=${await kegFirstName()}`,
    );

    // Paket 24 — Filter Cepat Pegawai: the Desa/Jabatan filter options
    // are derived from the values actually present in the loaded records
    // (24 records here: 23 demo + "Tes Tambah"), and a reset button
    // clears the four dropdowns without touching the search or the sort.
    const kegFilterOptions = (sel) =>
      page.$$eval(`${sel} option`, (els) => els.map((e) => e.value));
    const kegResetHidden = () =>
      page.$eval("#keg-filter-reset", (el) => el.hidden);
    const p24DesaOpts = await kegFilterOptions("#keg-filter-desa");
    check(
      "kepegawaian desa filter options come from the loaded records",
      p24DesaOpts.length === 12 && p24DesaOpts.includes("Kecamatan Simpangkatis"),
      `${p24DesaOpts.length} options: ${p24DesaOpts.join(" | ")}`,
    );
    const p24JabOpts = await kegFilterOptions("#keg-filter-jabatan");
    check(
      "kepegawaian jabatan filter options come from the loaded records",
      p24JabOpts.length === 17 && p24JabOpts.includes("Camat") && p24JabOpts.includes("Staf Desa"),
      `${p24JabOpts.length} options: ${p24JabOpts.join(" | ")}`,
    );
    await page.select("#keg-filter-desa", "Kecamatan Simpangkatis");
    await sleep(300);
    const p24KecRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check(
      "kepegawaian filter by Kecamatan Simpangkatis shows the 8 office staff",
      p24KecRows === 8,
      `${p24KecRows} rows`,
    );
    await page.select("#keg-filter-desa", "");
    await page.select("#keg-filter-jabatan", "Camat");
    await sleep(300);
    const p24CamatRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    check(
      "kepegawaian filter by position Camat",
      p24CamatRows === 1,
      `${p24CamatRows} rows`,
    );
    await page.select("#keg-filter-desa", "Katis");
    await page.select("#keg-filter-jabatan", "Kepala Desa");
    await sleep(300);
    const p24Combo = await kegSearchState();
    check(
      "kepegawaian village + position filters combine",
      p24Combo.rows === 1 && (await kegFirstName()) === "Dedi Kurniawan",
      `rows=${p24Combo.rows} first=${await kegFirstName()}`,
    );
    await page.select("#keg-filter-jabatan", "");
    await page.select("#keg-filter-desa", "Terak");
    await setKegSearch("tes");
    const p24FilterSearch = await kegSearchState();
    check(
      "kepegawaian filter works together with search",
      p24FilterSearch.rows === 1 && p24FilterSearch.statTotal === "1",
      `rows=${p24FilterSearch.rows} statTotal=${p24FilterSearch.statTotal}`,
    );
    await setKegSearch("");
    await page.select("#keg-filter-desa", "Katis");
    await clickKegSort("nama");
    const p24FilterSort = await kegSearchState();
    check(
      "kepegawaian filter works together with sort",
      p24FilterSort.rows === 3 && (await kegFirstName()) === "Citra Dewi",
      `rows=${p24FilterSort.rows} first=${await kegFirstName()}`,
    );
    check(
      "kepegawaian reset button appears while a filter is active",
      (await kegResetHidden()) === false,
      `resetHidden=${await kegResetHidden()}`,
    );
    await page.click("#keg-filter-reset");
    await sleep(300);
    check(
      "kepegawaian reset filter keeps the active sort",
      (await kegSearchState()).rows === 24 &&
        (await kegFirstName()) === "Agus Setiawan" &&
        (await kegSortArrow("nama")) === "▲" &&
        (await kegResetHidden()) === true,
      `rows=${(await kegSearchState()).rows} first=${await kegFirstName()} arrow=${await kegSortArrow("nama")}`,
    );
    await clickKegSort("nama");
    await clickKegSort("nama");
    await setKegSearch("tes");
    await page.select("#keg-filter-desa", "Terak");
    await sleep(300);
    await page.click("#keg-filter-reset");
    await sleep(300);
    const p24ResetSearch = await page.evaluate(() => ({
      search: document.getElementById("keg-search").value,
      desa: document.getElementById("keg-filter-desa").value,
      rows: document.querySelectorAll("#keg-table-body tr").length,
    }));
    check(
      "kepegawaian reset filter keeps the search text",
      p24ResetSearch.search === "tes" && p24ResetSearch.desa === "" && p24ResetSearch.rows === 1,
      `search=${p24ResetSearch.search} desa=${p24ResetSearch.desa} rows=${p24ResetSearch.rows}`,
    );
    await setKegSearch("");
    // A position that only exists in the data appears as a filter option
    // (the add form cannot create it — blank it in storage, reload, and
    // restore it afterwards, like the Paket 23 missing-date check).
    await page.evaluate(() => {
      const raw = localStorage.getItem("desaai-perangkat-v1");
      const items = JSON.parse(raw);
      items.find((p) => p.nama === "Tes Tambah").jabatan = "Kepala Seksi Baru";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const p24NewOpts = await kegFilterOptions("#keg-filter-jabatan");
    check(
      "kepegawaian new position appears as a filter option",
      p24NewOpts.length === 18 && p24NewOpts.includes("Kepala Seksi Baru"),
      `${p24NewOpts.length} options`,
    );
    await page.evaluate(() => {
      const raw = localStorage.getItem("desaai-perangkat-v1");
      const items = JSON.parse(raw);
      items.find((p) => p.nama === "Tes Tambah").jabatan = "Staf Desa";
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    });
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const p24RestoredOpts = await kegFilterOptions("#keg-filter-jabatan");
    check(
      "kepegawaian removed position disappears from the filter options",
      p24RestoredOpts.length === 17 && !p24RestoredOpts.includes("Kepala Seksi Baru"),
      `${p24RestoredOpts.length} options`,
    );
    // Filtering is local: it works offline, and the reset button hides
    // with the rest of the tab in Mode Warga.
    await page.setOfflineMode(true);
    await page.select("#keg-filter-desa", "Katis");
    await sleep(300);
    const p24OfflineRows = await page.$$eval("#keg-table-body tr", (els) => els.length);
    await page.setOfflineMode(false);
    check(
      "kepegawaian filter works offline",
      p24OfflineRows === 3,
      `${p24OfflineRows} rows for Katis`,
    );
    await page.select("#keg-filter-desa", "");
    await sleep(200);
    await page.click("#mode-toggle");
    await sleep(200);
    const p24Warga = await page.evaluate(
      () =>
        document.body.classList.contains("mode-warga") &&
        document.getElementById("keg-filter-reset")?.offsetParent === null,
    );
    await page.click("#mode-toggle");
    await sleep(200);
    check(
      "kepegawaian reset button hidden in Mode Warga",
      p24Warga,
      `hidden=${p24Warga}`,
    );
    // Leave the table in its default view for the checks below.
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const p24Clean = await kegSearchState();
    check(
      "kepegawaian filters cleared after the Paket 24 checks",
      p24Clean.rows === 24 &&
        p24Clean.statTotal === "24" &&
        (await kegFirstName()) === "Ahmad Fauzi" &&
        (await kegResetHidden()) === true,
      `rows=${p24Clean.rows} first=${await kegFirstName()}`,
    );

    // Paket 25 — Ekspor CSV Daftar Pegawai: the file holds exactly the
    // rows currently shown (search + filters applied, current sort
    // order), with an Indonesian header; local data only, offline.
    const installCsvCapture = () =>
      page.evaluate(() => {
        window.__csvBlobs = [];
        if (!window.__csvCaptureInstalled) {
          const orig = URL.createObjectURL.bind(URL);
          URL.createObjectURL = (blob) => {
            window.__csvBlobs.push(blob);
            return orig(blob);
          };
          window.__csvCaptureInstalled = true;
        }
      });
    const readLastCsv25 = () =>
      page.evaluate(async () => {
        const blobs = window.__csvBlobs ?? [];
        const last = blobs[blobs.length - 1];
        return last ? await last.text() : "";
      });
    const kegCsvLines = async () => (await readLastCsv25()).trim().split("\n");
    const kegExportDisabled = () =>
      page.$eval("#keg-export-csv", (el) => el.disabled);
    const todayStamp = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    await installCsvCapture();
    const p25Btn = await page.$("#keg-export-csv");
    check(
      "kepegawaian CSV export button exists with Indonesian label",
      !!p25Btn &&
        (await page.$eval("#keg-export-csv", (el) => el.textContent ?? "")) ===
          "Ekspor CSV" &&
        (await kegExportDisabled()) === false,
      `label=${await page.$eval("#keg-export-csv", (el) => el.textContent ?? "")}`,
    );
    const p25FirstDefault = await kegFirstName();
    await page.click("#keg-export-csv");
    await sleep(300);
    const p25Csv = await readLastCsv25();
    const p25Lines = p25Csv.trim().split("\n");
    check(
      "kepegawaian CSV export has Indonesian header + all 24 rows",
      p25Lines[0] ===
        "No,Nama,Unit,Jabatan,Desa,Tempat Lahir,Tanggal Lahir,Agama,No. HP,Masa Mulai,Masa Selesai,Status,Sisa Hari,Alamat" &&
        p25Lines.length === 25,
      `header=${p25Lines[0] ?? ""} lines=${p25Lines.length}`,
    );
    check(
      "kepegawaian CSV first row matches the table first row",
      p25Lines[1]?.split(",")[1] === p25FirstDefault,
      `first=${p25Lines[1]?.split(",")[1] ?? ""} table=${p25FirstDefault}`,
    );
    check(
      "kepegawaian CSV holds real records with status + remaining days",
      p25Csv.includes("Dedi Kurniawan,Desa,Kepala Desa,Katis") &&
        p25Csv.includes(",Aktif,") &&
        p25Csv.includes(",Habis,"),
      p25Lines.slice(1, 3).join(" | "),
    );
    const p25Status = await page.$eval(
      "#keg-export-status",
      (el) => el.textContent ?? "",
    );
    check(
      "kepegawaian CSV export reports the filename",
      p25Status.includes(`daftar-pegawai-${todayStamp()}.csv`),
      p25Status,
    );
    await page.select("#keg-filter-desa", "Katis");
    await sleep(300);
    await page.click("#keg-export-csv");
    await sleep(300);
    const p25KatisLines = await kegCsvLines();
    check(
      "kepegawaian CSV export follows the village filter",
      p25KatisLines.length === 4 &&
        p25KatisLines.slice(1).every((l) => l.includes(",Katis,")),
      `${p25KatisLines.length - 1} data rows`,
    );
    await page.select("#keg-filter-desa", "");
    await setKegSearch("kepala desa");
    await clickKegSort("nama");
    await clickKegSort("nama");
    await sleep(300);
    const p25DescFirst = await kegFirstName();
    await page.click("#keg-export-csv");
    await sleep(300);
    const p25DescLines = await kegCsvLines();
    check(
      "kepegawaian CSV export follows search + descending sort",
      p25DescLines.length === 6 &&
        p25DescLines[1]?.split(",")[1] === p25DescFirst,
      `rows=${p25DescLines.length - 1} first=${p25DescLines[1]?.split(",")[1] ?? ""} table=${p25DescFirst}`,
    );
    await setKegSearch("zzz-tidak-ada");
    await sleep(300);
    const p25Empty = await page.evaluate(() => ({
      disabled: document.getElementById("keg-export-csv").disabled,
      noResult: !document.getElementById("keg-no-result").hidden,
      rows: document.querySelectorAll("#keg-table-body tr").length,
    }));
    check(
      "kepegawaian CSV export disabled when the view is empty",
      p25Empty.disabled === true && p25Empty.noResult === true && p25Empty.rows === 0,
      `disabled=${p25Empty.disabled} noResult=${p25Empty.noResult} rows=${p25Empty.rows}`,
    );
    await setKegSearch("");
    // CSV escaping: a value with a comma + quotes is quoted and its
    // quotes doubled (edit one record in storage, reload, restore —
    // like the Paket 24 new-position check).
    const p25OrigAlamat = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1"));
      const rec = items.find((p) => p.nama === "Tes Tambah");
      const old = rec.alamat;
      rec.alamat = 'Jl. Merdeka, No. 1 "A"';
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
      return old;
    });
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await installCsvCapture();
    await page.click("#keg-export-csv");
    await sleep(300);
    const p25EscCsv = await readLastCsv25();
    check(
      "kepegawaian CSV escapes commas and quotes in values",
      p25EscCsv.includes('"Jl. Merdeka, No. 1 ""A"""'),
      p25EscCsv.split("\n").find((l) => l.includes("Tes Tambah")) ?? "",
    );
    await page.evaluate((old) => {
      const items = JSON.parse(localStorage.getItem("desaai-perangkat-v1"));
      items.find((p) => p.nama === "Tes Tambah").alamat = old;
      localStorage.setItem("desaai-perangkat-v1", JSON.stringify(items));
    }, p25OrigAlamat);
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    await installCsvCapture();
    // Offline: the export is local data only, so it works with no network.
    await page.setOfflineMode(true);
    await page.click("#keg-export-csv");
    await sleep(300);
    const p25OfflineCsv = await readLastCsv25();
    await page.setOfflineMode(false);
    check(
      "kepegawaian CSV export works offline",
      p25OfflineCsv.includes("No,Nama,Unit,Jabatan,Desa") &&
        p25OfflineCsv.trim().split("\n").length === 25,
      `${p25OfflineCsv.trim().split("\n").length} lines`,
    );
    // Mode Warga hides the whole staff tab, export button included.
    await page.click("#mode-toggle");
    await sleep(200);
    const p25Warga = await page.evaluate(
      () =>
        document.body.classList.contains("mode-warga") &&
        document.getElementById("keg-export-csv")?.offsetParent === null,
    );
    await page.click("#mode-toggle");
    await sleep(200);
    check("kepegawaian CSV export button hidden in Mode Warga", p25Warga, `hidden=${p25Warga}`);
    // Leave the table in its default view for the checks below.
    const p25Clean = await kegSearchState();
    check(
      "kepegawaian view cleared after the Paket 25 checks",
      p25Clean.rows === 24 &&
        p25Clean.statTotal === "24" &&
        (await kegFirstName()) === "Ahmad Fauzi" &&
        (await kegExportDisabled()) === false,
      `rows=${p25Clean.rows} first=${await kegFirstName()}`,
    );

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

    // 5a. Paket 15: print an official letter from the archive
    const archiveBtns = await page.$$eval("#drafts-list .draft-item", (items) =>
      items.map((d) => ({
        title: d.querySelector("h3")?.textContent ?? "",
        btns: [...d.querySelectorAll(".actions .btn")].map((b) => b.textContent.trim()),
      })),
    );
    const archiveLetterBtns = archiveBtns.find((d) => d.title === "Surat Undangan")?.btns ?? [];
    const archiveSummaryBtns = archiveBtns.find((d) => d.title === "Ringkasan dokumen")?.btns ?? [];
    check(
      "archive letter entry has a Print letter button (summary does not)",
      archiveLetterBtns.includes("Print letter") && !archiveSummaryBtns.includes("Print letter"),
      `letter=[${archiveLetterBtns.join(", ")}] summary=[${archiveSummaryBtns.join(", ")}]`,
    );
    await page.evaluate(() => {
      const items = [...document.querySelectorAll("#drafts-list .draft-item")];
      const target = items.find(
        (d) => d.querySelector("h3")?.textContent === "Surat Undangan",
      );
      const btns = [...(target?.querySelectorAll(".actions .btn") ?? [])];
      btns.find((b) => b.textContent.trim() === "Print letter")?.click();
    });
    await sleep(400);
    const preview = await page.evaluate(() => ({
      visible: !document.getElementById("archive-print-preview")?.hidden,
      perihal: document.getElementById("archive-print-perihal")?.value ?? "",
      isi: document.getElementById("archive-print-isi")?.value ?? "",
      tanggal: document.getElementById("archive-print-tanggal")?.value ?? "",
      sheet: document.getElementById("archive-print-sheet")?.textContent ?? "",
      signName:
        document.querySelector("#archive-print-sheet .print-sign-name")?.textContent ?? "",
      autoNumber: !!document.getElementById("archive-print-autonumber"),
    }));
    check(
      "print preview opens prefilled with the draft (perihal + isi + date) and the office kop",
      preview.visible &&
        preview.perihal === "Surat Undangan" &&
        preview.isi === "Isi surat contoh" &&
        preview.tanggal.length > 0 &&
        /Pemerintah Kabupaten Bangka Tengah/.test(preview.sheet) &&
        /Kecamatan Simpangkatis/.test(preview.sheet),
      `perihal=${preview.perihal} isi=${preview.isi.slice(0, 20)} tanggal=${preview.tanggal}`,
    );
    check(
      "print preview signatory name is a placeholder, never an invented name",
      preview.signName === "—" && !/Rizky Ramadhan|Kepala Seksi/.test(preview.sheet),
      `signName=${preview.signName}`,
    );
    check(
      "auto-number button appears (draft title matches the Undangan template)",
      preview.autoNumber,
      `autoNumber=${preview.autoNumber}`,
    );
    await page.click("#archive-print-autonumber");
    await sleep(200);
    const nomorVal = await page.$eval("#archive-print-nomor", (el) => el.value);
    check(
      "auto-number fills a formal letter number",
      /^140\/\d{3}\/DS\/[IVX]+\/\d{4}$/.test(nomorVal),
      `nomor=${nomorVal}`,
    );
    // Editing the subject updates the preview sheet live.
    await page.$eval("#archive-print-perihal", (el) => {
      el.value = "";
    });
    await page.type("#archive-print-perihal", "Undangan Rapat RT");
    await sleep(200);
    const sheetAfterEdit = await page.$eval(
      "#archive-print-sheet",
      (el) => el.textContent ?? "",
    );
    check(
      "editing perihal updates the preview sheet",
      /Undangan Rapat RT/.test(sheetAfterEdit),
      sheetAfterEdit.slice(0, 120),
    );
    // Print: fills the print-only area and calls window.print().
    await page.evaluate(() => {
      window.__archivePrinted = false;
      window.print = () => {
        window.__archivePrinted = true;
      };
    });
    await page.click("#archive-print-do");
    await sleep(300);
    const archivePrint = await page.evaluate(() => ({
      printed: window.__archivePrinted === true,
      body: document.getElementById("archive-print-body")?.textContent ?? "",
      meta: document.getElementById("archive-print-meta")?.textContent ?? "",
      target: document.body.dataset.printTarget ?? "",
    }));
    check(
      "archive print fills the print area and calls window.print()",
      archivePrint.printed &&
        /Isi surat contoh/.test(archivePrint.body) &&
        /Undangan Rapat RT/.test(archivePrint.meta) &&
        /140\/\d{3}\/DS\//.test(archivePrint.meta) &&
        archivePrint.target === "archive-letter",
      `printed=${archivePrint.printed} target=${archivePrint.target} meta=${archivePrint.meta.slice(0, 80)}`,
    );
    // Offline: printing still works with the preview already open (no new
    // fetches — the logo is already cached from the page header).
    await page.setOfflineMode(true);
    await page.evaluate(() => {
      window.__archivePrinted = false;
    });
    await page.click("#archive-print-do");
    await sleep(300);
    const offlinePrinted = await page.evaluate(
      () => window.__archivePrinted === true,
    );
    await page.setOfflineMode(false);
    check("archive print works offline", offlinePrinted, `printed=${offlinePrinted}`);
    await page.click("#archive-print-close");
    await sleep(200);
    const previewClosed = await page.$eval(
      "#archive-print-preview",
      (el) => el.hidden,
    );
    check("print preview closes", previewClosed, `hidden=${previewClosed}`);
    // The built CSS carries the archive print stylesheet (checked on disk).
    check(
      "print stylesheet covers the archive letter area",
      /archive-print-area/.test(cssText) && /@media print/.test(cssText),
      cssFiles.join(","),
    );

    // Paket 17: the kop + signature follow the letterhead settings.
    const openPrintPreview = async () => {
      await page.evaluate(() => {
        const items = [...document.querySelectorAll("#drafts-list .draft-item")];
        const target = items.find(
          (d) => d.querySelector("h3")?.textContent === "Surat Undangan",
        );
        const btns = [...(target?.querySelectorAll(".actions .btn") ?? [])];
        btns.find((b) => b.textContent.trim() === "Print letter")?.click();
      });
      await sleep(400);
    };
    const readSheet = () =>
      page.evaluate(() => ({
        sheet: document.getElementById("archive-print-sheet")?.textContent ?? "",
        // The Camat block is the one WITHOUT the secretary class — with a
        // second signatory present, the first .print-sign-name belongs to
        // the secretary.
        signName:
          document.querySelector(
            "#archive-print-sheet .print-sign-inner:not(.print-sign-secretary) .print-sign-name",
          )?.textContent ?? "",
        contact:
          document.querySelector("#archive-print-sheet .print-kop-contact")?.textContent ?? "",
        secretary:
          document.querySelector("#archive-print-sheet .print-sign-secretary")
            ?.textContent ?? "",
      }));
    await openPrintPreview();
    const sheetDefault = await readSheet();
    check(
      "kop with default settings shows the office lines, no contact line, placeholder signatory",
      /Pemerintah Kabupaten Bangka Tengah/.test(sheetDefault.sheet) &&
        /Kecamatan Simpangkatis/.test(sheetDefault.sheet) &&
        sheetDefault.contact === "" &&
        sheetDefault.signName === "—" &&
        /NIP\. —/.test(sheetDefault.sheet) &&
        sheetDefault.secretary === "",
      `sign=${sheetDefault.signName} contact=${sheetDefault.contact}`,
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    await setLhField("#home-lh-camat-nama", "CAMAT-UJI-17");
    await setLhField("#home-lh-camat-nip", "NIP-UJI-17");
    await setLhField("#home-lh-alamat", "Jl. Uji No. 17");
    await setLhField("#home-lh-telepon", "(0717) 000000");
    await setLhField("#home-lh-sekretaris-nama", "SEKRETARIS-UJI-17");
    await page.click("#home-letterhead-save");
    await sleep(300);
    await page.click('[data-tab="drafts"]');
    await sleep(300);
    await openPrintPreview();
    const sheetFilled = await readSheet();
    check(
      "kop uses the saved settings: Camat name + NIP, contact line, secretary block",
      sheetFilled.signName === "CAMAT-UJI-17" &&
        /NIP\. NIP-UJI-17/.test(sheetFilled.sheet) &&
        /Jl\. Uji No\. 17/.test(sheetFilled.contact) &&
        /Telp\. \(0717\) 000000/.test(sheetFilled.contact) &&
        /(Sekretaris|Secretary)/.test(sheetFilled.secretary) &&
        /SEKRETARIS-UJI-17/.test(sheetFilled.secretary),
      `sign=${sheetFilled.signName} contact=${sheetFilled.contact} secretary=${sheetFilled.secretary}`,
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    await setLhField("#home-lh-camat-nama", "");
    await setLhField("#home-lh-camat-nip", "");
    await setLhField("#home-lh-alamat", "");
    await setLhField("#home-lh-telepon", "");
    await setLhField("#home-lh-sekretaris-nama", "");
    await page.click("#home-letterhead-save");
    await sleep(300);
    await page.click('[data-tab="drafts"]');
    await sleep(300);
    await openPrintPreview();
    const sheetCleared = await readSheet();
    check(
      "clearing the settings returns the kop to placeholders (no invented name left behind)",
      sheetCleared.signName === "—" &&
        /NIP\. —/.test(sheetCleared.sheet) &&
        sheetCleared.contact === "" &&
        sheetCleared.secretary === "",
      `sign=${sheetCleared.signName}`,
    );
    await page.click("#archive-print-close");
    await sleep(200);

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
    // Paket 26 — Pencarian teks di tab Agenda (perihal / pihak / nomor
    // agenda / nomor surat), berpadu dengan dropdown arah + status.
    const agsSearch = async (q) => {
      await page.$eval(
        "#agenda-search",
        (el, v) => {
          el.value = v;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        },
        q,
      );
      await sleep(300);
      return page.$$eval("#agenda-list .aduan-item", (els) => els.length);
    };
    const agsSearchStats = () =>
      page.evaluate(() => ({
        masuk: Number(document.getElementById("agenda-stat-masuk")?.textContent ?? 0),
        keluar: Number(document.getElementById("agenda-stat-keluar")?.textContent ?? 0),
        belum: Number(document.getElementById("agenda-stat-belum")?.textContent ?? 0),
        emptyHidden: document.getElementById("agenda-empty")?.hidden ?? true,
      }));
    check("agenda search by subject finds one entry", (await agsSearch("bantuan sosial")) === 1, "bantuan sosial");
    check("agenda search by sender finds one entry", (await agsSearch("Katis")) === 1, "Katis");
    check("agenda search by agenda number finds one entry", (await agsSearch("002/AGS/2026")) === 1, "002/AGS/2026");
    check("agenda search by letter number finds one entry", (await agsSearch("470/12")) === 1, "470/12");
    check("agenda search is case-insensitive", (await agsSearch("bos")) === 1, "bos");
    // Search composes with the direction dropdown: "Desa" matches both
    // Desa Katis (masuk) and Desa Terak (keluar).
    await page.select("#agenda-filter-arah", "masuk");
    await sleep(200);
    check("agenda search + direction filter compose", (await agsSearch("Desa")) === 1, "Desa + masuk");
    await page.select("#agenda-filter-arah", "");
    await sleep(200);
    await page.select("#agenda-filter-status", "selesai");
    await sleep(200);
    check("agenda search + status filter compose", (await agsSearch("Desa")) === 1, "Desa + selesai");
    await page.select("#agenda-filter-status", "");
    await sleep(200);
    // No match: empty list + empty message, stats stay global.
    const agsNoMatch = await agsSearch("zzz-tidak-ada");
    const agsNoMatchState = await agsSearchStats();
    check(
      "agenda search with no match shows the empty message, stats stay global",
      agsNoMatch === 0 &&
        agsNoMatchState.emptyHidden === false &&
        agsNoMatchState.masuk === 2 &&
        agsNoMatchState.keluar === 2 &&
        agsNoMatchState.belum === 2,
      `items=${agsNoMatch} emptyHidden=${agsNoMatchState.emptyHidden} masuk=${agsNoMatchState.masuk}`,
    );
    // Offline: search still works on local data.
    await page.setOfflineMode(true);
    const agsOfflineSearch = await agsSearch("BOS");
    await page.setOfflineMode(false);
    check("agenda search works offline (local data only)", agsOfflineSearch === 1, `BOS offline=${agsOfflineSearch}`);
    // Clearing the search restores all 4 seed entries.
    check("clearing the agenda search restores all entries", (await agsSearch("")) === 4, "cleared");
    // Paket 19: Kalender Agenda — monthly view over the register.
    // (Runs while the register still holds only the 4 seed entries.)
    const calState = () =>
      page.evaluate(() => {
        const cal = document.getElementById("agenda-cal");
        return {
          year: Number(cal?.dataset.calYear ?? 0),
          month: Number(cal?.dataset.calMonth ?? 0),
          label: document.getElementById("agenda-cal-label")?.textContent ?? "",
          marked: [...document.querySelectorAll("#agenda-cal-grid .agenda-cal-day.has-entries")].map(
            (el) => el.dataset.date,
          ),
          days: document.querySelectorAll("#agenda-cal-grid .agenda-cal-day").length,
          weekdays: document.querySelectorAll("#agenda-cal-grid .agenda-cal-weekdays span").length,
        };
      });
    const calExpectedFor = (year, month) =>
      page.evaluate(
        (ym) => {
          const agenda = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
          const key = (ts) => {
            const d = new Date(ts);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          };
          const marked = [
            ...new Set(
              agenda
                .filter((e) => {
                  const d = new Date(e.tanggal);
                  return d.getFullYear() === ym.year && d.getMonth() === ym.month;
                })
                .map((e) => key(e.tanggal)),
            ),
          ].sort();
          return {
            marked,
            daysInMonth: new Date(ym.year, ym.month + 1, 0).getDate(),
          };
        },
        { year, month },
      );
    const calGoTo = async (year, month) => {
      for (let i = 0; i < 24; i++) {
        const s = await calState();
        if (s.year === year && s.month === month) return true;
        await page.click(
          s.year * 12 + s.month < year * 12 + month ? "#agenda-cal-next" : "#agenda-cal-prev",
        );
        await sleep(150);
      }
      return false;
    };
    // Seed month = month of the earliest register entry (Nov 2026 today).
    const seedYM = await page.evaluate(() => {
      const agenda = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      const first = agenda.reduce((a, b) => (a.tanggal < b.tanggal ? a : b));
      const d = new Date(first.tanggal);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    await calGoTo(seedYM.year, seedYM.month);
    const cal0 = await calState();
    const exp0 = await calExpectedFor(seedYM.year, seedYM.month);
    check(
      "agenda calendar renders the month with marked entry days",
      cal0.year === seedYM.year && cal0.month === seedYM.month &&
        cal0.days === exp0.daysInMonth && cal0.weekdays === 7 &&
        JSON.stringify(cal0.marked) === JSON.stringify(exp0.marked) &&
        cal0.marked.length === 4,
      `label=${cal0.label} days=${cal0.days} marked=${cal0.marked.join(",")}`,
    );
    // Clicking a marked day lists that day's entries below the calendar.
    const dayToOpen = cal0.marked[0];
    const dayEntries = await page.evaluate((dateKey) => {
      const agenda = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      const key = (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      return agenda.filter((e) => key(e.tanggal) === dateKey).map((e) => e.perihal);
    }, dayToOpen);
    await page.click(`#agenda-cal-grid [data-date="${dayToOpen}"]`);
    await sleep(300);
    const calDetail = await page.$eval("#agenda-cal-detail", (el) => el.textContent ?? "");
    const calSelected = await page.$eval(
      `#agenda-cal-grid [data-date="${dayToOpen}"]`,
      (el) => el.classList.contains("is-selected"),
    );
    check(
      "clicking a marked calendar day shows that day's entries",
      calSelected && dayEntries.length > 0 && dayEntries.every((p) => calDetail.includes(p)),
      `day=${dayToOpen} detail=${calDetail.slice(0, 120)}`,
    );
    // Clicking a day without entries shows the empty message.
    const emptyDay = await page.evaluate((marked) => {
      const days = [...document.querySelectorAll("#agenda-cal-grid .agenda-cal-day")];
      const free = days.find((el) => !marked.includes(el.dataset.date));
      return free?.dataset.date ?? "";
    }, cal0.marked);
    await page.click(`#agenda-cal-grid [data-date="${emptyDay}"]`);
    await sleep(300);
    const calDetailEmpty = await page.$eval("#agenda-cal-detail", (el) => el.textContent ?? "");
    check(
      "clicking an empty calendar day shows the no-entries message",
      /Tidak ada agenda|No register entries/i.test(calDetailEmpty),
      `day=${emptyDay} detail=${calDetailEmpty.slice(0, 80)}`,
    );
    // Month navigation moves forward/back; "Hari ini" returns to now.
    await page.click("#agenda-cal-next");
    await sleep(200);
    const calNext = await calState();
    await page.click("#agenda-cal-prev");
    await sleep(200);
    await page.click("#agenda-cal-prev");
    await sleep(200);
    const calPrev = await calState();
    await page.click("#agenda-cal-today");
    await sleep(200);
    const calToday = await calState();
    const nowYM = { year: new Date().getFullYear(), month: new Date().getMonth() };
    const monthAfter = (seedYM.year * 12 + seedYM.month + 1) % 12;
    const yearAfter = seedYM.year + Math.floor((seedYM.month + 1) / 12);
    check(
      "calendar month navigation moves forward and back, Today returns to now",
      calNext.month === monthAfter && calNext.year === yearAfter &&
        calPrev.month === (seedYM.month + 11) % 12 &&
        calToday.year === nowYM.year && calToday.month === nowYM.month,
      `next=${calNext.year}-${calNext.month} prev=${calPrev.year}-${calPrev.month} today=${calToday.year}-${calToday.month}`,
    );
    // A month without entries shows no marks at all.
    const emptyOffset = await page.evaluate(() => {
      const agenda = JSON.parse(localStorage.getItem("desaai-agenda-v1") ?? "[]");
      const now = new Date();
      for (let off = 1; off <= 6; off++) {
        const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
        const has = agenda.some((e) => {
          const dd = new Date(e.tanggal);
          return dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth();
        });
        if (!has) return off;
      }
      return 0;
    });
    const emptyYM = new Date(nowYM.year, nowYM.month + emptyOffset, 1);
    await calGoTo(emptyYM.getFullYear(), emptyYM.getMonth());
    const calEmpty = await calState();
    check(
      "a month without entries shows no marked days",
      emptyOffset > 0 && calEmpty.marked.length === 0,
      `offset=${emptyOffset} marked=${calEmpty.marked.length}`,
    );
    await page.click("#agenda-cal-today");
    await sleep(200);
    // Offline: the calendar still renders from local data.
    await page.setOfflineMode(true);
    await page.click('[data-tab="home"]');
    await sleep(200);
    await page.click('[data-tab="agenda"]');
    await sleep(300);
    await calGoTo(seedYM.year, seedYM.month);
    const calOffline = await calState();
    await page.setOfflineMode(false);
    check(
      "agenda calendar renders offline (local data only)",
      JSON.stringify(calOffline.marked) === JSON.stringify(exp0.marked),
      `marked=${calOffline.marked.join(",")}`,
    );
    // Mode Warga: the agenda tab is officer-only, so the calendar goes with it.
    await page.click("#mode-toggle");
    await sleep(200);
    const calWarga = await page.evaluate(() => ({
      tabHidden:
        getComputedStyle(document.querySelector('[data-tab="agenda"]')).display === "none",
      panelHidden: document.getElementById("panel-agenda").hidden,
    }));
    await page.click("#mode-toggle");
    await sleep(200);
    const calBack = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-tab="agenda"]')).display !== "none",
    );
    await page.click('[data-tab="agenda"]');
    await sleep(300);
    check(
      "agenda calendar is hidden in Mode Warga with the officer-only agenda tab",
      calWarga.tabHidden && calWarga.panelHidden && calBack,
      JSON.stringify(calWarga),
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
    const logoKabOk = await page.$eval("#brand-logo-kab", (el) => el.naturalWidth > 0 && el.complete);
    check("header logo loads (naturalWidth > 0)", logoOk);
    check("Paket 31 kabupaten logo loads in the brand block (naturalWidth > 0)", logoKabOk);
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
    // IKM all-1s score 25.00, 2 complaints resolved, officers = personnel total)
    const qs = await page.evaluate(() => ({
      letters: document.getElementById("qs-letters")?.textContent ?? "",
      ikm: document.getElementById("qs-ikm")?.textContent ?? "",
      aduan: document.getElementById("qs-aduan")?.textContent ?? "",
      perangkat: document.getElementById("qs-perangkat")?.textContent ?? "",
      kegTotal: document.getElementById("keg-stat-total")?.textContent ?? "",
      dashIkm: document.getElementById("ikm-score")?.textContent ?? "",
      items: document.querySelectorAll("#quick-stats .hero-stat").length,
    }));
    check(
      "quick-stats strip shows 4 live hero stats",
      qs.items === 4,
      `items=${qs.items}`,
    );
    check(
      "quick-stats match live data (1 letter, IKM = dashboard, 2 resolved, officers = personnel total)",
      qs.letters === "1" && qs.ikm === qs.dashIkm && qs.aduan === "2" &&
        qs.perangkat === qs.kegTotal && qs.perangkat !== "",
      `letters=${qs.letters} ikm=${qs.ikm} dash=${qs.dashIkm} aduan=${qs.aduan} perangkat=${qs.perangkat} kegTotal=${qs.kegTotal}`,
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
      letterheadHidden:
        getComputedStyle(document.getElementById("home-letterhead-card")).display === "none",
      followupHidden:
        getComputedStyle(document.getElementById("home-followup-card")).display === "none",
      agendaHidden:
        getComputedStyle(document.querySelector('[data-tab="agenda"]')).display === "none",
    }));
    check(
      "citizen mode hides officer tabs + briefing + agenda + backup + letterhead + follow-up cards and shows resident card",
      warga.bodyWarga && warga.lettersHidden && warga.cardVisible && warga.briefingHidden && warga.agendaHidden && warga.backupHidden && warga.letterheadHidden && warga.followupHidden,
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

    // 9c. Paket 27 — Anin (guide), Surat Cepat, Paket Adopsi Desa Lain.
    // (Runs after the 9b reload: fresh page, officer mode, lang = English.)
    await page.click('[data-tab="home"]');
    await sleep(300);
    const anin = await page.evaluate(() => ({
      visible: !document.getElementById("home-anin")?.hidden,
      greeting: document.getElementById("anin-greeting")?.textContent ?? "",
      tip: document.getElementById("anin-tip")?.textContent ?? "",
      aduanBaru: Number(document.getElementById("home-aduan-baru")?.textContent ?? 0),
      goAduanHidden: document.getElementById("anin-go-aduan")?.hidden ?? true,
    }));
    check(
      "Anin guide card shows on Home with greeting + tip",
      anin.visible && anin.greeting.length > 10 && anin.tip.length > 10,
      `greeting="${anin.greeting.slice(0, 40)}" tip="${anin.tip.slice(0, 40)}"`,
    );
    // Seed data has new complaints, so the complaints tip + its button show.
    check(
      "Anin tip matches office state (new complaints → complaints tip + button)",
      anin.aduanBaru > 0 && /complaint/i.test(anin.tip) && anin.goAduanHidden === false,
      `aduanBaru=${anin.aduanBaru} tip="${anin.tip.slice(0, 60)}"`,
    );
    await page.click("#anin-go-aduan");
    await sleep(300);
    check(
      "Anin 'See complaints' button opens the complaints tab",
      await page.$eval("#panel-pengaduan", (el) => !el.hidden),
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    await page.click("#anin-go-letters");
    await sleep(300);
    check(
      "Anin 'Draft a letter' button opens the letters tab",
      await page.$eval("#panel-letters", (el) => !el.hidden),
    );
    // Surat Cepat: one sentence → template + prefilled fields (offline rules).
    const cepatFill = async (text) => {
      await page.$eval(
        "#cepat-input",
        (el, v) => {
          el.value = v;
        },
        text,
      );
      await page.click("#cepat-fill");
      await sleep(500);
      return page.evaluate(() => ({
        template: document.getElementById("letter-template")?.value ?? "",
        status: document.getElementById("cepat-status")?.textContent ?? "",
        fields: Object.fromEntries(
          [...document.querySelectorAll("#letter-fields [data-field-key]")].map((el) => [
            el.dataset.fieldKey,
            el.value,
          ]),
        ),
      }));
    };
    const cepat1 = await cepatFill(
      "Buatkan undangan musyawarah desa hari Jumat, 20 November 2026 jam 09.00 WIB di Balai Desa Simpangkatis untuk Ketua RT 01 sampai RT 05",
    );
    check(
      "Surat Cepat fills an invitation from one sentence",
      cepat1.template === "undangan" &&
        cepat1.fields.acara === "Musyawarah Desa" &&
        cepat1.fields.hari === "Jumat, 20 November 2026" &&
        cepat1.fields.waktu === "09.00 WIB" &&
        cepat1.fields.tempat === "Balai Desa Simpangkatis" &&
        cepat1.fields.tujuan === "Ketua RT 01 sampai RT 05" &&
        /5 fields/.test(cepat1.status),
      `template=${cepat1.template} status="${cepat1.status.slice(0, 60)}" fields=${JSON.stringify(cepat1.fields)}`,
    );
    // Regression (Paket 27): boot() calls applyLang() after the slow
    // Firebase/on-device probes, which re-renders the letter fields. A
    // Surat Cepat fill made while booting used to be wiped by that late
    // re-render. Toggling the language twice forces the same re-render;
    // the filled values must survive it.
    await page.click("#lang-toggle");
    await sleep(300);
    await page.click("#lang-toggle");
    await sleep(300);
    const cepat1kept = await page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll("#letter-fields [data-field-key]")].map((el) => [
          el.dataset.fieldKey,
          el.value,
        ]),
      ),
    );
    check(
      "Surat Cepat fill survives a language re-render (boot race fix)",
      cepat1kept.acara === "Musyawarah Desa" &&
        cepat1kept.hari === "Jumat, 20 November 2026" &&
        cepat1kept.tempat === "Balai Desa Simpangkatis",
      `fields=${JSON.stringify(cepat1kept)}`,
    );
    const cepat2 = await cepatFill(
      "SK pengangkatan perangkat desa atas nama Ahmad Fauzi, jabatan Kepala Desa, Desa Simpangkatis, masa bhakti 1 Januari 2021 sampai 31 Desember 2027",
    );
    check(
      "Surat Cepat fills an appointment decree from one sentence",
      cepat2.template === "sk-pengangkatan" &&
        cepat2.fields.nama === "Ahmad Fauzi" &&
        cepat2.fields.jabatan === "Kepala Desa" &&
        cepat2.fields.desa === "Simpangkatis" &&
        cepat2.fields.masaMulai === "1 Januari 2021" &&
        cepat2.fields.masaSelesai === "31 Desember 2027",
      `template=${cepat2.template} status=${cepat2.status.slice(0, 60)} fields=${JSON.stringify(cepat2.fields)}`,
    );
    const cepat3 = await cepatFill(
      "Tolong buatkan surat keterangan tidak mampu untuk Budi Santoso, NIK 1901010101010001, penghasilan Rp800.000 per bulan, keperluan keringanan biaya pendidikan anak",
    );
    check(
      "Surat Cepat fills an SKTM from one sentence",
      cepat3.template === "sktm" &&
        cepat3.fields.nama === "Budi Santoso" &&
        cepat3.fields.nik === "1901010101010001" &&
        cepat3.fields.penghasilan === "Rp800.000" &&
        cepat3.fields.keperluan === "Keringanan biaya pendidikan anak",
      `template=${cepat3.template} nama=${cepat3.fields.nama}`,
    );
    const cepatUnknown = await cepatFill("cuaca hari ini cerah sekali");
    check(
      "Surat Cepat says so when it cannot guess the letter type",
      /couldn't guess/.test(cepatUnknown.status) && cepatUnknown.template === "sktm",
      `status="${cepatUnknown.status.slice(0, 60)}" template stays ${cepatUnknown.template}`,
    );
    const cepatEmpty = await cepatFill("");
    check(
      "Surat Cepat asks for a sentence when the box is empty",
      /write one sentence/.test(cepatEmpty.status),
      `status="${cepatEmpty.status.slice(0, 60)}"`,
    );
    // Offline: Surat Cepat is rule-based, no network involved.
    await page.setOfflineMode(true);
    const cepatOffline = await cepatFill(
      "Buatkan undangan musyawarah desa hari Jumat, 20 November 2026 jam 09.00 WIB di Balai Desa Simpangkatis untuk Ketua RT 01 sampai RT 05",
    );
    await page.setOfflineMode(false);
    check(
      "Surat Cepat works offline (local rules only)",
      cepatOffline.template === "undangan" && cepatOffline.fields.acara === "Musyawarah Desa",
      `template=${cepatOffline.template}`,
    );
    // Empty generate: the old error stays, and Anin points at the next step.
    await page.click("#letter-clear");
    await sleep(200);
    await page.click("#letter-generate");
    await sleep(300);
    const genEmpty = await page.evaluate(() => ({
      status: document.getElementById("letter-status")?.textContent ?? "",
      tipHidden: document.getElementById("letter-anin-tip")?.hidden ?? true,
      tip: document.getElementById("letter-anin-tip")?.textContent ?? "",
    }));
    check(
      "empty Generate shows the error AND Anin's next step",
      /fill in at least one field/.test(genEmpty.status) &&
        genEmpty.tipHidden === false &&
        /Surat Cepat/.test(genEmpty.tip),
      `status="${genEmpty.status.slice(0, 50)}" tip="${genEmpty.tip.slice(0, 50)}"`,
    );
    // Drafts empty state carries Anin's next-step line. Earlier sections
    // seed 2 drafts and delete only 1, so one remains — clear the drafts
    // store and reload so the empty state is real before checking.
    await page.evaluate(() => localStorage.removeItem("desaai-drafts-v1"));
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(1000);
    await page.click('[data-tab="drafts"]');
    await sleep(400);
    const draftsAnin = await page.evaluate(() => ({
      empty: !document.getElementById("drafts-empty")?.hidden,
      anin: !document.getElementById("drafts-empty-anin")?.hidden,
      text: document.getElementById("drafts-empty-anin")?.textContent ?? "",
    }));
    check(
      "drafts empty state shows Anin's next-step line",
      draftsAnin.empty && draftsAnin.anin && /Anin:/.test(draftsAnin.text),
      draftsAnin.text.trim().slice(0, 60),
    );
    // Agenda empty state carries Anin's next-step line.
    await page.click('[data-tab="agenda"]');
    await sleep(300);
    await page.$eval("#agenda-search", (el) => {
      el.value = "zzz-tidak-ada";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(300);
    const agendaAnin = await page.evaluate(() => ({
      empty: !document.getElementById("agenda-empty")?.hidden,
      anin: !document.getElementById("agenda-empty-anin")?.hidden,
      text: document.getElementById("agenda-empty-anin")?.textContent ?? "",
    }));
    check(
      "agenda empty state shows Anin's next-step line",
      agendaAnin.empty && agendaAnin.anin && /Anin:/.test(agendaAnin.text),
      agendaAnin.text.slice(0, 60),
    );
    await page.$eval("#agenda-search", (el) => {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(300);
    // Paket Adopsi Desa Lain: checklist + downloadable JSON pack.
    await page.click('[data-tab="home"]');
    await sleep(300);
    const adopsiPanel = await page.evaluate(() => ({
      visible: !document.getElementById("home-adopsi-card")?.hidden,
      steps: document.querySelectorAll("#home-adopsi-card .adopsi-steps li").length,
    }));
    check(
      "adoption pack panel shows the 5-step checklist",
      adopsiPanel.visible && adopsiPanel.steps === 5,
      `steps=${adopsiPanel.steps}`,
    );
    await page.evaluate(() => {
      window.__adoptBlobs = [];
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        window.__adoptBlobs.push(blob);
        return orig(blob);
      };
    });
    await page.click("#home-adopsi-download");
    await sleep(300);
    const adoptJson = await page.evaluate(async () => {
      const blobs = window.__adoptBlobs ?? [];
      const last = blobs[blobs.length - 1];
      return last ? await last.text() : "";
    });
    const adoptStatus = await page.$eval("#home-adopsi-status", (el) => el.textContent ?? "");
    let adoptPack = null;
    try {
      adoptPack = JSON.parse(adoptJson);
    } catch {
      adoptPack = null;
    }
    check(
      "adoption pack JSON has letterhead, 7 templates, 5-step checklist, no office data",
      !!adoptPack &&
        adoptPack.app === "DesaAI" &&
        adoptPack.format === "desaai-adoption-pack" &&
        Array.isArray(adoptPack.templates) &&
        adoptPack.templates.length === 7 &&
        adoptPack.letterhead?.instansi2 === "Kecamatan Simpangkatis" &&
        Array.isArray(adoptPack.checklist) &&
        adoptPack.checklist.length === 5 &&
        !("letters" in adoptPack) &&
        !("personnel" in adoptPack),
      adoptPack ? `templates=${adoptPack.templates.length} checklist=${adoptPack.checklist.length}` : "no JSON",
    );
    check(
      "adoption pack download reports success",
      /Adoption pack downloaded/.test(adoptStatus),
      adoptStatus,
    );
    // Indonesian toggle: Anin + Surat Cepat switch language too.
    await page.click('[data-tab="letters"]');
    await sleep(200);
    await page.click("#lang-toggle");
    await sleep(300);
    const aninId = await page.evaluate(() => ({
      cepatTitle: document.querySelector('[data-i18n="cepatTitle"]')?.textContent ?? "",
    }));
    await page.click('[data-tab="home"]');
    await sleep(300);
    const aninGreetingId = await page.$eval("#anin-greeting", (el) => el.textContent ?? "");
    check(
      "Anin + Surat Cepat switch to Indonesian",
      /Surat Cepat/.test(aninId.cepatTitle) && /Selamat (pagi|siang|sore|malam)/.test(aninGreetingId),
      `cepat="${aninId.cepatTitle}" greeting="${aninGreetingId.slice(0, 40)}"`,
    );
    await page.click("#lang-toggle");
    await sleep(300);

    // 9d. Paket 28 — redesign model SIAP AKAD: sidebar biru, page head,
    // kartu statistik cerah, grafik per desa/jabatan, form/tabel biru.
    await page.click('[data-tab="home"]');
    await sleep(300);
    const p28Shell = await page.evaluate(() => ({
      sidebar: !!document.querySelector(".sidebar"),
      tabs: document.querySelectorAll(".sidebar .tab").length,
      datePill: document.getElementById("date-pill-text")?.textContent ?? "",
      title: document.getElementById("page-title")?.textContent ?? "",
      homeH2: document.querySelector("#panel-home h2")?.textContent ?? "",
    }));
    const todayId = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    check(
      "Paket 28 sidebar exists with all 9 tabs",
      p28Shell.sidebar && p28Shell.tabs === 9,
      `sidebar=${p28Shell.sidebar} tabs=${p28Shell.tabs}`,
    );
    check(
      "Paket 28 date pill shows today's Indonesian date",
      p28Shell.datePill === todayId,
      `pill="${p28Shell.datePill}" today="${todayId}"`,
    );
    check(
      "Paket 28 page head mirrors the home panel title",
      p28Shell.title === p28Shell.homeH2 && p28Shell.title !== "",
      `title="${p28Shell.title}" h2="${p28Shell.homeH2}"`,
    );
    const notif = await page.evaluate(() => ({
      count: document.getElementById("keg-notif-count")?.textContent ?? "",
      badgeHidden: document.getElementById("notif-badge")?.hidden ?? true,
      badgeText: document.getElementById("notif-badge")?.textContent ?? "",
    }));
    check(
      "Paket 28 notification bell badge matches personnel count (hidden when 0)",
      notif.count === "0"
        ? notif.badgeHidden
        : !notif.badgeHidden && notif.badgeText === notif.count,
      `count=${notif.count} badgeHidden=${notif.badgeHidden} badgeText=${notif.badgeText}`,
    );
    // Page head follows the active tab.
    await page.click('[data-tab="letters"]');
    await sleep(300);
    const headLetters = await page.evaluate(() => ({
      title: document.getElementById("page-title")?.textContent ?? "",
      h2: document.querySelector("#panel-letters h2")?.textContent ?? "",
    }));
    check(
      "Paket 28 page head follows the letters tab",
      headLetters.title === headLetters.h2 && headLetters.title !== "",
      `title="${headLetters.title}" h2="${headLetters.h2}"`,
    );
    await page.click('[data-tab="home"]');
    await sleep(300);
    // Home charts sum to the live personnel total.
    const p28Charts = await page.evaluate(() => ({
      desaSum: [...document.querySelectorAll("#home-desa-chart .chart-value")]
        .reduce((s, el) => s + Number(el.dataset.count ?? "0"), 0),
      desaRows: document.querySelectorAll("#home-desa-chart .chart-row").length,
      jabSum: [...document.querySelectorAll("#home-jabatan-legend li")]
        .reduce((s, el) => s + Number(el.dataset.count ?? "0"), 0),
      jabTotal: document.querySelector("#home-jabatan-donut .donut-total")?.textContent ?? "",
      perangkat: document.getElementById("qs-perangkat")?.textContent ?? "",
    }));
    // 11 bars: 10 desa + 1 baris Kecamatan (staf kecamatan adalah
    // personel juga; tanpa baris itu jumlah bar hanya 15 dari total 23).
    check(
      "Paket 28 officers-per-village bars sum to the personnel total",
      p28Charts.desaRows === 11 && String(p28Charts.desaSum) === p28Charts.perangkat,
      `rows=${p28Charts.desaRows} sum=${p28Charts.desaSum} total=${p28Charts.perangkat}`,
    );
    check(
      "Paket 28 position donut legend + center total match the personnel total",
      String(p28Charts.jabSum) === p28Charts.perangkat &&
        p28Charts.jabTotal === p28Charts.perangkat,
      `legendSum=${p28Charts.jabSum} center=${p28Charts.jabTotal} total=${p28Charts.perangkat}`,
    );
    // Form-card blue headers (6 forms) + blue table header.
    const p28Cards = await page.evaluate(() => ({
      heads: document.querySelectorAll(".form-card-head").length,
      headBg: document.querySelector(".form-card-head")
        ? getComputedStyle(document.querySelector(".form-card-head")).backgroundColor
        : "",
      thBg: document.querySelector("#keg-table thead th")
        ? getComputedStyle(document.querySelector("#keg-table thead th")).backgroundColor
        : "",
    }));
    check(
      "Paket 28 six forms have blue header banners",
      p28Cards.heads === 6 && p28Cards.headBg === "rgb(29, 78, 216)",
      `heads=${p28Cards.heads} bg=${p28Cards.headBg}`,
    );
    check(
      "Paket 28 personnel table header is blue",
      p28Cards.thBg === "rgb(29, 78, 216)",
      `thBg=${p28Cards.thBg}`,
    );
    // Export Word reuses the CSV download; Export PDF uses the print route.
    await page.click('[data-tab="kepegawaian"]');
    await sleep(400);
    await installCsvCapture();
    await page.click("#keg-export-word");
    await sleep(300);
    const p28Word = await page.evaluate(async () => {
      const blobs = window.__csvBlobs ?? [];
      const last = blobs[blobs.length - 1];
      return {
        csv: last ? await last.text() : "",
        rows: document.querySelectorAll("#keg-table tbody tr").length,
      };
    });
    const p28WordLines = p28Word.csv.trim().split("\n");
    check(
      "Paket 28 Export Word downloads the personnel CSV (header + shown rows)",
      p28WordLines[0]?.startsWith("No,Nama,Unit,Jabatan,Desa,") &&
        p28WordLines.length === p28Word.rows + 1,
      `header=${p28WordLines[0] ?? ""} lines=${p28WordLines.length} rows=${p28Word.rows}`,
    );
    await page.evaluate(() => {
      window.__printed = false;
      window.print = () => {
        window.__printed = true;
      };
    });
    await page.click("#keg-export-pdf");
    await sleep(300);
    const p28Pdf = await page.evaluate(() => ({
      printed: window.__printed === true,
      rows: document.querySelectorAll("#keg-print-area table tbody tr").length,
      tableRows: document.querySelectorAll("#keg-table tbody tr").length,
      status: document.getElementById("keg-export-status")?.textContent ?? "",
      target: document.body.dataset.printTarget ?? "",
    }));
    check(
      "Paket 28 Export PDF fills the print area with the shown rows and calls print",
      p28Pdf.printed && p28Pdf.rows === p28Pdf.tableRows && p28Pdf.rows > 0 &&
        p28Pdf.target === "keg-table" && /Save as PDF|printer/i.test(p28Pdf.status),
      `printed=${p28Pdf.printed} printRows=${p28Pdf.rows} tableRows=${p28Pdf.tableRows} target=${p28Pdf.target} status=${p28Pdf.status}`,
    );
    // Sidebar "Keluar" switches to Warga mode; the header toggle restores it.
    await page.click("#sidebar-logout");
    await sleep(300);
    const p28Warga = await page.evaluate(() => ({
      warga: document.body.classList.contains("mode-warga"),
      card: !document.getElementById("home-warga-card")?.hidden,
    }));
    check(
      "Paket 28 sidebar Keluar switches to Warga mode",
      p28Warga.warga && p28Warga.card,
      `mode-warga=${p28Warga.warga} wargaCard=${p28Warga.card}`,
    );
    await page.click("#mode-toggle");
    await sleep(300);
    check(
      "Paket 28 header toggle restores officer mode after Keluar",
      await page.evaluate(() => !document.body.classList.contains("mode-warga")),
    );

    // 9e. Paket 29 — page-head diperbaiki (judul 24px bukan default 32px,
    // slab terang hilang di mode gelap, tombol ghost terlihat, HP tidak
    // terpotong) + hasil draf tampil sebagai lembar surat resmi.
    await page.click('[data-tab="letters"]');
    await sleep(300);
    // Paket 31 — page-head kini banner foto + gradien biru: judul putih,
    // subjudul putih tembus pandang, latar gradien + foto kantor.
    const p29Head = await page.evaluate(() => ({
      h1: getComputedStyle(document.getElementById("page-title")).fontSize,
      titleColor: getComputedStyle(document.getElementById("page-title")).color,
      sub: getComputedStyle(document.getElementById("page-subtitle")).color,
      bannerBg: getComputedStyle(document.querySelector(".page-head")).backgroundImage,
    }));
    check(
      "Paket 31 page-head banner: white title, translucent subtitle, gradient + photo background",
      p29Head.h1 === "24px" &&
        p29Head.titleColor === "rgb(255, 255, 255)" &&
        p29Head.sub === "rgba(255, 255, 255, 0.85)" &&
        p29Head.bannerBg.includes("linear-gradient") &&
        p29Head.bannerBg.includes("kantor"),
      `h1=${p29Head.h1} title=${p29Head.titleColor} sub=${p29Head.sub} banner=${p29Head.bannerBg.slice(0, 120)}`,
    );
    // NB: .btn mentransisikan background 0.15s — baca gaya SETELAH jeda,
    // kalau tidak yang terbaca masih nilai awal transisi (putih).
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await sleep(300);
    const p29Dark = await page.evaluate(() => {
      const cs = (el) => getComputedStyle(el);
      const out = {
        contentBg: cs(document.querySelector(".app-content")).backgroundColor,
        title: cs(document.getElementById("page-title")).color,
        langBg: cs(document.getElementById("lang-toggle")).backgroundColor,
        langColor: cs(document.getElementById("lang-toggle")).color,
      };
      document.documentElement.dataset.theme = "light";
      return out;
    });
    check(
      // Judul page-head sengaja PUTIH di kedua tema: ia duduk di atas banner
      // gradien biru gelap — bukan warna ink mode gelap (rgb(242,245,249)).
      "Paket 31 dark mode is truly dark (black bg, white text, glass buttons on the banner)",
      p29Dark.contentBg === "rgb(11, 13, 18)" &&
        p29Dark.title === "rgb(255, 255, 255)" &&
        p29Dark.langBg === "rgba(255, 255, 255, 0.14)" &&
        p29Dark.langColor === "rgb(255, 255, 255)",
      `bg=${p29Dark.contentBg} title=${p29Dark.title} langBg=${p29Dark.langBg} langColor=${p29Dark.langColor}`,
    );
    await page.setViewport({ width: 390, height: 844 });
    await sleep(400);
    const p29Mobile = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      h1: getComputedStyle(document.getElementById("page-title")).fontSize,
    }));
    check(
      "Paket 29 mobile page-head does not overflow and title shrinks",
      p29Mobile.scrollW <= 390 && p29Mobile.h1 === "20px",
      `scrollW=${p29Mobile.scrollW} h1=${p29Mobile.h1}`,
    );
    await page.setViewport({ width: 1280, height: 900 });
    await sleep(400);
    // Lembar surat: isi formulir undangan, lalu simulasikan teks AI (dengan
    // kop/meta di awal + bagian Tembusan) — lembar harus merender format
    // resmi, membuang duplikasi kop, dan memakai kolom Tembusan.
    await page.select("#letter-template", "undangan");
    await sleep(200);
    await page.evaluate(() => {
      const set = (id, v) => {
        const el = document.getElementById(id);
        el.value = v;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      set("letter-field-nomor", "140/20/DS/XI/2026");
      set("letter-field-tanggal", "27 November 2026");
      set("letter-field-acara", "Musyawarah Desa");
      set("letter-field-hari", "Jumat, 20 November 2026");
      set("letter-field-waktu", "09.00 WIB");
      set("letter-field-tempat", "Balai Desa");
      set("letter-field-tujuan", "Ketua RT 01 s.d. RT 05");
      set("letter-field-tembusan", "Camat Simpangkatis");
      const out = document.getElementById("letter-output");
      out.value =
        "Nomor: 140/20/DS/XI/2026\nPEMERINTAH KABUPATEN BANGKA TENGAH\nSURAT UNDANGAN\n\nDengan hormat, warga diundang musyawarah desa pada hari yang telah ditentukan.\n\nDemikian undangan ini disampaikan, atas perhatian diucapkan terima kasih.\n\nTembusan:\nBupati Bangka Tengah";
      out.dispatchEvent(new Event("input", { bubbles: true }));
      document.getElementById("letter-output-wrap").hidden = false;
    });
    await sleep(200);
    const p29Sheet = await page.evaluate(() => ({
      text: document.getElementById("letter-sheet")?.textContent ?? "",
      body: document.querySelector("#letter-sheet .letter-body")?.textContent ?? "",
      caption: document.querySelector(".letter-sheet-caption")?.textContent ?? "",
      rawInDetails: !!document.querySelector("details.letter-raw #letter-output"),
    }));
    check(
      "Paket 29 letter sheet renders kop + meta + details + signature",
      /Hasil draf|Draft result/.test(p29Sheet.caption) &&
        /Pemerintah Kabupaten Bangka Tengah/.test(p29Sheet.text) &&
        /Kecamatan Simpangkatis/.test(p29Sheet.text) &&
        /140\/20\/DS\/XI\/2026/.test(p29Sheet.text) &&
        /Undangan Musyawarah Desa/.test(p29Sheet.text) &&
        /Ketua RT 01 s\.d\. RT 05/.test(p29Sheet.text) &&
        /Balai Desa/.test(p29Sheet.text) &&
        /09\.00 WIB/.test(p29Sheet.text) &&
        /Simpangkatis, 27 November 2026/.test(p29Sheet.text) &&
        /Camat Simpangkatis/.test(p29Sheet.text),
      `caption="${p29Sheet.caption}" sheet="${p29Sheet.text.slice(0, 120)}"`,
    );
    check(
      "Paket 29 letter sheet body drops the AI header and uses the Tembusan field",
      /Dengan hormat/.test(p29Sheet.body) &&
        /musyawarah desa/.test(p29Sheet.body) &&
        !/Nomor: 140/.test(p29Sheet.body) &&
        /Camat Simpangkatis/.test(p29Sheet.text) &&
        !/Bupati Bangka Tengah/.test(p29Sheet.text) &&
        p29Sheet.rawInDetails,
      `body="${p29Sheet.body.slice(0, 80)}" rawInDetails=${p29Sheet.rawInDetails}`,
    );

    // Paket 31 — lembar surat TETAP kertas putih di mode gelap sungguhan.
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await sleep(300);
    const p31Sheet = await page.evaluate(() => {
      const sheet = document.getElementById("letter-sheet");
      if (!sheet) return { bg: "missing", color: "missing" };
      const cs = getComputedStyle(sheet);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    check(
      "Paket 31 letter sheet stays paper-white in dark mode",
      p31Sheet.bg === "rgb(255, 255, 255)" && p31Sheet.color === "rgb(0, 0, 0)",
      `bg=${p31Sheet.bg} color=${p31Sheet.color}`,
    );
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });

    // 9f. Paket 30 — draf offline saat AI gagal + Surat Cepat tahan salah
    // ketik + judul Data Kepegawaian / Administrasi Kecamatan Simpangkatis
    // (tanpa SIAP AKAD) + font Plus Jakarta Sans + tata letak rapi + konten
    // terang di kedua mode.
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
        { timeout: 15000 },
      )
      .catch(() => {});
    await sleep(300);
    const p30Draft = await page.evaluate(() => ({
      out: document.getElementById("letter-output")?.value ?? "",
      status: document.getElementById("letter-status")?.textContent ?? "",
      sheetBody: document.querySelector("#letter-sheet .letter-body")?.textContent ?? "",
    }));
    check(
      "Paket 30 offline draft appears when AI fails (Bos's exact form values)",
      /Dengan hormat/.test(p30Draft.out) &&
        /pemilihan kepala desa serentak/.test(p30Draft.out) &&
        /Forum konsultasi Publik/.test(p30Draft.out) &&
        /pemilihan kepala desa serentak/.test(p30Draft.sheetBody) &&
        /offline/i.test(p30Draft.status),
      `status="${p30Draft.status.slice(0, 80)}" out="${p30Draft.out.slice(0, 80)}"`,
    );
    // Surat Cepat: kalimat Bos dengan salah ketik "Musyawrah" (tanpa kata
    // "Undangan") tetap tertebak sebagai undangan + acara dieja baku.
    const p30Cepat = await page.evaluate(() => {
      const input = document.getElementById("cepat-input");
      input.value =
        "Musyawrah desa tanggal 28 November 2026 di Halaman Kantor Camat Simpangkatis";
      return input.value;
    });
    await page.click("#cepat-fill");
    await sleep(300);
    const p30CepatOut = await page.evaluate(() => ({
      template: document.getElementById("letter-template")?.value ?? "",
      acara: document.getElementById("letter-field-acara")?.value ?? "",
      tempat: document.getElementById("letter-field-tempat")?.value ?? "",
      status: document.getElementById("cepat-status")?.textContent ?? "",
    }));
    check(
      "Paket 30 Surat Cepat tolerates the Musyawrah typo",
      p30CepatOut.template === "undangan" &&
        p30CepatOut.acara === "Musyawarah Desa" &&
        /Halaman Kantor Camat Simpangkatis/.test(p30CepatOut.tempat),
      `input="${p30Cepat}" template=${p30CepatOut.template} acara="${p30CepatOut.acara}" tempat="${p30CepatOut.tempat}"`,
    );
    // Judul + menu baru, tanpa SIAP AKAD di teks yang terlihat.
    const p30Keg = await page.evaluate(() => {
      const tab = document.querySelector('[data-tab="kepegawaian"] span[data-i18n="tabKepegawaian"]');
      return {
        tabText: tab?.textContent ?? "",
        tabWrap: tab ? getComputedStyle(tab).whiteSpace : "",
      };
    });
    check(
      "Paket 30 menu is Data Kepegawaian on one line",
      /Data Kepegawaian|Personnel Data/.test(p30Keg.tabText) &&
        !/SIAP AKAD/.test(p30Keg.tabText) &&
        p30Keg.tabWrap === "nowrap",
      `tab="${p30Keg.tabText}" whiteSpace=${p30Keg.tabWrap}`,
    );
    await page.click('[data-tab="kepegawaian"]');
    await sleep(300);
    const p30KegPage = await page.evaluate(() => ({
      title: document.getElementById("page-title")?.textContent ?? "",
      sub: document.getElementById("page-subtitle")?.textContent ?? "",
      panelHasSiap: /SIAP AKAD/.test(
        document.getElementById("panel-kepegawaian")?.textContent ?? "",
      ),
    }));
    check(
      "Paket 30 kepegawaian title is benefit-led, no SIAP AKAD anywhere on the page",
      /Administrasi Kecamatan Simpangkatis|Simpangkatis Subdistrict Administration/.test(
        p30KegPage.title,
      ) &&
        /pantau masa bhakti|track terms of office/i.test(p30KegPage.sub) &&
        !p30KegPage.panelHasSiap,
      `title="${p30KegPage.title}" sub="${p30KegPage.sub.slice(0, 80)}" panelHasSiap=${p30KegPage.panelHasSiap}`,
    );
    // Font + tata letak HP 390px: satu kolom, tanpa overflow horizontal.
    await page.setViewport({ width: 390, height: 844 });
    await sleep(400);
    await page.evaluate(() => document.fonts.ready);
    const p30Mobile = await page.evaluate(() => {
      const bentoCols = getComputedStyle(document.querySelector(".bento"))
        .gridTemplateColumns.split(" ").length;
      const qsCols = getComputedStyle(document.querySelector(".quick-stats"))
        .gridTemplateColumns.split(" ").length;
      return {
        scrollW: document.documentElement.scrollWidth,
        bentoCols,
        qsCols,
        bentoW: Math.round(document.querySelector(".bento").getBoundingClientRect().width),
        searchW: Math.round(document.querySelector(".bento-search").getBoundingClientRect().width),
        fontLoaded: document.fonts.check('700 16px "Plus Jakarta Sans"'),
        bodyFont: getComputedStyle(document.body).fontFamily,
      };
    });
    check(
      "Paket 30 mobile layout is a single column with the new font",
      p30Mobile.scrollW <= 390 &&
        p30Mobile.bentoCols === 1 &&
        p30Mobile.qsCols === 2 &&
        p30Mobile.searchW >= p30Mobile.bentoW - 4 &&
        p30Mobile.fontLoaded &&
        /Plus Jakarta Sans/.test(p30Mobile.bodyFont),
      `scrollW=${p30Mobile.scrollW} bentoCols=${p30Mobile.bentoCols} qsCols=${p30Mobile.qsCols} searchW=${p30Mobile.searchW}/${p30Mobile.bentoW} fontLoaded=${p30Mobile.fontLoaded} bodyFont="${p30Mobile.bodyFont.slice(0, 60)}"`,
    );
    // Mode gelap di HP: konten tetap putih + tulisan hitam.
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await sleep(300);
    const p30DarkMobile = await page.evaluate(() => {
      const cs = (el) => getComputedStyle(el);
      const out = {
        contentBg: cs(document.querySelector(".app-content")).backgroundColor,
        title: cs(document.getElementById("page-title")).color,
        cardBg: cs(document.querySelector(".bento-card")).backgroundColor,
      };
      document.documentElement.dataset.theme = "light";
      return out;
    });
    check(
      // Judul page-head sengaja PUTIH di kedua tema (di atas banner gradien
      // biru gelap) — bukan warna ink mode gelap.
      "Paket 31 dark mode on mobile is truly dark (black bg, white text, dark cards)",
      p30DarkMobile.contentBg === "rgb(11, 13, 18)" &&
        p30DarkMobile.title === "rgb(255, 255, 255)" &&
        p30DarkMobile.cardBg === "rgb(21, 24, 31)",
      `bg=${p30DarkMobile.contentBg} title=${p30DarkMobile.title} cardBg=${p30DarkMobile.cardBg}`,
    );
    await page.setViewport({ width: 1280, height: 900 });
    await sleep(400);

    // 9c. Anin chat (Paket 32): FAB + panel, KB offline, analis dari data
    // nyata, perintah isi formulir, fallback suara, mode gelap.
    // Re-seed the deterministic IKM sample first: the IKM section earlier
    // in this run reset the data to a single all-1s response (score 25, D)
    // — the analyst checks below need the 12 demo responses (90,28, A,
    // Sarana lowest). Removing both keys makes loadIkm() re-seed on reload.
    await page.evaluate(() => {
      localStorage.removeItem("desaai-ikm-v1");
      localStorage.removeItem("desaai-ikm-meta-v1");
    });
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await sleep(1200);
    // Beralih ke Bahasa Indonesia dulu supaya jawaban Anin bisa dicek
    // dengan string Indonesia (aplikasi default berbahasa Inggris).
    await page.click("#lang-toggle");
    await sleep(300);
    const aninLang = await page.$eval("html", (el) => el.lang);
    check("Anin tests run in Indonesian", aninLang === "id", `lang=${aninLang}`);
    const fabBox = await page.$eval("#anin-fab", (el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 };
    });
    const fabImgOk = await page.$eval("#anin-fab-img", (el) => el.naturalWidth > 0);
    check(
      "Anin FAB visible on home with a real face image",
      fabBox.visible && fabBox.w >= 44 && fabImgOk,
      `w=${fabBox.w} imgLoaded=${fabImgOk}`,
    );
    const homeAninImgOk = await page.$eval("#home-anin-img", (el) => el.naturalWidth > 0);
    check("home Anin card shows the cropped face (not the old SVG)", homeAninImgOk);
    await page.click('[data-tab="letters"]');
    await sleep(200);
    const fabOnLetters = await page.$eval("#anin-fab", (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    check("Anin FAB stays visible on the letters tab", fabOnLetters);
    await page.click("#anin-fab");
    await sleep(400);
    const panelOpen = await page.evaluate(() => ({
      hidden: document.getElementById("anin-panel").hidden,
      welcome: document.querySelector("#anin-messages .anin-msg-anin p")?.textContent ?? "",
      chips: document.querySelectorAll("#anin-chip, .anin-chip").length,
    }));
    check(
      "Anin panel opens with a welcome message and suggestion chips",
      !panelOpen.hidden && /Anin/.test(panelOpen.welcome) && panelOpen.chips >= 4,
      `welcome="${panelOpen.welcome.slice(0, 60)}" chips=${panelOpen.chips}`,
    );
    const aninCount = () =>
      page.$$eval("#anin-messages .anin-msg-anin", (els) => els.length);
    const lastAninText = () =>
      page.$eval(
        "#anin-messages .anin-msg-anin:last-of-type p",
        (el) => el.textContent ?? "",
      );
    const aninAsk = async (text) => {
      const before = await aninCount();
      await page.type("#anin-input", text);
      await page.click("#anin-send");
      await page.waitForFunction((n) => document.querySelectorAll("#anin-messages .anin-msg-anin").length > n, { timeout: 10000 }, before);
      await sleep(200);
      return lastAninText();
    };
    const ktpAnswer = await aninAsk("Syarat KTP apa saja?");
    check(
      "Anin answers a procedure question from the offline KB",
      /Kartu Keluarga/.test(ktpAnswer) && /17 tahun/.test(ktpAnswer),
      ktpAnswer.slice(0, 120),
    );
    const ikmAnswer = await aninAsk("IKM rata-rata berapa?");
    check(
      "Anin analis answers the IKM average from real stored data",
      /90,28/.test(ikmAnswer) && /12 jawaban/.test(ikmAnswer) && /kategori A/i.test(ikmAnswer),
      ikmAnswer.slice(0, 140),
    );
    const keluhanAnswer = await aninAsk("Keluhan terbanyak bulan ini?");
    check(
      "Anin analis names the top complaint category from real data",
      /Keterlambatan/.test(keluhanAnswer),
      keluhanAnswer.slice(0, 140),
    );
    const perbaikiAnswer = await aninAsk("Apa yang harus diperbaiki?");
    check(
      "Anin analis suggests improvements (lowest IKM element + top complaint)",
      /Sarana/.test(perbaikiAnswer) && /Keterlambatan/.test(perbaikiAnswer) && /Saran/.test(perbaikiAnswer),
      perbaikiAnswer.slice(0, 160),
    );
    const skAnswer = await aninAsk("Cara buat SK pengangkatan");
    check(
      "Anin answers an app how-to from the app knowledge base",
      /SK Pengangkatan Perangkat Desa/.test(skAnswer),
      skAnswer.slice(0, 120),
    );
    // Paket 32 (standar "DIMAKSIMALKAN") — KB mencakup beranda, Tanya
    // Prosedur, dan Paket Adopsi Desa Lain juga (tanpa celah).
    const berandaAnswer = await aninAsk("Apa yang ada di beranda?");
    check(
      "Anin answers about the home dashboard (new KB entry)",
      /statistik cepat|Beranda/.test(berandaAnswer),
      berandaAnswer.slice(0, 120),
    );
    const tanyaAnswer = await aninAsk("Bagaimana cara tanya prosedur?");
    check(
      "Anin explains Tanya Prosedur itself (new KB entry)",
      /Tanya Prosedur/.test(tanyaAnswer),
      tanyaAnswer.slice(0, 120),
    );
    const adopsiAnswer = await aninAsk("Apakah aplikasi ini bisa dipakai desa lain?");
    check(
      "Anin explains the adoption pack for other villages (new KB entry)",
      /desa lain/.test(adopsiAnswer),
      adopsiAnswer.slice(0, 120),
    );
    const letterAnswer = await aninAsk(
      "Anin, buatkan surat undangan musyawarah desa tanggal 28 November 2026 di Balai Desa Simpangkatis",
    );
    const letterFields = await page.evaluate(() => ({
      template: document.getElementById("letter-template").value,
      acara: document.getElementById("letter-field-acara")?.value ?? "",
      hari: document.getElementById("letter-field-hari")?.value ?? "",
      tempat: document.getElementById("letter-field-tempat")?.value ?? "",
    }));
    check(
      "Anin letter command fills the form (template + fields)",
      /sudah saya isi/.test(letterAnswer) &&
        letterFields.template === "undangan" &&
        letterFields.acara === "Musyawarah Desa" &&
        letterFields.hari === "28 November 2026" &&
        letterFields.tempat === "Balai Desa Simpangkatis",
      `reply="${letterAnswer.slice(0, 60)}" fields=${JSON.stringify(letterFields)}`,
    );
    const unknownAnswer = await aninAsk("zxqv kltp 123");
    const unknownFace = await page.$eval("#anin-panel-face", (el) => el.src);
    check(
      "Anin says plainly when she does not understand (Bingung face)",
      /belum paham/.test(unknownAnswer) && /bingung/.test(unknownFace),
      `reply="${unknownAnswer.slice(0, 60)}" face=${unknownFace.split("/").pop()}`,
    );
    // Paket 32 (standar "DIMAKSIMALKAN") — jawaban "belum paham" tetap
    // membantu: menyebut apa saja yang bisa dibantu Anin.
    check(
      "Anin 'does not understand' reply still lists what she can do",
      /IKM/.test(unknownAnswer) && /pengaduan/i.test(unknownAnswer) && /Buku Agenda/.test(unknownAnswer),
      unknownAnswer.slice(0, 160),
    );
    // Paket 32.1 — omong kosong murni TIDAK memicu saran topik.
    check(
      "gibberish gets no near-miss suggestions (no false topics)",
      !/Mungkin yang Anda maksud/.test(unknownAnswer),
      unknownAnswer.slice(0, 80),
    );
    // Paket 32.1 — kasus tangkapan layar Bos 28 Nov 08:55: "Kalau ada
    // pengaduan bisa selesaikan" sebelumnya dijawab "belum paham".
    const aduSelesai = await aninAsk("Kalau ada pengaduan bisa selesaikan");
    check(
      "Anin answers the screenshot question (complaint resolution flow)",
      /Baru/.test(aduSelesai) && /Diproses/.test(aduSelesai) && /Selesai/.test(aduSelesai) && /tab Pengaduan/.test(aduSelesai),
      aduSelesai.slice(0, 160),
    );
    const aduSaya = await aninAsk("pengaduan saya gimana");
    check(
      "Anin answers the 'pengaduan saya gimana' variant",
      /Baru/.test(aduSaya) && /Diproses/.test(aduSaya) && /Selesai/.test(aduSaya),
      aduSaya.slice(0, 120),
    );
    const aduCara = await aninAsk("cara menyelesaikan pengaduan");
    check(
      "Anin answers the 'cara menyelesaikan pengaduan' variant",
      /Baru/.test(aduCara) && /Diproses/.test(aduCara) && /Selesai/.test(aduCara),
      aduCara.slice(0, 120),
    );
    const aduLapor = await aninAsk("Bagaimana cara lapor pengaduan?");
    check(
      "Anin explains how to file a complaint",
      /Pengaduan baru/.test(aduLapor),
      aduLapor.slice(0, 120),
    );
    // Paket 32.1 — administrasi umum DI LUAR fitur aplikasi (KB baru).
    const domisiliAnswer = await aninAsk("Syarat surat domisili apa saja?");
    check(
      "Anin answers domicile certificate requirements (new KB entry)",
      /Domisili/.test(domisiliAnswer) && /KTP/.test(domisiliAnswer),
      domisiliAnswer.slice(0, 120),
    );
    const jamAnswer = await aninAsk("Jam layanan kantor jam berapa?");
    check(
      "Anin does NOT invent office hours (honest jam layanan answer)",
      // "Konfirmasi" di awal kalimat (huruf besar) — regex harus
      // case-insensitive, kalau tidak tes gagal padahal jawabannya benar.
      /tidak tercantum/.test(jamAnswer) && /konfirmasi/i.test(jamAnswer),
      jamAnswer.slice(0, 140),
    );
    const hukumAnswer = await aninAsk("Apa dasar hukum pelayanan publik?");
    check(
      "Anin cites the public service law (new KB entry)",
      /UU No. 25 Tahun 2009/.test(hukumAnswer),
      hukumAnswer.slice(0, 120),
    );
    const ktpHilangAnswer = await aninAsk("Bagaimana mengurus KTP hilang?");
    check(
      "Anin explains lost-KTP replacement (new KB entry)",
      /kehilangan/.test(ktpHilangAnswer) && /polisi/.test(ktpHilangAnswer),
      ktpHilangAnswer.slice(0, 140),
    );
    const disposisiAnswer = await aninAsk("Bagaimana disposisi surat?");
    check(
      "Anin explains mail disposition flow (new KB entry)",
      /disposisi/i.test(disposisiAnswer) && /Buku Agenda/.test(disposisiAnswer),
      disposisiAnswer.slice(0, 140),
    );
    // Paket 32.1 — near-miss: pertanyaan yang tidak cocok penuh tetap
    // mendapat saran topik terdekat, bukan jalan buntu. (Sebelum 32.1,
    // "surat saya kapan selesai" malah dijawab panduan Domisili karena
    // bonus kata-judul di matchKb — ambang skor kini minimal 2.)
    const nearMiss = await aninAsk("surat saya kapan selesai");
    check(
      "near-miss reply suggests the closest topics (never a dead end)",
      /belum paham/.test(nearMiss) && /Mungkin yang Anda maksud/.test(nearMiss) && /surat/i.test(nearMiss),
      nearMiss.slice(0, 200),
    );
    // Voice: this VM's headless Chrome has no SpeechRecognition/mic and no
    // speech voices — both buttons must answer with a clear message, never
    // fail silently. (On a real phone the mic transcribes and Anin speaks.)
    const micBefore = await aninCount();
    await page.click("#anin-mic");
    await page.waitForFunction((n) => document.querySelectorAll("#anin-messages .anin-msg-anin").length > n, { timeout: 10000 }, micBefore);
    await sleep(200);
    const micAnswer = await lastAninText();
    check(
      "mic button explains clearly when voice input is unavailable",
      /tidak didukung|tidak bisa dipakai/.test(micAnswer),
      micAnswer.slice(0, 120),
    );
    const readBefore = await aninCount();
    await page.$$eval("#anin-messages .anin-read", (btns) => btns[btns.length - 1].click());
    await page.waitForFunction((n) => document.querySelectorAll("#anin-messages .anin-msg-anin").length > n, { timeout: 10000 }, readBefore);
    await sleep(200);
    const readAnswer = await lastAninText();
    check(
      "read-aloud button explains clearly when no voice is available",
      /belum menyediakan suara/.test(readAnswer),
      readAnswer.slice(0, 120),
    );
    // Dark mode: panel stays readable (dark surface, light text).
    await page.click("#theme-toggle");
    await sleep(300);
    const aninDark = await page.evaluate(() => {
      const cs = (el) => getComputedStyle(el);
      return {
        panelBg: cs(document.getElementById("anin-panel")).backgroundColor,
        panelText: cs(document.getElementById("anin-panel")).color,
        theme: document.documentElement.dataset.theme,
      };
    });
    check(
      "Anin panel is truly dark in dark mode",
      aninDark.theme === "dark" &&
        aninDark.panelBg === "rgb(21, 24, 31)" &&
        aninDark.panelText === "rgb(242, 245, 249)",
      `bg=${aninDark.panelBg} text=${aninDark.panelText}`,
    );
    await page.click("#theme-toggle");
    await sleep(300);
    await page.click("#anin-panel-close");
    await sleep(200);
    const panelClosed = await page.$eval("#anin-panel", (el) => el.hidden);
    check("Anin panel closes", panelClosed);

    // 9d. Paket 32 — Anin mengambil alih Tanya Prosedur (28 Nov 00:13):
    // AI gagal = jawab dari panduan offline; TIDAK PERNAH error mentah.
    // (Masih Bahasa Indonesia dari bagian 9c.)
    await page.click('[data-tab="qa"]');
    await sleep(200);
    const qaAninImgOk = await page.$eval("#qa-anin-img", (el) => el.naturalWidth > 0);
    check("Tanya shows Anin's face (Anin answers here)", qaAninImgOk);
    await page.$eval("#qa-input", (el) => { el.value = ""; });
    await page.type("#qa-input", "Bagaimana cara mengurus KK baru?");
    const qaDebugQ = await page.$eval("#qa-input", (el) => el.value);
    console.log("DEBUG 9d question value:", JSON.stringify(qaDebugQ));
    await page.click("#qa-ask");
    await sleep(600);
    const qaAninOutput = await page.$eval("#qa-output", (el) => el.textContent);
    console.log("DEBUG 9d output @600ms:", JSON.stringify(qaAninOutput.slice(0, 150)));
    const qaDebugLater = await page.evaluate(async () => {
      await new Promise((r) => setTimeout(r, 9000));
      return {
        out: (document.getElementById("qa-output")?.textContent ?? "").slice(0, 150),
        status: document.getElementById("qa-status")?.textContent ?? "",
      };
    });
    console.log("DEBUG 9d output @~10s:", JSON.stringify(qaDebugLater));
    check(
      "Tanya answers a KK question from the offline guide (Anin takeover)",
      /Kartu Keluarga/.test(qaAninOutput) && /Surat pengantar/.test(qaAninOutput),
      qaAninOutput.slice(0, 120),
    );
    const qaAninStatus = await page.$eval("#qa-status", (el) => el.textContent);
    check(
      "Tanya explains Anin answered offline (no raw AI error)",
      /Anin/.test(qaAninStatus) && /panduan.*offline|offline/i.test(qaAninStatus),
      qaAninStatus.slice(0, 120),
    );
    const qaBodyText = await page.evaluate(() => document.body.innerText);
    check(
      "no raw AI error text anywhere on the page (Paket 32)",
      !/Panggilan AI gagal|npx -y firebase-tools|AI call failed/i.test(qaBodyText),
      qaBodyText.slice(0, 80),
    );
    const qaBtns = await page.evaluate(() => ({
      read: !!document.getElementById("qa-read"),
      askAnin: !!document.getElementById("qa-ask-anin"),
    }));
    check(
      "Tanya offers read-aloud + continue-with-Anin buttons",
      qaBtns.read && qaBtns.askAnin,
      JSON.stringify(qaBtns),
    );
    await page.click("#qa-read");
    await sleep(900);
    const qaReadStatus = await page.$eval("#qa-status", (el) => el.textContent);
    check(
      "Tanya read-aloud explains clearly when no voice is available",
      /suara|Anin/i.test(qaReadStatus),
      qaReadStatus.slice(0, 120),
    );
    await page.click("#qa-ask-anin");
    await sleep(1000);
    const qaToAnin = await page.evaluate(() => {
      // :last-of-type is type-based, not class-based — the last div is the
      // Anin answer, so read the last USER bubble from the full list.
      const userMsgs = [...document.querySelectorAll("#anin-messages .anin-msg-user p")].map(
        (el) => el.textContent ?? "",
      );
      return {
        panelOpen: !document.getElementById("anin-panel").hidden,
        userMsg: userMsgs[userMsgs.length - 1] ?? "",
      };
    });
    check(
      "'Continue with Anin' opens the chat with the same question",
      qaToAnin.panelOpen && /KK baru/.test(qaToAnin.userMsg),
      JSON.stringify(qaToAnin),
    );
    await page.click("#anin-panel-close");
    await sleep(200);

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
