# Paket 28 — Redesign ke Model Dashboard SIAP AKAD

**Tanggal:** 27 November 2026
**Basis:** main `59900db` (Paket 27) + rename Dina→Anin di working tree (belum commit)
**Status:** KODE SELESAI — **BELUM LIVE** (deploy ke gh-pages menunggu Gas Bos, bersama Paket 26 + 27)
**Tes:** **BELUM DIJALANKAN** (dilarang di paket ini — tes rename sedang memakai `dist/`).
Typecheck `npx tsc -b --noEmit` **lolos, 0 error**. 13 cek baru ditambahkan
(seksi "9d. Paket 28"); total menjadi **302 headless + 16 PWA = 318** bila
semua hijau — angka ini **perkiraan, belum terbukti** sampai parent
menjalankan suite-nya.

Paket ini merombak tampilan DesaAI mengikuti model dashboard SIAP AKAD
yang Bos kirim lewat 4 screenshot (sidebar biru royal, kartu statistik
cerah, grafik bar + donut, form ber-banner biru, tabel ber-header biru).
**Tidak ada fitur yang dihapus, tidak ada id yang diubah, tidak ada logika
bisnis yang berubah.** Semua angka di layar tetap data live aplikasi
(surat, IKM, pengaduan, perangkat) — angka screenshot model tidak pernah
disalin. Tetap 100% offline: tanpa CDN, tanpa font eksternal, tanpa
library chart (SVG murni + pola bar yang sudah ada).

---

## 1. Sidebar biru royal (tetap, kiri)

Sidebar 264px, gradasi biru tua `#1e3a8a → #1d4ed8 → #1e40af`, sticky
setinggi viewport, tetap biru di tema gelap juga. Isinya:

- **Blok merek di atas:** hero foto kantor yang sudah ada (`kantor.jpg` +
  overlay + `logo.png` + "DesaAI") — lihat "Penyimpangan dari model".
- **Menu vertikal berikon:** kesembilan tab DesaAI yang sudah ada
  (Beranda, Draf Surat, Ringkas Dokumen, Tanya Prosedur, Draf Saya,
  Kepegawaian, IKM, Pengaduan, Buku Agenda) dengan ikon SVG dan atribut
  `data-tab` yang sama persis. Item aktif = pill putih transparan +
  garis putih di kiri.
- **Kaki sidebar:** chip pengguna (lingkaran avatar "A" + "Admin
  Kecamatan" / "Simpangkatis") + tombol gelap **"Keluar"**. Keluar
  diikat ke mode toggle yang sudah ada: beralih ke **Mode Warga**
  (aplikasi tidak punya login, jadi tidak ada fungsi logout baru).
  Kembali ke mode petugas tetap lewat tombol mode di page-head.

## 2. Page head (judul + tanggal + lonceng)

Area konten berlatar abu-abu muda `#f1f5f9`. Di atasnya ada bar
`.page-head`: kiri judul + subjudul halaman, kanan pill tanggal +
lonceng notifikasi + tombol-tombol yang dulu di hero (mode, tema,
bahasa, Ctrl+K, chip status).

- **Judul + subjudul** mengikuti tab yang aktif: diambil dari `h2` +
  hint pertama panel itu sendiri (`updatePageHead`), jadi teks judul
  tetap didefinisikan di satu tempat per tab. `h2` + hint panel
  disembunyikan secara visual (tetap terbaca screen reader dan
  `textContent`).
- **Pill tanggal** live berbahasa Indonesia, misal "Jumat, 27 November
  2026" (`toLocaleDateString("id-ID", …)`).
- **Lonceng** menampilkan jumlah notifikasi yang sama dengan tab
  Kepegawaian (`computeNotifications`); badge merah disembunyikan
  kalau 0; klik lonceng → buka tab Kepegawaian.
- Tombol ghost + chip status yang dulu duduk di atas foto hero gelap
  kini di page-head terang — warnanya disesuaikan (teks gelap di atas
  permukaan terang) agar tetap terbaca.

## 3. Kartu statistik cerah di Beranda

Strip quick-stats lama (3 kartu putih kecil) menjadi **4 kartu gradasi
cerah** dengan angka besar putih + chip ikon: biru = surat tersimpan
(`#qs-letters`), hijau = skor IKM (`#qs-ikm`), oranye = pengaduan
selesai (`#qs-aduan`), merah/pink = perangkat desa (`#qs-perangkat`,
baru — `loadPerangkat().length`). Id lama dipertahankan; tidak ada
angka contoh dari screenshot.

## 4. Dua grafik baru di Beranda (data live, SVG murni)

- **"Distribusi Perangkat per Desa"** — bar horizontal per desa
  (10 desa + 1 baris "Kecamatan Simpangkatis" untuk staf kecamatan —
  perbaikan pasca-tes: tanpa baris itu jumlah bar hanya 15 dari total
  23 perangkat), memakai pola `.chart-row` yang sama dengan grafik
  pengaduan yang sudah ada.
- **"Komposisi Jabatan"** — donut SVG murni (segmen
  `stroke-dasharray` + `pathLength="100"`, diputar −90° supaya segmen
  pertama mulai dari atas), total di tengah, legenda swatch warna +
  jumlah per jabatan. Legenda mencakup jabatan desa
  (`JABATAN_LIST`) **dan** jabatan kecamatan (`JABATAN_KECAMATAN` —
  Camat, Sekcam, …) — perbaikan pasca-tes: tanpa jabatan kecamatan
  legenda hanya menjumlah 15 dari total 23.
- Keduanya membaca `loadPerangkat()` yang sama dengan tab
  Kepegawaian, jadi jumlahnya selalu cocok dengan total perangkat.
  Kartu grafik kini bertiga sebaris (pengaduan + per desa + jabatan,
  masing-masing span 2) — lihat "Penyimpangan dari model".

## 5. Form ber-banner biru

Enam formulir dibungkus `.form-card` (kartu putih + banner header biru
solid berisi judul putih): Draf Surat, Ringkas Dokumen, Tambah Perangkat
(Kepegawaian), Survei IKM, Pengaduan, dan Buku Agenda. Judul banner
memakai kunci i18n subhead yang sudah ada; Draf Surat memakai kunci
baru `lettersFormTitle` ("Isi formulir surat"). Field tetap 2 kolom di
desktop (grid `.form-grid` yang sudah ada); tombol utama kini biru,
tombol sekunder outline putih. Formulir Tambah Perangkat mendapat
tombol **Reset** (seperti model: Simpan + Reset). Kotak Surat Cepat
dan panel QA tidak dibungkus — keduanya bukan formulir isian data.

## 6. Kartu tabel Kepegawaian + Export PDF / Export Word

Bagian "Rekapan Data Perangkat Desa" menjadi `.table-card`: header
kartu berisi judul + dua tombol baru — merah **"Export PDF"**
(`#keg-export-pdf`) dan biru **"Export Word"** (`#keg-export-word`).
Header tabel kini biru (`#1d4ed8`). Tombol CSV lama tetap di tempatnya.
Ketiga tombol ekspor nonaktif saat 0 baris (aturan yang sama).

- **Export PDF** → rute cetak yang sudah ada (`window.print()`,
  target `"keg-table"`). Area cetak tersembunyi `#keg-print-area`
  diisi dari baris yang sedang tampil (filter + urutan yang sama
  dengan tabel, tanpa kolom Aksi); di dialog cetak browser, pilih
  "Save as PDF" untuk menghasilkan file PDF asli.
- **Export Word** → memakai fungsi `exportKegCsv()` yang sudah ada
  (unduhan CSV). **Tidak ada penulis .docx native yang offline** —
  lihat "Penyimpangan dari model".

## 7. Aksen biru + responsif + tema gelap

- Aksen utama hijau → biru: `.btn-primary`, `.tab.active`,
  `.btn-link`, outline fokus input, `.palette-item.selected`,
  hover hasil pencarian, header tabel.
- Tetap hijau: visualisasi data (kartu IKM, grafik, badge, tren).
  `.stat-card` tetap putih (tes lama menegaskan begitu).
- Di bawah 900px sidebar menjadi header atas: hero selebar layar,
  nav jadi baris horizontal yang bisa di-scroll, kaki sidebar jadi
  satu baris; kartu statistik 2 kolom.
- Tema gelap: sidebar tetap biru royal (override tiga kelas karena
  aturan gelap lama `html[data-theme="dark"] .tab` akan menang tanpa
  itu); page-head/pill/lonceng memakai token permukaan/garis yang
  sudah ada.

---

## Pemetaan model → tab DesaAI

| Model SIAP AKAD | DesaAI (Paket 28) |
|---|---|
| Sidebar biru + blok logo | Sidebar biru + hero foto kantor sebagai blok merek |
| Dashboard | Tab Beranda (home) |
| Input Perangkat | Tab Kepegawaian — formulir Tambah Perangkat |
| Rekapan Data | Tab Kepegawaian — kartu tabel + Export PDF/Word |
| Data per Desa | Beranda — grafik per desa; Kepegawaian — kartu per desa |
| Lembaga Desa | Kepegawaian — kartu lembaga (tidak berubah) |
| Pengaturan | Page-head: tombol mode / tema / bahasa (DesaAI tidak punya tab Pengaturan) |
| Kartu statistik (4, warna cerah) | 4 kartu `.hero-stat` — surat, IKM, pengaduan selesai, perangkat (data live) |
| Bar chart "Distribusi Perangkat per Desa" | Kartu baru `.bento-desa-chart` (data live) |
| Donut "Komposisi Jabatan" | Kartu baru `.bento-jabatan-chart` (data live) |
| "Distribusi Agama" | **Belum dibuat** — distribusi agama sudah terlihat per baris di tabel; bisa jadi kartu ketiga nanti |
| Form + Simpan Data / Reset | 6 `.form-card` + tombol Reset di formulir perangkat |
| Tabel + Export PDF / Export Word | `.table-card` + 2 tombol (lihat §6) |
| Settings + toggle + danger zone | **Tidak dibuat** — DesaAI tidak punya halaman pengaturan; tidak ada zona bahaya |
| Pill tanggal + lonceng | Page-head: `#date-pill` + `#notif-bell` |
| Tab DesaAI tanpa padanan di model (Draf Surat, Ringkas Dokumen, Tanya Prosedur, Draf Saya, IKM, Pengaduan, Buku Agenda) | Tetap ada sebagai baris menu sidebar tambahan, tidak berubah |

---

## File yang diubah

| File | Perubahan |
|---|---|
| `index.html` | Struktur baru: `<div class="app-shell">` > `<aside class="sidebar">` (hero merek + nav 9 tab + kaki sidebar + `#sidebar-logout`) + `<div class="app-content">` (`.page-head` dengan `#page-title`, `#page-subtitle`, `#date-pill`, `#notif-bell`, `.top-actions` yang dipindah dari hero) + `config-banner`/`main`/`footer` di dalam konten; 4 kartu `.hero-stat` (baru `#qs-perangkat`); 2 kartu grafik Beranda (`.bento-desa-chart`, `.bento-jabatan-chart`); 6 bungkus `.form-card`; `.table-card` kepegawaian + `#keg-export-pdf`/`#keg-export-word` + `#keg-print-area`; tombol `#keg-reset`; meta theme-color `#1e3a8a` / `#172554` |
| `src/main.ts` | `currentTab` + `updatePageHead(tab)` (dari `h2` + hint panel), `updateDatePill()`, `updateNotifBell()`; `renderQuickStats()` mengisi `#qs-perangkat`; `renderDesaChart()` + `renderJabatanChart()` (SVG murni, palet `CHART_COLORS`) dipanggil dari `renderHome()`; `printKegTable()` (isi `#keg-print-area` dari `kegLastRows` → `window.print()` target `"keg-table"`); wiring `#keg-export-pdf`/`#keg-export-word` di `initKepegawaian()`, `#sidebar-logout` → `applyMode("warga")` di `initMode()`, lonceng → tab Kepegawaian + `updateDatePill()` di `boot()`; `updatePageHead` dipanggil dari `activateTab()` + `applyLang()`; tombol ekspor baru dinonaktifkan bersama CSV saat 0 baris |
| `src/i18n.ts` | 16 kunci baru, id + en: `sidebarUserRole`, `sidebarUserPlace`, `sidebarLogout`, `qsPerangkat`, `homeDesaChartTitle`, `homeDesaChartHint`, `homeDesaChartEmpty`, `homeJabatanTitle`, `homeJabatanHint`, `homeJabatanEmpty`, `notifBell`, `kegExportPdf`, `kegExportWord`, `kegPrinted`, `lettersFormTitle` |
| `src/styles.css` | Variabel `--blue-strong`/`--blue-dark`; aksen biru (`.btn-primary`, `.tab.active`, `.btn-link`, fokus input, `.palette-item.selected`, hover hasil pencarian, header tabel); seksi Paket 28: `.app-shell`, `.sidebar` + tab vertikal + `.sidebar-foot`, `.app-content`, `.page-head` + `.date-pill` + `.notif-bell`, `.hero-stat` (4 gradasi), `.bento-chart/.bento-desa-chart/.bento-jabatan-chart` span 2, `.donut-*`, `.form-card`, `.table-card` + `.btn-export-pdf/.btn-export-word`, cetak `#keg-print-area`, override tema gelap sidebar, media query ≤900px; aturan cetak lama diperluas untuk target `"keg-table"`; `.quick-stat` lama di media query 640px diganti `.hero-stat` |
| `scripts/headless-test.mjs` | Ekspektasi kartu bento 16 → 18; tes quick-stats: selektor `.quick-stat` → `.hero-stat`, 3 → 4 item + cek `#qs-perangkat` sama dengan `#keg-stat-total` (perbandingan live, bukan angka hardcode); seksi baru "9d. Paket 28": 13 cek (sidebar 9 tab, pill tanggal = tanggal hari ini id-ID, page head mengikuti tab Beranda + Draf Surat, badge lonceng = `#keg-notif-count`, jumlah bar donut = total perangkat, header form biru ×6, header tabel biru, Export Word mengunduh CSV, Export PDF mengisi area cetak + memanggil print, Keluar → Mode Warga + toggle kembali ke petugas) |
| `PAKET-28-LAPORAN.md` (file ini) | Laporan paket |

**Tidak disentuh:** `renderAnin` (`src/main.ts`), `src/anin.ts`,
kunci i18n `anin*`, logika bisnis apa pun, data contoh SIAP AKAD,
`dist/` (tidak ada build), git (tidak ada commit/deploy).

## Tes

- **Typecheck `npx tsc -b --noEmit`: lolos, 0 error** (tidak menyentuh
  `dist/`).
- **Headless + PWA: BELUM DIJALANKAN** — dilarang di paket ini karena
  tes rename sedang memakai `dist/` yang sudah dibangun. Parent
  menjalankan sesudahnya. Perkiraan bila semua hijau: **318/318**
  (headless 302 = 289 lama + 13 baru Paket 28; PWA 16/16).
- **Tidak ada tes lama yang dihapus.** Dua ekspektasi lama diperbarui
  dengan benar: kartu bento 16 → 18 (2 kartu grafik baru); quick-stats
  3 → 4 (kartu perangkat baru).
- **HTML diperiksa seimbang** (parser: 0 tag tak tertutup) setelah
  restrukturisasi `index.html`.
- Tes flaky bawaan "kepegawaian summary renders an offline recap
  without AI" tidak disentuh (gagal juga di baseline pra-Paket 12).

### Bug yang ditemukan dan diperbaiki saat mengerjakan paket ini

1. **`printKegTable` pertama memakai `printTarget = "keg-table"`**
   (variabel yang tidak pernah dideklarasikan) — di modul ES (strict
   mode) itu melempar `ReferenceError` saat runtime dan `window.print()`
   tidak pernah terpanggil. Typecheck menangkapnya. Diperbaiki ke
   `document.body.dataset.printTarget = "keg-table"`, pola yang sama
   dengan tiga call site cetak lain (letter/report/archive-letter).
2. **`masaStatus(p).text` tidak ada** — `masaStatus` mengembalikan
   string union (`"aktif" | "akan-habis" | "habis"`), bukan objek.
   Diperbaiki ke helper `kegStatusPill(p).text` yang sudah ada.
   Kunci `kegNameCol`/`kegMasaCol` yang saya kira ada ternyata tidak
   ada di `i18n.ts` — header cetak memakai label yang sama dengan
   header tabel di HTML ("Nama", "Masa Bhakti").

## Penyimpangan dari model (dan alasannya)

1. **Blok logo atas sidebar = hero foto kantor, bukan blok biru
   polos.** Model memakai blok logo biru polos ("SIAP AKAD" +
   "Kec. Simpangkatis"). DesaAI memakai hero foto kantor + logo +
   "DesaAI" sebagai blok merek, supaya tes Paket 4 (tinggi hero,
   `#brand-logo`, `#hero-photo`, overlay) tetap lolos tanpa perubahan.
   Perkiraan tinggi hero di sidebar 280px (min-height) — dalam rentang
   tes 260–340px desktop; di HP 210px (rentang 180–280px).
2. **Export Word = unduhan CSV, bukan file .docx.** Tidak ada penulis
   `.docx` native yang bekerja 100% offline tanpa library. Tombol
   biru "Export Word" memakai `exportKegCsv()` yang sudah ada; ini
   harus dijelaskan jujur ke pengguna — label tombol mengikuti model,
   isinya CSV.
3. **Tiga kartu grafik sebaris (span 2), bukan dua kartu span 3.**
   Rencana awal: dua kartu baru span 3. Ternyata kartu grafik
   pengaduan lama tidak punya span (default 1 kolom) — 1+3+3 akan
   membuat kartu jabatan jatuh ke baris berikut sendirian. Ketiganya
   dijadikan span 2: satu baris rapi berisi pengaduan + per desa +
   jabatan.
4. **Grafik "Distribusi Agama" dan halaman Settings tidak dibuat.**
   Agama sudah terlihat per baris di tabel perangkat; DesaAI tidak
   punya halaman pengaturan (tema/bahasa/mode sudah ada di page-head).
   Keduanya bisa ditambah di paket berikut bila Bos mau.
5. **Tombol ghost + chip di page-head diwarnai ulang** (teks gelap di
   atas permukaan terang) — di model, elemen-elemen itu duduk di atas
   hero gelap; setelah pindah ke page-head terang, warna putihnya
   tidak terbaca.

## Cara Bos mencoba tiap fitur di live site SETELAH deploy

> **Catatan:** Paket 28 belum live. Deploy Paket 26 + 27 + 28 sekaligus
> menunggu Gas Bos. Setelah live, buka
> https://kuro1996.github.io/desa-ai/ lalu:

1. **Sidebar** — menu biru di kiri dengan 9 tab; klik tiap tab,
   item aktif jadi pill terang dengan garis putih di kiri. Scroll
   halaman — sidebar tetap di tempat.
2. **Page head** — judul halaman berubah mengikuti tab (misal "Draft
   an official letter" di tab surat); pill tanggal menunjukkan tanggal
   hari ini; lonceng menampilkan jumlah notifikasi (klik → tab
   Kepegawaian).
3. **Kartu statistik** — 4 kartu warna (biru, hijau, oranye, merah)
   dengan angka live; kartu keempat = jumlah perangkat desa, harus
   sama dengan total di tab Kepegawaian.
4. **Grafik Beranda** — bar per desa + donut jabatan; jumlah semua
   bar dan semua irisan donut harus sama dengan total perangkat.
5. **Form** — buka Draf Surat / IKM / Pengaduan: formulir kini di
   dalam kartu ber-header biru; tombol utama biru.
6. **Tabel + ekspor** — tab Kepegawaian: header tabel biru; klik
   "Export Word" → file CSV terunduh; klik "Export PDF" → dialog
   cetak muncul, pilih "Save as PDF" → file PDF berisi tabel yang
   sedang tampil.
7. **Keluar** — klik "Keluar" di bawah sidebar → aplikasi beralih ke
   Mode Warga (kartu layanan warga muncul); klik "Mode Petugas" di
   atas → kembali.
8. **HP** — buka di layar kecil: sidebar menjadi header atas dengan
   menu horizontal yang bisa digeser.

## Yang masih butuh keputusan / verifikasi Bos

1. **Jalankan tes headless + PWA** (oleh parent, sesudah paket ini) —
   target 318/318; bila ada yang merah, perbaiki sebelum deploy.
2. **Gas deploy Paket 26 + 27 + 28 sekaligus** — prosedur deploy yang
   sama seperti Paket 11–25 (temp clone, `check:secrets`, verifikasi
   `ls-remote` + bundle baru + marker `agenda-search`, Anin,
   Surat Cepat).
3. **Update Devpost setelah live** — submission DesaAI bisa diedit
   sampai **1 Des 2026 05:00 WIB**; entri Paket 26 sudah disiapkan di
   `devpost-update-pack-20261121.md` (entri Paket 27 + 28 menyusul
   setelah live).
4. **Grafik "Distribusi Agama" + halaman Pengaturan** — mau ditambah
   di paket berikut, atau cukup seperti ini?
5. **Uji cloud generation + PWA dari HP Bos** — masih belum terbukti
   (tidak berubah oleh paket ini; tetap menunggu tes Bos di live site).
