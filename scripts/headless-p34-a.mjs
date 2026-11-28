// DesaAI — Paket 34 (A) headless checks: Ide 1 (Anin belajar dari
// arsip), Ide 2 (Anin pemeriksa surat), Ide 3 (Anin pengingat).
// Same harness as scripts/headless-test.mjs (puppeteer-core, system
// Chrome, file:// dist, ENV_NOISE filter for this VM's blocked
// Google/Firebase tunnel). Run after `npm run build`:
//   node scripts/headless-p34-a.mjs
// Exits 1 when any check fails.
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
const ENV_NOISE =
  /ERR_TUNNEL_CONNECTION_FAILED|JSHandle@error|firebaseinstallations\.googleapis\.com|googleapis\.com|recaptcha|identitytoolkit|firestore\.googleapis|firebaseremoteconfig/i;
const isEnvNoise = (text) => ENV_NOISE.test(text);

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("FAIL: dist/index.html missing — run `npm run build` first.");
    process.exit(1);
  }
  const errors = [];
  const failedRequests = [];
  const results = [];
  const check = (name, ok, detail = "") => {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  };
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
    page.on("dialog", (d) => d.accept());

    await page.goto(`file://${join(DIST, "index.html")}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);

    // Login demo (Paket 36) — same as headless-test.mjs.
    await page.evaluate(() => {
      document.getElementById("login-user").value = "";
      document.getElementById("login-pass").value = "";
    });
    await page.type("#login-user", "demo");
    await page.type("#login-pass", "demo123");
    await page.click(".login-submit");
    await sleep(600);
    const loggedIn = await page.evaluate(
      () => document.getElementById("login-screen")?.hidden ?? false,
    );
    check("login demo/demo123 enters the app", loggedIn);

    // Bahasa Indonesia, so Anin's answers can be checked in Indonesian.
    await page.click("#lang-toggle");
    await sleep(300);

    // Seed the LOCAL archive: 2 undangan (012, 013) + 1 surat dinas.
    // listLocalDrafts() reads localStorage fresh, so no reload is needed.
    await page.evaluate(() => {
      const now = Date.now();
      const seed = [
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
      ];
      localStorage.setItem("desaai-drafts-v1", JSON.stringify(seed));
    });

    // ---- Ide 3: widget "Pengingat hari ini" di Beranda (data demo:
    // 2 agenda lewat + 5 pengaduan lama, semua dari data nyata). ----
    const homeRem = await page.evaluate(() => ({
      count: document.getElementById("home-reminder-count")?.textContent ?? "",
      items: document.querySelectorAll("#home-reminder-list li").length,
      emptyHidden: document.getElementById("home-reminder-empty")?.hidden ?? false,
    }));
    check(
      "home 'Pengingat hari ini' widget lists real reminders (count + items)",
      Number(homeRem.count) >= 5 && homeRem.items >= 5 && homeRem.emptyHidden,
      `count=${homeRem.count} items=${homeRem.items}`,
    );

    // ---- Anin panel: open it, check the reminder card + chat. ----
    await page.click("#anin-fab");
    await sleep(400);
    const panelRem = await page.evaluate(() => ({
      hidden: document.getElementById("anin-panel")?.hidden ?? true,
      count: document.getElementById("anin-reminder-count")?.textContent ?? "",
      items: document.querySelectorAll("#anin-reminder-list li").length,
    }));
    check(
      "Anin panel opens with a reminder card (same real data as Home)",
      !panelRem.hidden && Number(panelRem.count) >= 5 && panelRem.items >= 5,
      `count=${panelRem.count} items=${panelRem.items}`,
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
      await page.waitForFunction(
        (n) =>
          document.querySelectorAll("#anin-messages .anin-msg-anin").length > n,
        { timeout: 10000 },
        before,
      );
      await sleep(200);
      return lastAninText();
    };

    // ---- Ide 3: "ada pengingat apa hari ini" (Anin chat). ----
    const remAnswer = await aninAsk("ada pengingat apa hari ini");
    check(
      "Anin lists today's reminders from real data",
      /pengingat/i.test(remAnswer) && /Pengaduan/.test(remAnswer),
      remAnswer.slice(0, 140),
    );

    // ---- Ide 2: "periksa surat ini" with NO draft yet — honest reply. ----
    const checkEmpty = await aninAsk("periksa surat ini");
    check(
      "Anin says so when there is no draft to check",
      /Belum ada draf/.test(checkEmpty),
      checkEmpty.slice(0, 100),
    );

    // ---- Ide 2: make an offline draft, inject format errors, check it. ----
    await page.click("#anin-panel-close");
    await sleep(300);
    await page.click('[data-tab="letters"]');
    await sleep(400);
    await page.type("#letter-field-perihal", "Undangan Musrenbang Desa");
    await page.click("#letter-generate");
    await sleep(800);
    const draftShown = await page.evaluate(
      () => !document.getElementById("letter-output-wrap")?.hidden,
    );
    check("offline draft renders (letter sheet visible)", draftShown);
    await page.evaluate(() => {
      const out = document.getElementById("letter-output");
      out.value =
        "dengan hormat, kami sampaikan dimana acara dilaksanakan  dan selesai.";
    });
    await page.click("#letter-check");
    await sleep(400);
    const checkRes = await page.evaluate(() => ({
      visible: !document.getElementById("letter-check-results")?.hidden,
      items: document.querySelectorAll("#letter-check-results .check-item").length,
      text: document.getElementById("letter-check-results")?.textContent ?? "",
      applyBtns: document.querySelectorAll("#letter-check-results .check-apply").length,
    }));
    check(
      "Periksa draf flags the errors (lowercase start, double space, 'dimana')",
      checkRes.visible &&
        checkRes.items >= 3 &&
        /huruf kecil/i.test(checkRes.text) &&
        /spasi ganda/i.test(checkRes.text) &&
        /dimana/i.test(checkRes.text) &&
        checkRes.applyBtns >= 3,
      `items=${checkRes.items} apply=${checkRes.applyBtns}`,
    );

    // Apply every fix one by one (each re-renders the list); the draft
    // itself must change, nothing else.
    for (let i = 0; i < 10; i++) {
      const hasBtn = await page.$("#letter-check-results .check-apply");
      if (!hasBtn) break;
      await page.$$eval("#letter-check-results .check-apply", (btns) => btns[0].click());
      await sleep(300);
    }
    const fixedBody = await page.evaluate(
      () => document.getElementById("letter-output").value,
    );
    check(
      "Terapkan per item fixes the body (capital, single spaces, 'di mana')",
      fixedBody.startsWith("Dengan") &&
        !/ {2}/.test(fixedBody) &&
        !/dimana/i.test(fixedBody) &&
        /di mana/.test(fixedBody),
      fixedBody.slice(0, 90),
    );

    // ---- Ide 2 via Anin, now that a draft exists. ----
    await page.click("#anin-fab");
    await sleep(400);
    const checkChat = await aninAsk("periksa surat ini");
    check(
      "Anin 'periksa surat ini' reports the remaining issues in chat",
      /menemukan/.test(checkChat),
      checkChat.slice(0, 120),
    );

    // ---- Ide 1: "nomor surat berikutnya" from the seeded archive. ----
    const nextAnswer = await aninAsk("nomor surat berikutnya");
    check(
      "Anin suggests the next number from the archive (013 → 014)",
      /140\/014\/DS\/XI\/2026/.test(nextAnswer) && /140\/013\/DS\/XI\/2026/.test(nextAnswer),
      nextAnswer.slice(0, 160),
    );
    const tplAnswer = await aninAsk("template surat undangan dari arsip");
    check(
      "Anin reports the format used before for undangan",
      /Surat Undangan/.test(tplAnswer) &&
        /140\/013\/DS\/XI\/2026/.test(tplAnswer) &&
        /2 surat/.test(tplAnswer),
      tplAnswer.slice(0, 160),
    );

    // ---- Ide 1: the small button in the Archive & Drafts tab. ----
    await page.click("#anin-panel-close");
    await sleep(300);
    await page.click('[data-tab="drafts"]');
    await sleep(600);
    await page.click("#drafts-anin-arsip");
    await sleep(400);
    const draftsRes = await page.evaluate(() => ({
      visible: !document.getElementById("drafts-anin-result")?.hidden,
      text: document.getElementById("drafts-anin-result")?.textContent ?? "",
      useBtn: [...document.querySelectorAll("#drafts-anin-result button")].some((b) =>
        /Pakai nomor ini/.test(b.textContent ?? ""),
      ),
    }));
    check(
      "Archive tab button shows the next number + 'Pakai nomor ini'",
      draftsRes.visible && /140\/014\/DS\/XI\/2026/.test(draftsRes.text) && draftsRes.useBtn,
      draftsRes.text.slice(0, 120),
    );
    await page.$$eval("#drafts-anin-result button", (btns) => btns[0].click());
    await sleep(500);
    const usedNumber = await page.evaluate(() => ({
      lettersActive:
        document.querySelector('[data-tab="letters"]')?.classList.contains("active") ??
        false,
      nomor:
        document.getElementById("letter-field-nomor")?.value ?? "",
    }));
    check(
      "'Pakai nomor ini' fills the number into the letter form",
      usedNumber.lettersActive && usedNumber.nomor === "140/014/DS/XI/2026",
      `nomor=${usedNumber.nomor}`,
    );

    // ---- Ide 1: empty archive — Anin must say so, never invent. ----
    await page.click("#anin-fab");
    await sleep(400);
    await page.evaluate(() => localStorage.setItem("desaai-drafts-v1", "[]"));
    const emptyAnswer = await aninAsk("nomor surat berikutnya");
    check(
      "empty archive → Anin honestly says there is no archive yet",
      /Belum ada arsip/.test(emptyAnswer),
      emptyAnswer.slice(0, 120),
    );

    // ---- No app errors / failed requests (env noise filtered). ----
    check("0 console errors (excluding env noise)", errors.length === 0, errors.slice(0, 3).join(" | "));
    check(
      "0 failed requests (excluding env noise)",
      failedRequests.length === 0,
      failedRequests.slice(0, 3).join(" | "),
    );
  } catch (e) {
    console.error("ERROR", e);
    results.push({ name: "harness", ok: false, detail: String(e) });
  } finally {
    await browser?.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    console.log("FAILED:", failed.map((f) => f.name).join(", "));
    process.exit(1);
  }
}

await main();
