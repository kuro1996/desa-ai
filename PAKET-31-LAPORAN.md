# Paket 31 — Laporan

Tanggal: 27 November 2026 (malam)
Permintaan Bos (23:05–23:26 WIB, dari screenshot HP):
1. Mode gelap yang benar: selama ini mode gelap memaksa token terang (mode gelap palsu) — ubah jadi gelap sungguhan: background hitam, tulisan putih, semua elemen menyesuaikan. Lembar surat tetap putih-kertas (halaman cetak).
2. Page head didesain ulang (area judul halaman + subjudul + chip tanggal + bel + chip status + tombol bahasa/mode/tema): lebih bagus, tambahkan gambar/header yang enak dilihat.
3. Blok brand sidebar didesain ulang (logo + nama aplikasi + tagline + identitas kantor): tata letak lebih rapi, cari referensi modern dan profesional.
4. Logo resmi Kabupaten Bangka Tengah yang baru dikirim dipasang BERDAMPINGAN dengan logo Kecamatan Simpangkatis di blok brand — dua logo bersebelahan, ukuran seimbang, jelas di mode terang maupun gelap.

## Yang diubah

### 1. Mode gelap sungguhan
- Akar masalah: blok `html[data-theme="dark"]` di `src/styles.css` (~baris 1787) memaksa token TERANG (`--bg #e9eef5`, `--surface #fff`) — mode gelapnya palsu. Keluhan Bos di screenshot 23:05 (teks putih di atas putih) berasal dari sini.
- Perbaikan: token gelap ditulis ulang — `--bg #0b0d12` (hitam pekat), `--surface #15181f`, `--ink #f2f5f9` (putih), `--muted #a8b2c1`, `--line #262c38`, warna soft gelap, `color-scheme: dark`. Semua override lama yang memaksa terang diganti dengan nilai gelap.
- Semua elemen menyesuaikan: kartu/surface, input/select/textarea, tombol termasuk ghost, chip, tabel, dialog, sidebar, stat card warna-warni (biru/hijau/oranye/merah muda) tetap hidup dengan kontras teks terbaca, chart bar + donut tetap terbaca di gelap. Teks aksen diterangkan di gelap (status error/urgent → #f87171, angka stat → biru/hijau/teal/amber/rose terang, badge → #4ade80/#93c5fd, link → #8ab8ff, placeholder → #7d8898).
- PENGECUALIAN (sesuai perintah): lembar surat (`.letter-sheet`) TETAP putih-kertas dengan teks hitam di kedua tema, karena itu halaman cetak. Dicek khusus oleh tes baru (lihat Verifikasi).
- Mekanisme tema tidak berubah: atribut `data-theme` di `<html>`, localStorage key `desaai-theme-v1`, script pre-paint di `<head>`, tombol `#theme-toggle`. Mode TERANG tidak berubah (biru-putih-hitam, Plus Jakarta Sans).

### 2. Page head jadi banner
- `.page-head` didesain ulang sebagai banner: gradien biru gelap + lapisan foto kantor (`public/kantor.jpg` disalin ke `src/assets/kantor.jpg`, 185 KB, dibundel Vite karena base `"./"` — bukan path absolut root) + overlay gelap, judul halaman putih 24px, subjudul putih transparan 0.85, kontrol (chip tanggal, bel, chip status, tombol bahasa/mode/tema) kaca tembus pandang putih.
- Banner IDENTIK di kedua tema (gradien gelap + foto) — judul page-head sengaja PUTIH di terang maupun gelap, karena duduk di atas banner gelap. Ini bukan warna ink mode gelap.
- Semua kontrol tetap berfungsi dan terlihat di kedua tema; layout mobile 390px (padding banner 16px) dan desktop 980px+ tidak rusak; hero foto kantor di sidebar tidak diubah.
- Logika AI/cloud, isi surat, dan perilaku chip "On-device: not supported here" tidak disentuh.

### 3. Blok brand sidebar didesain ulang + dua logo
- Riset dulu referensi desain brand dashboard admin modern (panduan AdminLTE 2026 + pola logo-lockup): hierarki dari ukuran/bobot huruf dan spasi, bukan dari kotak-kotak; lockup vertikal (lambang di atas, wordmark di bawah); gutter 1.0–1.5X; uji keterbacaan di terang + gelap.
- Tata letak baru (lockup bertumpuk): baris pertama dua badge logo berdampingan, lalu nama aplikasi besar (800), tagline, garis pemisah tipis, lalu identitas kantor.
- Dua logo di dalam badge putih (latar terang) supaya terbaca di atas foto hero gelap, di tema terang maupun gelap:
  - Logo Kabupaten Bangka Tengah — file baru `public/logo-bangka-tengah.jpg` (salinan dari file yang dikirim Bos 23:26 WIB), direferensikan lokal, tidak di-hotlink.
  - Logo Kecamatan Simpangkatis — `public/logo.png` yang sudah ada (720×775 RGBA, desain "Heritage of Simpangkatis").
  - Kedua logo tampil setinggi 52px di dalam badge 64×64px (mobile: 42px di badge 54px) — tinggi sama, tampak seimbang.
- **Catatan ukuran logo kabupaten: file aslinya sangat kecil — 76×99 px, RGB, 3,4 KB.** Ditampilkan maksimal 52px tingginya (≈40px lebar), JAUH di bawah ukuran aslinya — tidak pernah di-upscale, jadi tetap tajam. Bila Bos ingin logo kabupaten tampil lebih besar dari ~76px, perlu file resolusi lebih tinggi.
- Identitas kantor tetap ada ("KECAMATAN SIMPANGKATIS • KABUPATEN BANGKA TENGAH"); navigasi sidebar dan layout mobile tidak rusak; font tetap Plus Jakarta Sans. Logo lama di kop surat tidak berubah (kop surat tetap pakai logo kecamatan).

### 4. Nama aplikasi tetap "DesaAI"
- Perintah rename nama tampilan sempat masuk (23:22–23:24 WIB) dan sudah diterapkan sebagian di working tree (UI, `<title>`, manifest) — lalu **dibatalkan oleh keputusan final Bos 23:41 WIB**. Rename di-revert seluruhnya dari working tree sebelum commit apa pun; tidak ada commit rename.
- Verifikasi akhir: 0 kemunculan nama baru di `src/`, `index.html`, `public/`, `scripts/` (grep, 27 Nov 23:45 WIB). Nama aplikasi tetap "DesaAI" di semua tempat: brand sidebar/header, `<title>`, manifest `name` + `short_name`, string UI, sapaan Anin. Repo, URL, rujukan Devpost/kompetisi, identifier kode, dan cache service worker memang tidak pernah disentuh.

## Verifikasi

- `npm run build` — LOLOS (dist: `index-DBbP_qsq.css`, `index-_rRhaWke.js`; foto kantor terbundel `kantor-BQe6tDd-.jpg` 185 KB; `logo-bangka-tengah.jpg` + `logo.png` tersalin ke dist).
- `npm run test:headless` — **331/331 checks passed** (naik dari 329: +1 cek lembar surat gelap, +1 cek logo kabupaten).
  - Penyimpangan tes (dicatat jujur): run pertama 329/331 — dua cek dark mode GAGAL karena asersi saya yang salah: saya mengharapkan judul page-head berwarna ink gelap `rgb(242,245,249)`, padahal judul itu PUTIH by design di kedua tema (di atas banner gradien gelap). Bukan regresi aplikasi — asersi diperbaiki ke `rgb(255,255,255)` dengan komentar penjelas, lalu run ulang 331/331.
  - Tes baru Paket 31: banner page-head (judul putih, subjudul rgba(255,255,255,0.85), background gradien + "kantor"); dark mode sungguhan (bg `rgb(11,13,18)`, tombol kaca `rgba(255,255,255,0.14)`); dark mode mobile (bg `rgb(11,13,18)`, kartu `rgb(21,24,31)`); **lembar surat tetap putih di mode gelap** (bg `rgb(255,255,255)`, teks hitam); logo kabupaten termuat (`#brand-logo-kab` naturalWidth > 0).
- `npm run test:pwa` — **16/16 checks passed**.
- `npm run check:secrets` — **bersih**.
- Screenshot VIEWPORT (bukan fullPage — pelajaran Paket 30: fullPage menyesatkan), diperiksa visual satu per satu: tidak ada teks tak terbaca di terang maupun gelap, 390px maupun 980px.
  - `show-20261127/desaai-p31-home-light-mobile.png` (390px terang)
  - `show-20261127/desaai-p31-home-dark-mobile.png` (390px gelap)
  - `show-20261127/desaai-p31-home-light-980.png` (980px terang)
  - `show-20261127/desaai-p31-home-dark-980.png` (980px gelap)
  - `show-20261127/desaai-p31-letter-offline-mobile.png` (lembar surat, terang)
  - `show-20261127/desaai-p31-letter-dark-mobile.png` (lembar surat di mode gelap — kertas tetap putih, latar halaman gelap)
  - Script: `scripts/screenshot-p31.mjs` (adaptasi `screenshot-p30.mjs`). Screenshot TIDAK di-commit (konvensi Paket 30).

## File yang berubah (commit `89ce950`)

- `src/styles.css` — token gelap sungguhan + override gelap + banner page-head + blok brand baru (badge logo, lockup bertumpuk, garis pemisah).
- `index.html` — markup blok brand (dua badge logo + `.brand-text`).
- `src/assets/kantor.jpg` (baru) — foto kantor untuk banner page-head, dibundel Vite.
- `public/logo-bangka-tengah.jpg` (baru) — logo resmi Kabupaten Bangka Tengah, 76×99 px.
- `scripts/headless-test.mjs` — asersi Paket 31 (banner, dark mode, lembar surat gelap, logo kabupaten) + perbaikan asersi judul page-head.
- `scripts/screenshot-p31.mjs` (baru) — script screenshot viewport terang + gelap.
- Laporan ini — commit terpisah setelah `89ce950`.

## Catatan deploy — MENUNGGU GAS BOS

- **TIDAK di-deploy ke gh-pages dan TIDAK di-push branch deploy** — sesuai perintah. Yang di-commit hanya main (`89ce950` + laporan ini).
- Live site saat ini masih Paket 30 (gh-pages `c788e2b`). Paket 31 baru tampil setelah Bos memberi Gas untuk deploy — jalankan deploy dari fresh single-branch clone seperti Paket 30, lalu verifikasi `ls-remote`.
- Yang masih terbuka dari paket sebelumnya (tidak disentuh Paket 31): "Export Word" di tabel kepegawaian masih mengunduh CSV, bukan .docx; generasi cloud belum terbukti di HP Bos (draf offline yang jalan); update Devpost (proyek 1305863) bisa diedit sampai 1 Des 2026 05:00 WIB.
