# Paket 45 — Laporan Bulanan Otomatis (.docx asli + cetak PDF)

**Tanggal:** 28 Nov 2026 ~17:00 WIB · **Base:** main `1ac26a4` (Paket 44 LIVE, gh-pages `0fea5e3`) · **Status:** selesai + terverifikasi; **BELUM DEPLOY — menunggu Gas Bos** (lihat §7).

## 1. Keputusan Bos

Bos memilih ide nomor 1 dari 10 ide yang ditawarkan 28 Nov 16:38 WIB — **"Laporan Bulanan Otomatis"** (rekomendasi pertama: paling berguna sehari-hari + menutup celah lama "Export Word → CSV" sebelum update Devpost 1 Des 05:00 WIB).

## 2. Yang dibangun

### a. Kartu "Laporan Bulanan" di Beranda (bukan tab baru)

- Kartu yang sudah ada (`data-card="report"`, tombol lipat −/+ seperti kartu lain) **di-upgrade penuh** — tetap di Beranda supaya mudah ditemukan, konsisten dengan pola kartu yang ada, dan rapi di HP.
- **Pemilih bulan** `<input type="month" id="home-report-month">` default bulan berjalan (November 2026) + tombol geser ‹ › (`home-report-prev` / `home-report-next`); ganti bulan me-render ulang lewat `reportMonthDate` + `monthlyReportData(reportMonthDate)`.
- Isi laporan — **SEMUA dari data lokal nyata** (draf tersimpan, jawaban IKM, pengaduan, agenda surat; tidak ada angka yang dikarang):
  - surat tersimpan bulan itu,
  - agenda masuk & keluar + status Baru/Diproses/Selesai,
  - IKM: skor, jumlah responden, **per unsur 1–4 (9 baris)**,
  - pengaduan: Baru/Diproses/Selesai,
  - agenda/rapat bulan itu (maks. 5 di pratinjau, lengkap di .docx),
  - snapshot kepegawaian.
- **Bulan tanpa data → jujur "Belum ada data bulan ini"** (`home-report-empty`); pratinjau dan elemen dikosongkan — bukan angka nol yang menyesatkan.

### b. Ekspor .docx ASLI (menutup celah lama "Export Word → CSV")

- Modul baru `src/laporan-docx.ts` memakai library **`docx` 9.16.1** (ditambah ke `package.json` dependencies; diverifikasi dulu di Node: magic `PK`, `word/document.xml`, `[Content_Types].xml`, MIME `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- Tombol `home-report-export` kini **"Ekspor Word (.docx)"**; nama file `laporan-bulanan-YYYY-MM.docx`.
- Dokumen memakai **Kop Surat dari `src/letterhead.ts`** (`loadLetterhead()` + `letterheadContactLine()`; Camat/NIP kosong tampil "—" — aplikasi TIDAK PERNAH mengarang nama/NIP). Isi: bagian A–E + blok tanda tangan (Camat + Sekretaris).
- Ekspor CSV bulanan lama (`monthlyReportCsv` / `exportMonthlyReportCsv`) **DIHAPUS**.

### c. Kepegawaian "Export Word" DIPERBAIKI juga (celah yang sama)

- `exportKegDocx()` lewat `buildKegDocx()` — baris yang sama dengan yang tampil di layar (terfilter + terurut), nama file `daftar-pegawai-YYYY-MM-DD.docx`.
- Tombol CSV tetap mengunduh CSV sesuai labelnya. `kegTableData()` dipakai bersama oleh print + docx.

### d. Cetak / Simpan PDF

- `printMonthlyReport()` kini memakai **bulan yang dipilih** (bukan bulan berjalan saja), mengisi kop kantor + baris kontak (`report-print-office` / `report-print-contact`) di `#report-print-area`, memuat IKM per unsur + daftar agenda lengkap + baris perhatian; `window.print()` + print stylesheet khusus lembar laporan (`.print-head-contact` baru), mengikuti pola draf surat.

### e. i18n + Anin

- Kunci baru: `reportMonthLabel`, `reportMonthPrev`, `reportMonthNext`, `reportNoData`, `reportIkmElements`, `reportAgendaList`, `reportExportDocxFail`, `kegExportedDocx`; `homeReportExport` / `homeReportExported` / `homeReportHint` diperbarui ke Word; `aninFaqWord` diperbaiki (dulu catatan jujur "CSV bukan .docx" — kini menyatakan .docx asli); kunci baru `aninFaqLaporan`.
- Anin: entri KB baru `laporan-bulanan` di `src/anin-kb.ts` (kata kunci: laporan bulanan, rekap bulanan, buat laporan bulanan, ekspor laporan, unduh laporan, dll.) → `aninFaqLaporan`.

### f. CSS

- `.report-month-row`, `.report-month-field`, `.report-elements`, `.report-agenda`, print `.print-head-contact`.

## 3. File yang diubah

- `src/laporan-docx.ts` — **baru**: builder .docx laporan bulanan + daftar pegawai (library `docx`).
- `src/main.ts` — `monthlyReportData()` per bulan + `reportMonthDate`; `exportKegDocx()` / `buildKegDocx()` / `kegTableData()`; `printMonthlyReport()` per bulan terpilih; hapus `monthlyReportCsv` / `exportMonthlyReportCsv`; wiring pemilih bulan + tombol ‹ › + ekspor + cetak.
- `index.html` — pemilih bulan + tombol ‹ › di kartu laporan; label tombol ekspor "Ekspor Word (.docx)".
- `src/i18n.ts` — kunci baru + pembaruan label Word (lihat §2e).
- `src/anin-kb.ts` — entri KB `laporan-bulanan`.
- `src/styles.css` — gaya `.report-*` + `.print-head-contact`.
- `package.json` + `package-lock.json` — dependensi baru `docx@9.16.1`.
- `scripts/headless-test.mjs` — 10 cek Paket 45 baru + 1 cek lama Paket 28 diperbarui (lihat §4).
- `scripts/screenshot-p45.mjs` — baru (390px + 980px, light + dark, laporan + bulan kosong).
- `PAKET-45-LAPORAN.md` — laporan ini.

Tidak ikut commit: `PAKET-32/33/34-RENCANA.md`, `VIDEO-BARU-RENCANA.md`, `show-20261127/` (sudah ada sebelumnya, tidak disentuh). `node_modules/` tidak di-commit.

## 4. Verifikasi

| Tes | Hasil |
|---|---|
| `npm run build` | Lolos (tsc + vite; bundle JS 1.317,20 kB / gzip 347,58 kB — peringatan chunk-size dari `docx`, bukan error) |
| `npm run test:headless` | **426/426 lolos** (419 lama + 7 bersih baru — lihat di bawah) |
| `npm run test:pwa` | **16/16** |
| `npm run check:secrets` | Bersih |

Cek headless baru (semua lolos):

1. "monthly report print fills the report area and calls window.print()" — area cetak terisi + `window.print()` terpanggil.
2. "monthly report month picker exists, default = current month" — `#home-report-month` ada, nilai = bulan berjalan.
3. "monthly report preview shows real data (IKM score + 9 per-element rows + agenda list)" — skor 90,28 + 9 baris per unsur + daftar agenda > 0, empty hidden.
4. "empty month shows the honest empty state (no made-up zeros)" — Januari 2026: pesan kosong tampil, pratinjau + elemen kosong.
5. "switching back to the current month restores the real data" — kembali ke November: data nyata muncul lagi (skor 90,28).
6. "prev/next buttons shift the report month by one" — ‹ ke Oktober (kosong), › kembali ke November.
7. "monthly report Word export button exists" — `#home-report-export` ada.
8. "monthly report .docx is a real OOXML file (ZIP + word/document.xml + content)" — MIME `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, ZIP + `word/document.xml`, isi memuat "Laporan Bulanan", "November 2026", "90,28", "Kecamatan Simpangkatis" (xmlLen 36.852).
9. "monthly report .docx export reports the filename" — status: `laporan-bulanan-2026-11.docx`.
10. "monthly report .docx agenda counts match the local register" — masuk=2, keluar=2 (sesuai localStorage).
11. "monthly report .docx export works offline" — ZIP + docXml tetap valid saat offline.
12. "monthly report print uses the selected month (January 2026)" — judul "Januari 2026" + "Belum ada data bulan ini" di badan cetak.
13. "kepegawaian Export Word downloads a real .docx (ZIP + word/document.xml + staff name)" — MIME .docx, memuat "Ahmad Fauzi", status `daftar-pegawai-2026-11-28.docx`.

Dua kegagalan selama pengerjaan (bukan regresi) dan perbaikannya:

- **Cek backup-export gagal di run pertama** — blok CSV lama yang diganti ikut menghapus penangkap `__csvBlobs` yang dibaca cek backup. Diperbaiki: penangkap `__csvBlobs` dipertahankan di penangkap `.docx` (cek backup lolos lagi).
- **Cek lama Paket 28 "Export Word downloads the personnel CSV" gagal dengan header `PK…`** — itu BUKTI perbaikannya bekerja: tombol kini mengunduh .docx asli, bukan CSV. Cek diperbarui ke perilaku baru (nomor 13 di atas): MIME + ZIP + `word/document.xml` + nama staf yang tampil. Cek Paket 28 yang lama memang mendokumentasikan celah yang kini ditutup.

Screenshot (`screenshots/p45-*`, 8 file: laporan + bulan kosong × 390px/980px × light/dark) — diperiksa visual:

- 980px light: pemilih bulan "November 2026" + ‹ ›; "Letters saved: 0 · Mail Register: 2 masuk · 2 keluar (New 1 · In progress 1 · Done 2) · Survey answers: 12 — IKM 90,28 (A) · Complaints: 6 (New 3 · In progress 2 · Done 1)"; 9 baris per unsur (3,08–3,75); daftar agenda 4 surat; tren 6 bulan; tombol "Print report" + "Export Word (.docx)".
- 390px light: kartu rapi, tombol menumpuk vertikal, tanpa overflow horizontal.
- Bulan kosong (Januari 2026, 390px): "No data for this month yet — the numbers will appear once letters, surveys or complaints are recorded." — jujur, tanpa nol palsu.
- 980px dark: semua teks terbaca, tombol jelas.
- Catatan visual: FAB "Ask Anin" melayang menutupi sebagian daftar agenda di sisi kanan — itu perilaku FAB yang sudah ada di seluruh aplikasi, bukan cacat Paket 45.

## 5. Commit

- Pesan: `Paket 45: Laporan Bulanan Otomatis (.docx asli + cetak PDF)` (satu commit, sesuai perintah).
- Isi: `index.html`, `package.json`, `package-lock.json`, `src/laporan-docx.ts`, `src/main.ts`, `src/i18n.ts`, `src/anin-kb.ts`, `src/styles.css`, `scripts/headless-test.mjs`, `scripts/screenshot-p45.mjs`, `screenshots/p45-*.png`, `PAKET-45-LAPORAN.md`.

## 6. Catatan jujur

- **Bundle membesar** karena library `docx`: JS 1.317,20 kB (gzip 347,58 kB) — Vite memberi peringatan chunk-size, bukan error. Bila suatu hari terasa berat di HP lama, `docx` bisa di-load dinamis (`import()` saat tombol ditekan) — belum dilakukan karena build + headless lolos dan ekspor bekerja offline.
- **Tombol CSV kepegawaian tetap ada dan tetap CSV** — sengaja: labelnya jelas "CSV", jadi tidak ada yang menyesatkan. Yang diperbaiki hanya tombol berlabel "Word".
- **Cek lama Paket 28 yang diperbarui** (lihat §4) adalah satu-satunya cek lama yang berubah perilakunya — sisanya 419 cek lama lolos tanpa perubahan.
- **Bahasa default screenshot/headless di awal suite adalah Inggris** (toggle ke Indonesia terjadi belakangan di suite) — karena itu screenshot Paket 45 berlabel Inggris; perilaku bahasa aplikasi sendiri tidak berubah (cek bahasa lolos semua).
- **.docx belum dibuka di Word/LibreOffice sungguhan** — verifikasi di sini adalah struktural (magic ZIP `PK`, `word/document.xml` ter-inflate dan berisi teks yang benar, MIME benar) + library `docx` yang sudah mapan. Pembuktian buka-di-Word yang sesungguhnya tetap di tangan Bos / perangkat nyata.
- **Tren 6 bulan di kartu laporan tetap menampilkan data bulan-bulan lama** meski bulan terpilih kosong — itu memang tren historis, bukan isi bulan terpilih.

## 7. Addendum deploy

*(KOSONG — belum deploy. Menunggu Gas Bos.)*
