// DesaAI — headless checks for Paket 34 (B): Ide 4–6.
// QR verifikasi surat, lapor warga + lacak status, Dashboard Pagi Camat.
// Loads the built app (dist/) via file://, seeds local data, exercises the
// three flows end to end, and takes light + dark screenshots.
// Run after `npm run build`:
//   node scripts/headless-p34-b.mjs
// Exits non-zero when any check fails. (Harness pattern copied from
// scripts/headless-test.mjs — same Chrome detection + env-noise filter.)
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "screenshots");
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

const results = [];
const errors = [];
const failedRequests = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

// ---------- seed data (all relative to "today", so the test is stable) ----------
const now = new Date();
const atHour = (h) => {
  const d = new Date(now);
  d.setHours(h, 0, 0, 0);
  return d.getTime();
};
const weekStart = (() => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.getTime();
})();
const seed = {
  agenda: [
    { id: "ags-p34b-1", nomorAgenda: "101/AGS/2026", arah: "masuk", nomorSurat: "470/1/DS/XI/2026", pihak: "Desa Katis", perihal: "Permohonan bantuan", tanggal: atHour(9), disposisi: "Camat", status: "baru", createdAt: atHour(9) },
    { id: "ags-p34b-2", nomorAgenda: "102/AGS/2026", arah: "keluar", nomorSurat: "470/2/Kec/XI/2026", pihak: "Desa Terak", perihal: "Balasan data penduduk", tanggal: atHour(10), disposisi: "Arsip", status: "selesai", createdAt: atHour(10) },
    { id: "ags-p34b-3", nomorAgenda: "103/AGS/2026", arah: "masuk", nomorSurat: "421/3/Dindik/XI/2026", pihak: "Dinas Pendidikan", perihal: "Undangan sosialisasi", tanggal: weekStart + 86_400_000, disposisi: "Sekretaris", status: "diproses", createdAt: weekStart + 86_400_000 },
  ],
  ikm: [
    { id: "ikm-p34b-1", nama: "Warga Satu", jenisSurat: "pengantar", scores: [3, 3, 3, 3, 3, 3, 3, 3, 3], komentar: "", createdAt: atHour(8) },
    { id: "ikm-p34b-2", nama: "", jenisSurat: "keterangan", scores: [3, 3, 3, 3, 3, 3, 3, 3, 3], komentar: "", createdAt: atHour(11) },
  ],
  aduan: [
    { id: "adu-p34b-1", nama: "Warga Katis", jenis: "Keterlambatan", jenisSurat: "pengantar", isi: "Surat pengantar KTP sudah tiga hari belum selesai.", kontak: "", status: "baru", createdAt: atHour(8) },
    { id: "adu-p34b-2", nama: "", jenis: "Persyaratan tidak jelas", jenisSurat: "keterangan", isi: "Syarat domisili berbeda-beda.", kontak: "", status: "diproses", createdAt: atHour(7) },
    { id: "adu-p34b-3", nama: "Sinta", jenis: "Biaya tidak sesuai", jenisSurat: "sk", isi: "Diminta biaya padahal tertulis gratis.", kontak: "", status: "selesai", createdAt: atHour(6) },
  ],
  drafts: [
    { id: "d-p34b-1", kind: "letter", title: "Undangan Musyawarah Desa", content: "Dengan hormat, kami mengundang Bapak/Ibu pada musyawarah desa hari Jumat pukul 09.00 di Balai Desa Katis.", createdAt: atHour(9), source: "local" },
    { id: "d-p34b-2", kind: "letter", title: "Surat Keterangan Domisili", content: "Yang bertanda tangan di bawah ini menerangkan bahwa nama tersebut berdomisili di Desa Katis.", createdAt: atHour(10), source: "local" },
  ],
};

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("FAIL: dist/index.html missing — run `npm run build` first.");
    process.exit(1);
  }
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
    // Login demo (Paket 36).
    await page.type("#login-user", "demo");
    await page.type("#login-pass", "demo123");
    await page.click(".login-submit");
    await sleep(600);

    // Seed local data + Indonesian UI, then reload (session persists).
    await page.evaluate((seedData) => {
      localStorage.setItem("desaai-lang-v1", "id");
      localStorage.setItem("desaai-agenda-v1", JSON.stringify(seedData.agenda));
      localStorage.setItem("desaai-agenda-meta-v1", JSON.stringify({ seeded: true }));
      localStorage.setItem("desaai-ikm-v1", JSON.stringify(seedData.ikm));
      localStorage.setItem("desaai-ikm-meta-v1", JSON.stringify({ seeded: true }));
      localStorage.setItem("desaai-pengaduan-v1", JSON.stringify(seedData.aduan));
      localStorage.setItem("desaai-pengaduan-meta-v1", JSON.stringify({ seeded: true }));
      localStorage.setItem("desaai-drafts-v1", JSON.stringify(seedData.drafts));
    }, seed);
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1200);

    const lastAninText = () =>
      page.evaluate(() => {
        const msgs = [...document.querySelectorAll(".anin-msg-anin p")];
        return msgs.length ? msgs[msgs.length - 1].textContent ?? "" : "";
      });
    const aninSay = async (text) => {
      await page.type("#anin-input", text);
      await page.keyboard.press("Enter");
      await sleep(900);
    };

    // ---------- Ide 6: Dashboard Pagi Camat ----------
    const camat = await page.evaluate(() => {
      const card = document.getElementById("home-camat");
      return { visible: !!card && !card.hidden, text: card?.textContent ?? "" };
    });
    check("Ide 6: Dashboard Pagi Camat tampil di Beranda (mode petugas)", camat.visible);
    check(
      "Ide 6: surat masuk/keluar hari ini + minggu ini dari agenda",
      /Hari ini: Masuk 1 · Keluar 1/.test(camat.text) && /Minggu ini: Masuk 2 · Keluar 1/.test(camat.text),
      camat.text.replace(/\s+/g, " ").slice(0, 220),
    );
    check(
      "Ide 6: IKM rata-rata 75 dari 2 responden",
      /Rata-rata 75/.test(camat.text) && /2 Responden/.test(camat.text),
      camat.text.replace(/\s+/g, " ").slice(0, 220),
    );
    check(
      "Ide 6: pengaduan Baru 1 · Diproses 1 · Selesai 1 + 2 draf menunggu",
      /Baru 1 · Diproses 1 · Selesai 1/.test(camat.text) && /Draf surat menunggu/.test(camat.text),
      camat.text.replace(/\s+/g, " ").slice(0, 220),
    );
    // "Buka detail" pertama → tab Agenda.
    await page.evaluate(() => {
      document.querySelector("#home-camat-body .camat-row .btn")?.click();
    });
    await sleep(500);
    check(
      "Ide 6: tombol Buka detail membuka tab terkait (Agenda)",
      await page.evaluate(() => document.querySelector('[data-tab="agenda"]')?.classList.contains("active") ?? false),
    );
    await page.click('[data-tab="home"]');
    await sleep(400);
    // Mode Warga menyembunyikan dashboard Camat; kembali ke petugas.
    await page.click("#mode-toggle");
    await sleep(400);
    check(
      "Ide 6: Dashboard Camat disembunyikan di Mode Warga",
      await page.evaluate(() => document.getElementById("home-camat")?.hidden ?? false),
    );
    await page.click("#mode-toggle");
    await sleep(400);
    check(
      "Ide 6: Dashboard Camat kembali tampil di Mode Petugas",
      await page.evaluate(() => !(document.getElementById("home-camat")?.hidden ?? true)),
    );

    // ---------- Ide 4: QR verifikasi ----------
    await page.click('[data-tab="drafts"]');
    await sleep(800);
    const openQrFor = async (title) =>
      page.evaluate((t) => {
        const item = [...document.querySelectorAll("#drafts-list .draft-item")].find((el) =>
          (el.querySelector("h3")?.textContent ?? "") === t,
        );
        item?.querySelector(".draft-qr-btn")?.click();
        return !!item;
      }, title);
    check(
      "Ide 4: draf 'Undangan Musyawarah Desa' ada di arsip",
      await openQrFor("Undangan Musyawarah Desa"),
    );
    await sleep(500);
    const qr = await page.evaluate(() => ({
      open: document.getElementById("qr-dialog")?.open ?? false,
      hasSvg: !!document.querySelector("#qr-dialog-img svg"),
      url: document.getElementById("qr-dialog-url")?.textContent ?? "",
    }));
    check("Ide 4: tombol QR Verifikasi membuka dialog dengan kode QR", qr.open && qr.hasSvg, qr.url);
    check(
      "Ide 4: QR mengkode URL verifikasi statis ?verifikasi=<id>&c=<checksum>",
      /^https:\/\/kuro1996\.github\.io\/desa-ai\/\?verifikasi=d-p34b-1&c=[0-9a-f]{8}$/.test(qr.url),
      qr.url,
    );
    const verifyUrl = qr.url;
    await page.keyboard.press("Escape");
    await sleep(300);

    // Halaman verifikasi (tanpa sesi login — buka di page baru yang
    // sesinya dihapus sebelum boot, membuktikan halaman ini publik).
    const vpage = await browser.newPage();
    await vpage.setViewport({ width: 1280, height: 900 });
    vpage.on("console", (msg) => {
      if (msg.type() === "error" && !isEnvNoise(msg.text())) errors.push(`verify: ${msg.text()}`);
    });
    vpage.on("pageerror", (e) => {
      if (!isEnvNoise(e.message)) errors.push(`verify pageerror: ${e.message}`);
    });
    await vpage.evaluateOnNewDocument(() => {
      localStorage.removeItem("desaai-session-v1");
    });
    const q = new URL(verifyUrl).search;
    await vpage.goto(`file://${join(DIST, "index.html")}${q}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1500);
    const verified = await vpage.evaluate(() => ({
      loginHidden: document.getElementById("login-screen")?.hidden ?? false,
      appHidden: getComputedStyle(document.querySelector(".app-shell")).display === "none",
      pageVisible: !document.getElementById("verify-page")?.hidden,
      status: document.getElementById("verify-status")?.textContent ?? "",
      content: document.getElementById("verify-content")?.textContent ?? "",
    }));
    check(
      "Ide 4: halaman verifikasi tampil tanpa login (aplikasi penuh disembunyikan)",
      verified.loginHidden && verified.appHidden && verified.pageVisible,
      JSON.stringify(verified).slice(0, 160),
    );
    check(
      "Ide 4: id + checksum cocok → TERVERIFIKASI + isi surat tampil",
      /TERVERIFIKASI/.test(verified.status) && verified.content.includes("musyawarah desa"),
      verified.status,
    );
    await vpage.goto(
      `file://${join(DIST, "index.html")}?verifikasi=tidak-ada&c=00000000`,
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    await sleep(1200);
    check(
      "Ide 4: id tidak ada → TIDAK DITEMUKAN dalam arsip (jujur, tanpa klaim palsu)",
      /TIDAK DITEMUKAN dalam arsip/.test(
        (await vpage.evaluate(() => document.getElementById("verify-status")?.textContent ?? "")),
      ),
    );
    await vpage.goto(
      `file://${join(DIST, "index.html")}?verifikasi=d-p34b-1&c=00000000`,
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    await sleep(1200);
    check(
      "Ide 4: checksum salah → DITEMUKAN tapi isi tidak cocok",
      /tidak cocok/.test(
        (await vpage.evaluate(() => document.getElementById("verify-status")?.textContent ?? "")),
      ),
    );
    await vpage.close();

    // ---------- Ide 5: lapor warga lewat Anin + lacak ----------
    await page.click("#anin-fab");
    await sleep(600);
    const chipLapor = await page.evaluate(() =>
      [...document.querySelectorAll("#anin-chips .anin-chip")].some((b) =>
        (b.textContent ?? "").includes("Saya mau lapor"),
      ),
    );
    check("Ide 5: chip Anin 'Saya mau lapor' tersedia", chipLapor);
    await aninSay("Saya mau lapor");
    check("Ide 5: Anin memulai alur lapor (tanya jenis)", /jenis apa/.test(await lastAninText()), await lastAninText());
    await aninSay("1");
    check("Ide 5: Anin minta deskripsi masalah", /Ceritakan|ceritakan/.test(await lastAninText()), await lastAninText());
    await aninSay("Lampu jalan di RT 03 mati sudah seminggu.");
    check("Ide 5: Anin minta nama/kontak (boleh lewati)", /lewati/.test(await lastAninText()), await lastAninText());
    await aninSay("lewati");
    const doneText = await lastAninText();
    check(
      "Ide 5: laporan tersimpan + nomor tiket ADU-2026-0001 diberikan",
      /ADU-2026-0001/.test(doneText) && /Baru/.test(doneText),
      doneText,
    );
    // Lacak di tab Pengaduan.
    await page.click('[data-tab="pengaduan"]');
    await sleep(700);
    await page.type("#adu-search", "ADU-2026-0001");
    await sleep(500);
    const tracked = await page.evaluate(() => ({
      count: document.querySelectorAll("#adu-list .aduan-item").length,
      text: document.getElementById("adu-list")?.textContent ?? "",
    }));
    check(
      "Ide 5: lacak via nomor tiket menampilkan laporan (status Baru)",
      tracked.count === 1 && /ADU-2026-0001/.test(tracked.text),
      `count=${tracked.count}`,
    );
    // Ubah status → linimasa bertambah; detail menampilkan Baru + Diproses.
    await page.evaluate(() => {
      const sel = document.querySelector("#adu-list .aduan-status");
      sel.value = "diproses";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await sleep(600);
    // Buka detail item yang baru dibuat (paling atas setelah reset search).
    await page.evaluate(() => {
      document.getElementById("adu-search").value = "";
      document.getElementById("adu-search").dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(500);
    const timeline = await page.evaluate(async () => {
      const items = [...document.querySelectorAll("#adu-list .aduan-item")];
      const target = items.find((el) => (el.textContent ?? "").includes("ADU-2026-0001"));
      target?.querySelector("button[data-id]")?.click();
      await new Promise((r) => setTimeout(r, 400));
      return document.getElementById("adu-detail-timeline")?.textContent ?? "";
    });
    check(
      "Ide 5: linimasa detail menampilkan Baru → Diproses",
      /Baru/.test(timeline) && /Diproses/.test(timeline),
      timeline.replace(/\s+/g, " ").slice(0, 160),
    );
    await page.keyboard.press("Escape");
    // Draf surat pengaduan ikut dibuat dari laporan.
    await page.click('[data-tab="drafts"]');
    await sleep(800);
    check(
      "Ide 5: draf surat pengaduan dibuat dari laporan Anin",
      /Surat Pengaduan — Keterlambatan \(ADU-2026-0001\)/.test(
        (await page.evaluate(() => document.getElementById("drafts-list")?.textContent ?? "")),
      ),
    );
    // Alur batal: tidak ada yang tersimpan.
    await page.click("#anin-fab");
    await sleep(400);
    await aninSay("saya mau lapor");
    await aninSay("batal");
    check("Ide 5: 'batal' membatalkan laporan", /dibatalkan/.test(await lastAninText()), await lastAninText());
    await page.keyboard.press("Escape");

    // ---------- Screenshots (light) ----------
    await page.click('[data-tab="home"]');
    await sleep(600);
    await page.evaluate(() => document.getElementById("home-camat")?.scrollIntoView());
    await sleep(400);
    await page.screenshot({ path: join(OUT, "p34b-dashboard-light.png") });
    await page.click('[data-tab="drafts"]');
    await sleep(700);
    await openQrFor("Undangan Musyawarah Desa");
    await sleep(500);
    await page.screenshot({ path: join(OUT, "p34b-qr-light.png") });
    await page.keyboard.press("Escape");
    await page.click('[data-tab="pengaduan"]');
    await sleep(700);
    await page.evaluate(async () => {
      const items = [...document.querySelectorAll("#adu-list .aduan-item")];
      const target = items.find((el) => (el.textContent ?? "").includes("ADU-2026-0001"));
      target?.querySelector("button[data-id]")?.click();
      await new Promise((r) => setTimeout(r, 400));
    });
    await sleep(400);
    await page.screenshot({ path: join(OUT, "p34b-pengaduan-light.png") });
    await page.keyboard.press("Escape");

    // ---------- Screenshots (dark) ----------
    await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "dark"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1200);
    check(
      "tema gelap aktif untuk screenshot",
      await page.evaluate(() => document.documentElement.dataset.theme === "dark"),
    );
    await page.evaluate(() => document.getElementById("home-camat")?.scrollIntoView());
    await sleep(400);
    await page.screenshot({ path: join(OUT, "p34b-dashboard-dark.png") });
    await page.click('[data-tab="drafts"]');
    await sleep(700);
    await openQrFor("Undangan Musyawarah Desa");
    await sleep(500);
    await page.screenshot({ path: join(OUT, "p34b-qr-dark.png") });
    await page.keyboard.press("Escape");
    await page.click('[data-tab="pengaduan"]');
    await sleep(700);
    await page.evaluate(async () => {
      const items = [...document.querySelectorAll("#adu-list .aduan-item")];
      const target = items.find((el) => (el.textContent ?? "").includes("ADU-2026-0001"));
      target?.querySelector("button[data-id]")?.click();
      await new Promise((r) => setTimeout(r, 400));
    });
    await sleep(400);
    await page.screenshot({ path: join(OUT, "p34b-pengaduan-dark.png") });
    await page.keyboard.press("Escape");
    // Halaman verifikasi (gelap).
    const vdark = await browser.newPage();
    await vdark.setViewport({ width: 1280, height: 900 });
    await vdark.goto(`file://${join(DIST, "index.html")}${q}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    await vdark.screenshot({ path: join(OUT, "p34b-verify-dark.png") });
    await vdark.close();
    // Halaman verifikasi (terang) — theme kembali light.
    await page.evaluate(() => localStorage.setItem("desaai-theme-v1", "light"));
    const vlight = await browser.newPage();
    await vlight.setViewport({ width: 1280, height: 900 });
    await vlight.goto(`file://${join(DIST, "index.html")}${q}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);
    await vlight.screenshot({ path: join(OUT, "p34b-verify-light.png") });
    await vlight.close();

    // ---------- No console errors / failed requests (selain env noise) ----------
    check("0 console error dari aplikasi", errors.length === 0, errors.slice(0, 3).join(" | "));
    check("0 request gagal dari aplikasi", failedRequests.length === 0, failedRequests.slice(0, 3).join(" | "));
  } finally {
    if (browser) await browser.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.log("FAILED:");
    for (const f of failed) console.log(` - ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FAIL: headless-p34-b crashed", e);
  process.exit(1);
});
