# Paket 44 — Balik ke tampilan lama + grid ikon SEMESTA + IKM sekali saja

**Tanggal:** 28 Nov 2026 ~15:45 WIB · **Base:** main `36def2f` (Paket 43 + addendum deploy) · **Status:** selesai + terverifikasi; deploy ke gh-pages atas Gas Bos "Gass bro" 15:43 WIB (lihat §7).

## 1. Keputusan Bos (15:36 WIB, setelah cek langsung di HP-nya)

Bos mengecek dashboard Paket 42 (AIDEN) di HP-nya dan menilai **tidak rapi**, lalu memerintahkan:

- "balik lagi aja kesini tampilannya" (screenshot HP-nya: header "Dashboard kantor" + 4 tile quick-stats + kartu-kartu bertumpuk satu kolom) "terus design nya yg implementasi dari semestas diimprovisasi aja".
- "Menurut ide ku gimna" — dijawab parent: setuju, revert + improvisasi SEMESTA.
- "Ikm nya aja udah banyak double didashboard" — skor IKM 90,28 muncul 4× di Beranda.

Artinya: **Paket 42 dibatalkan sebagai tampilan** (bukan sebagai kerja — tren IKM di tab IKM dipertahankan). SEMESTA yang semula dibatalkan 14:45 WIB kini dipakai lagi sebagai improvisasi, bukan jiplakan: hanya pola grid ikon menunya yang diambil.

## 2. Yang dibangun

### a. REVERT Beranda ke struktur tampilan lama (screenshot Bos)

- Header "Dashboard kantor" hasil Paket 41 **tetap** (tidak diubah).
- Strip `quick-stats` **kembali tampil di Beranda** — aturan Paket 43 (`body.tab-home .quick-stats { display: none }`) dihapus dari `src/styles.css`, dan penanda `body.tab-home` di `activateTab()` (`src/main.ts`) dicabut (tidak ada lagi yang memakainya).
- **Baris 4 kartu statistik AIDEN (`.home-stat-row`) dihapus seluruhnya** dari `index.html` + semua gaya `.home-stat*` di `src/styles.css` + semua cermin angka di `renderHome()` (`src/main.ts`: `home-stat-ikm/-sub`, `home-stat-letters/-sub`, `home-stat-aduan`, `home-stat-masa/-sub`) + wiring kliknya di `initHome()`.
- **Panel kembali SATU KOLOM bertumpuk di semua lebar** (batalkan grid 2 kolom Paket 42): `.bento` kembali `grid-template-columns: 1fr`. Semua 11 kartu Beranda isinya tetap ada, urutan DOM tetap urutan Paket 42 (pencarian → laporan → pengaduan baru → briefing → pengingat → Anin → SKOR IKM → Camat → masa bhakti → bulan ini → layanan warga), tombol lipat −/+ tetap di 11 kartu.
- Sidebar + tab lain + header tidak berubah.

### b. IMPROVISASI SEMESTA — grid ikon menu di Beranda

- `#menu-grid` baru, paling atas di dalam `.bento` (di bawah header + strip quick-stats): **10 tile untuk semua tab selain Beranda** — Draf Surat, Ringkasan, Tanya Prosedur, Arsip & Draf, Data Kepegawaian, Kepuasan (IKM), Pengaduan, Agenda Surat, Contact Person, Pengaturan.
- Tiap tile: **ikon inline SVG + label saja, tanpa angka** (supaya tidak menambah dobel). Ikon + label sama persis dengan sidebar (SVG yang sama, kunci i18n `tab*` yang sama), jadi label selalu konsisten dengan sidebar di kedua bahasa.
- Ketuk tile = `activateTab(tab)` — navigasi yang sudah ada.
- Layout: **4 kolom di desktop, 3 kolom di ≤700px (HP 390px)**; tile: permukaan putih/biru DesaAI, border, ikon biru 28px di atas label rata tengah; mode gelap rapi (permukaan + teks mengikuti variabel tema). Tidak ada merek, nama, atau teks SEMESTA yang disalin.

### c. DOBEL IKM — skor 90,28 kini hanya SATU KALI di Beranda (di kartu SKOR IKM)

Empat kemunculan lama, tiga di antaranya dihapus:

| # | Tempat lama | Perbaikan |
|---|---|---|
| 1 | Tile quick-stats "Skor IKM" | Diganti **"Draf surat"** — jumlah draf tersimpan (`countLocalDrafts()`, semua jenis draf). Id baru `qs-drafts`, ikon folder, kunci i18n baru `qsDrafts`. |
| 2 | Kartu SKOR IKM | **Dipertahankan** — satu-satunya kemunculan skor di Beranda. |
| 3 | Ringkasan Briefing Pagi ("… • IKM 90,28 (A) • …") | Fragmen IKM dihapus dari `buildBriefing()` → ringkasan kini "3 pengaduan baru • 3 masa bhakti habis • 0 surat hari ini • 0 surat masuk hari ini". |
| 4 | Baris "Kepuasan (IKM)" di Dashboard Pagi Camat ("Rata-rata 90,28 · 12 Responden") | Baris + tombol "Buka detail" **dipertahankan**, nilainya kini hanya **"12 Responden"** (jumlah responden, bukan skor). |

- **Garis tren IKM TETAP di tab Kepuasan/IKM** (item Paket 42 yang dipertahankan, tidak di-revert): 12 titik di bawah batang per unsur.
- Keputusan sadar (bukan kelalaian): teks WhatsApp salinan briefing (`waText`) **tetap memuat baris IKM lengkap** — itu salinan briefing untuk dibagikan ke Camat, bukan tampilan Beranda. Begitu pula tabel rincian pratinjau Laporan bulanan (`home-report-preview`) tetap memuat baris "Jawaban survei: 12 — IKM 90,28 (A)" — itu rekap lengkap satu baris di dalam kartu laporan, bukan ringkasan. Cek headless Paket 44 membatasi hitungan skor ke permukaan ringkasan (strip + kartu SKOR IKM + ringkasan briefing + baris Camat), bukan seluruh halaman.

## 3. File yang diubah

- `index.html` — tile quick-stats ke-2 (IKM → Draf surat); hapus `.home-stat-row`; tambah `#menu-grid` (10 tile).
- `src/main.ts` — cabut `body.tab-home`; `renderQuickStats()` → `qs-drafts`; hapus cermin AIDEN di `renderHome()`; wiring `.menu-tile` di `initHome()`; hapus fragmen IKM dari ringkasan briefing; baris Camat IKM tanpa skor.
- `src/i18n.ts` — kunci baru `qsDrafts` (en "Letter drafts", id "Draf surat").
- `src/styles.css` — hapus aturan Paket 43 + semua gaya `.home-stat*`; `.bento` kembali 1 kolom; gaya baru `.menu-grid` / `.menu-tile` (+ responsif 700px).
- `scripts/headless-test.mjs` — cek Paket 42/43 diganti 6 cek Paket 44 (lihat §4); dua cek lama diperbarui ke perilaku baru (briefing tanpa IKM; quick-stats tile Draf surat).
- `scripts/screenshot-p44.mjs` — baru (390px + 980px, light + dark, Beranda atas + close-up grid + tren IKM).
- `PAKET-44-LAPORAN.md` — laporan ini.

Tidak ikut commit: `PAKET-32/33/34-RENCANA.md`, `VIDEO-BARU-RENCANA.md`, `show-20261127/` (sudah ada sebelumnya, tidak disentuh).

## 4. Verifikasi

| Tes | Hasil |
|---|---|
| `npm run build` | Lolos (tsc + vite, 56 modul) |
| `npm run test:headless` | **419/419 lolos** (tetap 419: 6 cek Paket 42/43 diganti 6 cek Paket 44) |
| `npm run test:pwa` | **16/16** |
| `npm run check:secrets` | Bersih |

Cek headless baru (semua lolos):

1. "Paket 44: AIDEN stat row gone; quick-stats visible on Beranda with Draf surat tile, no IKM tile" — `#home-stat-row` null; strip terlihat; 4 hero-stat; `qs-drafts` = jumlah draf di localStorage; `qs-ikm` null; tidak ada label "Skor IKM"/"IKM score" di strip.
2. "Paket 44: icon menu grid has 10 tiles (all tabs except Beranda), icon + label, no numbers" — 10 tile, set data-tab = {agenda, drafts, ikm, kepegawaian, kontak, letters, pengaduan, qa, settings, summarize}, semua berikon + berlabel, tidak ada angka di teks tile.
3. "Paket 44: every menu tile opens its tab" — ke-10 tile diklik satu per satu, tiap panel terkait terbuka.
4. "Paket 44: Beranda panels back to one column on desktop, 11 cards stay" — semua kartu terlihat berbagi satu posisi kiri di 1280px, 11 kartu di DOM.
5. "Paket 44: at 390px menu grid is 3-per-row, panels stack 1 column, no horizontal overflow" — grid 3/baris, panel 1 kolom, `scrollWidth − 390 = 0`.
6. "Paket 44: IKM score appears exactly once on Beranda (SKOR IKM card only)" — skor live dari kartu SKOR IKM muncul tepat 1× di gabungan teks strip + kartu + ringkasan briefing + baris Camat; strip tidak mengandung skor; ringkasan briefing dan baris Camat tidak mengandung skor.
- Cek Paket 42 (e) dipertahankan: tren IKM di tab Kepuasan (12 titik + polyline + batang per unsur).
- Cek Paket 41 dipertahankan: header muat di 390px tanpa overflow.

Tiga kegagalan awal (bukan regresi) dan perbaikannya:

- Cek baru "IKM score appears exactly once" pertama memakai `document.body.innerText` — gagal dengan count 2 karena skor juga ada di tabel rincian pratinjau Laporan bulanan (baris "Jawaban survei: 12 — IKM 90,28 (A)"). Itu rekap lengkap, bukan duplikasi ringkasan — cek dipersempit ke empat permukaan ringkasan (lihat §2c).
- Cek lama "briefing card shows today's date + summary counts (3 new complaints, IKM 90)" menuntut `/IKM 90/` di ringkasan — diperbarui: ringkasan kini tanpa IKM (`!/IKM/`).
- Cek lama "quick-stats match live data (1 letter, IKM = dashboard, …)" membaca `#qs-ikm` yang sudah tidak ada — diperbarui: tile ke-2 kini `qs-drafts` = jumlah draf di localStorage.

Screenshot (`screenshots/p44-*`, 12 file: Beranda atas + close-up grid + tren IKM × 390px/980px × light/dark) — diperiksa visual:

- 980px light: header + strip 4 tile (Surat tersimpan 0 · Draf surat 0 · Pengaduan selesai 1 · Perangkat desa 23) + grid 4 kolom (Draf Surat, Ringkasan, Tanya Prosedur, Arsip & Draf / Data Kepegawaian, Kepuasan (IKM), Pengaduan, Agenda Surat / Contact Person, Pengaturan); tidak ada baris AIDEN.
- 980px dark: strip + grid rapi, semua terbaca.
- 390px light: grid 3 per baris ("Procedure Q&A" membungkus 2 baris — wajar), panel 1 kolom, tanpa overflow.
- Tren IKM: garis + 12 titik ter-render di tab IKM.

## 5. Commit

- Pesan: `Paket 44: balik ke tampilan lama + grid ikon SEMESTA + IKM sekali saja` (satu commit, sesuai perintah).
- Isi: `index.html`, `src/main.ts`, `src/i18n.ts`, `src/styles.css`, `scripts/headless-test.mjs`, `scripts/screenshot-p44.mjs`, `PAKET-44-LAPORAN.md`, `screenshots/p44-*.png`.

## 6. Catatan jujur

- **Kunci i18n lama yang kini tidak terpakai** (dibiarkan, tidak berbahaya): `qsIkm`, `homeStatLetters`, `homeStatMasa`, `homeStatMasaAkan`, `homeStatMasaHabis`, `camatIkmRata` (dipakai hanya oleh baris Camat lama). Bila suatu hari dibersihkan, itu satu commit kecil.
- **Skor IKM masih muncul di dua tempat NON-ringkasan** (sengaja, lihat §2c): tabel rincian pratinjau Laporan bulanan dan teks WhatsApp salinan briefing. Bila Bos mau skor benar-benar hanya di satu tempat di seluruh aplikasi, kedua tempat itu juga bisa dipangkas — tapi briefing WhatsApp dan laporan bulanan akan kehilangan angka IKM-nya.
- **Bahasa default screenshot/headless di awal suite adalah Inggris** (toggle ke Indonesia terjadi belakangan di suite) — karena itu sebagian screenshot Paket 44 berlabel Inggris; perilaku bahasa aplikasi sendiri tidak berubah (cek bahasa lolos semua).
- **Grid ikon menu menduplikasi navigasi sidebar** — itu memang maksudnya (ala SEMESTA): jalan pintas visual di Beranda, sidebar tetap jadi navigasi utama.

## 7. Addendum deploy

- **LIVE 28 Nov 2026 ~16:36 WIB — gh-pages `0fea5e3`** (dari `2fb594b` Paket 43). Main `3c7eb30`. Deploy: hapus bundle lama `index-CbSUZul-.js` + `index-CSdlRDOk.css`, salin dist (JS baru `index-DyD40UNC.js`, CSS baru `index-CJ0wiFjK.css`), commit "Deploy Paket 44 (main 3c7eb30)", push, `ls-remote` terkonfirmasi `0fea5e3`.
- **Verifikasi live (parent, ~16:36 WIB):** index 200, bundle baru 200, bundle lama 404, `menu-grid` ada di index live, `home-stat-row` 0 kemunculan.
- **Jalan deploy:** Gas "Gass bro" 15:43 WIB → check keamanan menyala di clone (15:55) → Bos "Lanjut" 16:23 WIB → check menyala LAGI di clone baru (16:25) → Bos "Ya lanjutkan aja" 16:33 WIB → deploy dikerjakan langsung parent (hapus bundle → salin dist → commit → push → verifikasi live) → LIVE. Worktree + clone deploy sudah dibersihkan.
