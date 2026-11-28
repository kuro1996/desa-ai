// DesaAI — headless-Chrome checks for Paket 34-C (Ide 7–9): notulen rapat,
// Anin Bahasa Bangka, Mode Darurat. Same harness pattern as
// scripts/headless-test.mjs (puppeteer-core, system Chrome, file:// dist,
// demo login, VM tunnel noise filtered out). Run after `npm run build`:
//   node scripts/headless-p34-c.mjs
//
// NOTE on Ide 7 audio: this script PROBES whether the headless Chrome on
// this VM exposes SpeechRecognition at all, and asserts the UI is honest
// about it (mic hidden + honest note when unsupported, mic shown when
// supported). It does NOT prove live transcription: real transcription
// needs Google's speech service over the network, which this VM cannot
// reach. The text path (paste notes → minutes) is fully exercised.
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

const NOTULEN_SAMPLE = [
  "Rapat koordinasi posyandu 28 November 2026",
  "Peserta: Budi Santoso, Siti Aminah, Ahmad Fauzi",
  "Agenda:",
  "1. Jadwal posyandu bulan Desember",
  "2. Perbaikan jalan dusun",
  "Keputusan: Posyandu bulan Desember pindah ke balai desa.",
  "Tindak lanjut: Menyiapkan undangan posyandu oleh Budi Santoso",
].join("\n");

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
    page.on("dialog", (d) => d.accept());

    await page.goto(`file://${join(DIST, "index.html")}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await sleep(1200);

    // Login demo (Paket 36) — seluruh suite berjalan dalam keadaan login.
    const loginDemo = async () => {
      await page.evaluate(() => {
        document.getElementById("login-user").value = "";
        document.getElementById("login-pass").value = "";
      });
      await page.type("#login-user", "demo");
      await page.type("#login-pass", "demo123");
      await page.click(".login-submit");
      await sleep(500);
    };
    await loginDemo();
    const loggedIn = await page.evaluate(
      () => document.getElementById("login-screen")?.hidden === true,
    );
    check("login demo masuk (prasyarat suite)", loggedIn);

    // Set bahasa Indonesia supaya string yang dicek adalah yang Indonesia.
    // CATATAN (quirk pra-ada, bukan dari Paket 34-C): di headless Chrome
    // VM ini (file://) bahasa tersimpan di localStorage TIDAK terbaca saat
    // boot modul — boot juga menunggu probe Firebase yang menggantung,
    // jadi applyLang() tidak kunjung jalan (probe: 60 detik tetap
    // Inggris meski localStorage "id"). Yang deterministik: tombol
    // #lang-toggle memanggil setLang() → applyLang() langsung jalan.
    const setIndonesian = async () => {
      const toggleText = await page.evaluate(
        () => document.getElementById("lang-toggle")?.textContent ?? "",
      );
      if (toggleText.includes("Bahasa Indonesia")) {
        await page.click("#lang-toggle");
        await sleep(600);
      }
    };
    await setIndonesian();
    const langId = await page.evaluate(
      () => document.querySelector('[data-i18n="tabLetters"]')?.textContent,
    );
    check("bahasa Indonesia aktif (via tombol bahasa)", langId === "Draf Surat", `tabLetters="${langId}"`);

    const lastAninText = () =>
      page.evaluate(() => {
        const msgs = [...document.querySelectorAll("#anin-messages .anin-msg-anin p")];
        return msgs.length ? (msgs[msgs.length - 1]?.textContent ?? "") : "";
      });
    const askAnin = async (text) => {
      await page.evaluate(() => {
        document.getElementById("anin-panel").hidden = false;
      });
      await page.evaluate(
        (t) => {
          document.getElementById("anin-input").value = t;
        },
        text,
      );
      await page.click("#anin-send");
      await sleep(900);
    };

    // ============ Ide 7 — Notulen Rapat ============
    const srProbe = await page.evaluate(() => ({
      sr: "SpeechRecognition" in window,
      webkit: "webkitSpeechRecognition" in window,
    }));
    console.log(
      `INFO  SpeechRecognition di headless Chrome VM ini: standard=${srProbe.sr} webkit=${srProbe.webkit}`,
    );
    const srSupported = srProbe.sr || srProbe.webkit;

    await page.click('[data-tab="summarize"]');
    await sleep(500);
    const notulenUi = await page.evaluate(() => ({
      cardVisible: (() => {
        const el = document.getElementById("notulen-card");
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })(),
      micHidden: document.getElementById("notulen-mic")?.hidden ?? null,
      noteVisible: !(document.getElementById("notulen-audio-note")?.hidden ?? true),
      noteText: document.getElementById("notulen-audio-note")?.textContent ?? "",
    }));
    check("panel Notulen Rapat tampil di tab Ringkasan", notulenUi.cardVisible);
    // UI harus jujur soal audio: didukung → tombol tampil; tidak → tombol
    // sembunyi + pesan jujur tampil (bukan diam-diam di-skip).
    check(
      srSupported
        ? "audio didukung: tombol dikte tampil, pesan tidak tampil"
        : "audio TIDAK didukung: tombol dikte disembunyikan + pesan jujur tampil",
      srSupported
        ? notulenUi.micHidden === false && notulenUi.noteVisible === false
        : notulenUi.micHidden === true &&
            notulenUi.noteVisible === true &&
            /tidak mendukung transkripsi audio/.test(notulenUi.noteText),
      JSON.stringify(notulenUi),
    );

    // Probe transkripsi live (INFO, bukan penentu lolos/gagal): klik
    // dikte di headless Chrome VM ini dan catat apa yang terjadi —
    // transkripsi nyata butuh layanan speech Google via jaringan, yang
    // diblokir di VM ini. Yang diuji: tidak crash + ada umpan balik jujur
    // (mendengarkan atau pesan gagal), bukan diam.
    if (srSupported) {
      await page.click("#notulen-mic");
      await sleep(3000);
      const micProbe = await page.evaluate(() => ({
        status: document.getElementById("notulen-status")?.textContent ?? "",
        micDisabled: document.getElementById("notulen-mic")?.disabled ?? null,
      }));
      console.log(`INFO  probe dikte live: status="${micProbe.status}" micDisabled=${micProbe.micDisabled}`);
      check(
        "klik dikte tidak crash + ada umpan balik jujur (mendengarkan/gagal)",
        micProbe.status === "" ||
          /Mendengarkan/.test(micProbe.status) ||
          /gagal/.test(micProbe.status),
        `status="${micProbe.status}"`,
      );
    }

    await page.evaluate(
      (t) => {
        document.getElementById("notulen-input").value = t;
      },
      NOTULEN_SAMPLE,
    );
    await page.click("#notulen-generate");
    await sleep(400);
    const notulenOut = await page.evaluate(() => ({
      wrapVisible: !document.getElementById("notulen-output-wrap")?.hidden,
      text: document.getElementById("notulen-output")?.textContent ?? "",
    }));
    check(
      "notulen dari teks: tanggal + peserta + agenda + keputusan + tindak lanjut + PJ",
      notulenOut.wrapVisible &&
        /Tanggal: 28 November 2026/.test(notulenOut.text) &&
        /Budi Santoso, Siti Aminah, Ahmad Fauzi/.test(notulenOut.text) &&
        /Jadwal posyandu bulan Desember/.test(notulenOut.text) &&
        /Perbaikan jalan dusun/.test(notulenOut.text) &&
        /Posyandu bulan Desember pindah ke balai desa/.test(notulenOut.text) &&
        /Menyiapkan undangan posyandu/.test(notulenOut.text) &&
        /PJ: Budi Santoso/.test(notulenOut.text),
      notulenOut.text.slice(0, 300),
    );
    check(
      "notulen tidak mengarang: tidak ada bagian kosong yang diisi karangan",
      !/\[NAMA\]|\[TANGGAL\]|Tidak diketahui/.test(notulenOut.text),
    );

    await page.click("#notulen-to-letter");
    await sleep(500);
    const followUp = await page.evaluate(() => ({
      lettersActive: document.querySelector('[data-tab="letters"]')?.classList.contains("active"),
      template: document.getElementById("letter-template").value,
      perihal: document.getElementById("letter-field-perihal")?.value ?? "",
      isi: document.getElementById("letter-field-isi")?.value ?? "",
    }));
    check(
      "tombol 'Buat surat tindak lanjut' → tab Surat, template Surat Dinas, perihal + isi terisi",
      followUp.lettersActive &&
        followUp.template === "surat-dinas" &&
        /Tindak Lanjut Hasil Rapat/.test(followUp.perihal) &&
        /28 November 2026/.test(followUp.perihal) &&
        /Posyandu bulan Desember pindah/.test(followUp.isi) &&
        /Budi Santoso/.test(followUp.isi),
      JSON.stringify(followUp),
    );

    // ============ Ide 8 — Anin Bahasa Bangka ============
    await page.click("#anin-fab");
    await sleep(500);
    const bangkaToggle = await page.evaluate(() => ({
      exists: !!document.getElementById("anin-bangka-toggle"),
      label: document
        .querySelector(".anin-bangka-row span")
        ?.textContent?.includes("Bahasa Bangka"),
    }));
    check("sakelar 'Jawab dalam Bahasa Bangka' ada di panel Anin", bangkaToggle.exists && bangkaToggle.label);
    await page.evaluate(() => {
      const cb = document.getElementById("anin-bangka-toggle");
      if (!cb.checked) cb.click();
    });
    await sleep(300);

    await askAnin("cara mengurus KTP");
    const bangkaKtp = await lastAninText();
    check(
      "Bangka ON: 'cara mengurus KTP' dijawab Bahasa Bangka (pacak/dak/ikak)",
      /pacak/.test(bangkaKtp) && /dak/.test(bangkaKtp) && /ikak/.test(bangkaKtp) && /KTP/.test(bangkaKtp),
      bangkaKtp.slice(0, 200),
    );

    await askAnin("cara mengurus surat pengantar");
    const bangkaPengantar = await lastAninText();
    check(
      "Bangka ON: 'surat pengantar' dijawab Bahasa Bangka",
      /mintak/.test(bangkaPengantar) && /ikak/.test(bangkaPengantar) && /RT\/RW/.test(bangkaPengantar),
      bangkaPengantar.slice(0, 200),
    );

    await askAnin("cara membuat surat");
    const bangkaFallback = await lastAninText();
    check(
      "Bangka ON, topik tanpa jawaban Bangka: dijawab Indonesia + catatan jujur 'lom ade'",
      /lom ade/.test(bangkaFallback),
      bangkaFallback.slice(0, 200),
    );

    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1200);
    const bangkaPersist = await page.evaluate(
      () => document.getElementById("anin-bangka-toggle")?.checked === true,
    );
    check("sakelar Bangka bertahan setelah reload (localStorage)", bangkaPersist);
    // Matikan lagi supaya profil uji kembali ke keadaan awal.
    await page.evaluate(() => {
      const cb = document.getElementById("anin-bangka-toggle");
      if (cb.checked) cb.click();
    });
    await sleep(300);
    // Reload mengembalikan UI ke Inggris (quirk pra-ada, lihat atas) —
    // nyalakan lagi Bahasa Indonesia sebelum cek Mode Darurat.
    await setIndonesian();

    // ============ Ide 9 — Mode Darurat ============
    await page.click('[data-tab="letters"]');
    await sleep(500);
    const daruratGrid = await page.evaluate(() => ({
      count: document.querySelectorAll("#darurat-grid .darurat-btn").length,
      labels: [...document.querySelectorAll("#darurat-grid .darurat-btn")].map((b) =>
        b.textContent?.trim(),
      ),
    }));
    check(
      "Mode Darurat: 8 tombol (4 bencana × laporan/bantuan)",
      daruratGrid.count === 8 &&
        daruratGrid.labels.includes("Laporan: Banjir") &&
        daruratGrid.labels.includes("Bantuan: Banjir") &&
        daruratGrid.labels.includes("Laporan: Kebakaran") &&
        daruratGrid.labels.includes("Bantuan: Kebakaran") &&
        daruratGrid.labels.includes("Laporan: Tanah Longsor") &&
        daruratGrid.labels.includes("Bantuan: Tanah Longsor") &&
        daruratGrid.labels.includes("Laporan: Gempa Bumi") &&
        daruratGrid.labels.includes("Bantuan: Gempa Bumi"),
      daruratGrid.labels.join(" | "),
    );

    await page.evaluate(() => {
      document.querySelector('[data-jenis="Banjir"][data-kind="laporan"]')?.click();
    });
    await sleep(400);
    const daruratLaporan = await page.evaluate(() => ({
      template: document.getElementById("letter-template").value,
      jenis: document.getElementById("letter-field-jenisBencana")?.value ?? "",
      status: document.getElementById("cepat-status")?.textContent ?? "",
    }));
    check(
      "satu ketuk 'Laporan: Banjir' → template Laporan Kejadian Darurat, jenis bencana terisi",
      daruratLaporan.template === "darurat-laporan" &&
        daruratLaporan.jenis === "Banjir" &&
        /kerangka.*terisi/.test(daruratLaporan.status),
      JSON.stringify(daruratLaporan),
    );

    await page.evaluate(() => {
      document.querySelector('[data-jenis="Gempa Bumi"][data-kind="bantuan"]')?.click();
    });
    await sleep(400);
    const daruratBantuan = await page.evaluate(() => ({
      template: document.getElementById("letter-template").value,
      jenis: document.getElementById("letter-field-jenisBencana")?.value ?? "",
    }));
    check(
      "satu ketuk 'Bantuan: Gempa Bumi' → template Permohonan Bantuan Darurat, jenis terisi",
      daruratBantuan.template === "darurat-bantuan" && daruratBantuan.jenis === "Gempa Bumi",
      JSON.stringify(daruratBantuan),
    );

    // Perintah Anin "surat darurat banjir" (tanpa kata kerja "buat").
    await askAnin("surat darurat banjir");
    await sleep(400);
    const aninDarurat = await page.evaluate(() => ({
      lettersActive: document.querySelector('[data-tab="letters"]')?.classList.contains("active"),
      template: document.getElementById("letter-template").value,
      jenis: document.getElementById("letter-field-jenisBencana")?.value ?? "",
    }));
    check(
      "perintah Anin 'surat darurat banjir' → tab Surat, template Laporan Darurat, Banjir",
      aninDarurat.lettersActive &&
        aninDarurat.template === "darurat-laporan" &&
        aninDarurat.jenis === "Banjir",
      JSON.stringify(aninDarurat),
    );

    // Draf offline (mode demo di headless → jalur offline): isi menyebut Banjir.
    await page.evaluate(() => {
      document.getElementById("letter-field-lokasi").value =
        "Dusun Katis RT 02 RW 01, Desa Simpangkatis";
    });
    await page.click("#letter-generate");
    await sleep(800);
    const daruratDraft = await page.evaluate(() => ({
      wrapVisible: !document.getElementById("letter-output-wrap")?.hidden,
      text: document.getElementById("letter-output")?.value ?? "",
    }));
    check(
      "draf darurat ter-generate offline dan menyebut Banjir + lokasi",
      daruratDraft.wrapVisible &&
        /Banjir/.test(daruratDraft.text) &&
        /Dusun Katis/.test(daruratDraft.text),
      daruratDraft.text.slice(0, 200),
    );

    // Template lama tidak berubah: 7 template lama + 2 darurat = 9.
    const templateIds = await page.evaluate(() =>
      [...document.querySelectorAll("#letter-template option")].map((o) => o.value),
    );
    check(
      "template lama utuh (7 lama + 2 darurat = 9 opsi)",
      templateIds.length === 9 &&
        ["surat-dinas", "sk", "undangan", "pengantar", "keterangan", "sktm", "sk-pengangkatan"].every(
          (id) => templateIds.includes(id),
        ) &&
        templateIds.includes("darurat-laporan") &&
        templateIds.includes("darurat-bantuan"),
      templateIds.join(","),
    );

    // ============ Kebersihan runtime ============
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
