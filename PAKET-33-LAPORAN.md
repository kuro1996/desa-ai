# Paket 33 — Laporan: tombol "Kirim ke WhatsApp" untuk draf surat (SELESAI, belum deploy)

Perintah Bos 28 Nov 00:00 WIB: "Pakai solusi tombol kirim ke whatsapp aja
untuk draft surat terkirim." Dipilih dari opsi yang ditawarkan 27 Nov 23:56 —
solusi gratis yang bisa jalan sekarang (tanpa backend, tanpa nomor Business,
tanpa setup Meta).

## Yang dibangun

### 1. Tombol "Kirim ke WhatsApp" di lembar draf surat
- Baris aksi di bawah lembar surat kini: Salin / Unduh .txt / Cetak /
  **Kirim ke WhatsApp** / Simpan draf (`index.html`, `src/main.ts`).
- Satu ketuk membuka `https://wa.me/?text=<isi surat ter-encode>` di tab baru
  — di HP membuka aplikasi WhatsApp, di desktop membuka WhatsApp Web.
  Tinggal pilih penerima lalu kirim. Tanpa login, tanpa biaya, tanpa server.
- Teks yang dikirim: isi draf apa adanya (teks yang bisa diedit di kotak
  "Teks draf"), lengkap dengan nomor/tanggal/perihal bila sudah terisi di draf.

### 2. Surat yang sangat panjang — fallback salin + buka WhatsApp
- Tautan wa.me putus pada URL yang sangat panjang, jadi bila URL berbagi
  melewati 6.000 karakter (`WA_MAX_SHARE_URL`), aplikasi MENYALIN seluruh
  isi surat ke clipboard lalu membuka `https://wa.me/` kosong — petugas
  tinggal tempel di WhatsApp. Status memberi tahu apa yang terjadi
  ("Surat terlalu panjang untuk tautan — teks disalin, tempel di WhatsApp.").
- Bila penyalinan pun gagal, tampil pesan galat yang jelas (bukan diam) dan
  tidak ada tautan raksasa yang dibuka.
- Draf kosong tidak membuka apa-apa — status meminta teks dulu.

### 3. Surat arsip juga bisa dikirim
- Setiap surat tersimpan di tab Arsip & Draf kini punya tombol
  "Kirim ke WhatsApp" di samping tombol Cetak (`renderDraftItem`,
  `src/main.ts`) — memakai isi arsip yang sama, fallback panjang yang sama.

### 4. Anin tahu fitur ini
- Entri KB baru "Kirim surat ke WhatsApp" (`src/anin-kb.ts` + `aninFaqWa`
  di `src/i18n.ts`): Anin bisa menjelaskan cara kirim draf/arsip ke WhatsApp
  dan fallback surat panjang. Basis pengetahuan kini 26 entri.

## Verifikasi (di commit ini)
- `npm run build` — lolos (tsc + vite).
- `npm run test:headless` — **374/374** (Paket 32: 359; +4 cek baru Paket 33
  + 11 cek Paket 32.1 yang masuk suite sejak laporan Paket 32):
  tombol ada di baris aksi (5 tombol); surat pendek membuka wa.me dengan
  teks ter-encode + status "WhatsApp terbuka"; surat 9.000 karakter
  fallback ke salin (9.000 tersalin) + wa.me kosong + status "terlalu
  panjang"; surat arsip punya tombol WhatsApp dan membuka wa.me dengan
  isinya.
- `npm run test:pwa` — **16/16** (tidak ada file precache baru).
- `npm run check:secrets` — bersih.
- Screenshot VIEWPORT (bukan fullPage) — 3 file di `show-20261127/`
  (tidak di-commit), diverifikasi visual: terang + gelap, 390px + 980px,
  tombol "Kirim ke WhatsApp" rapi di baris aksi.
  - `desaai-p33-wa-light-mobile.png`, `desaai-p33-wa-dark-mobile.png`
  - `desaai-p33-wa-light-980.png`

## Tiga cek lama yang ikut diperbaiki (bukan bug aplikasi)
Selama verifikasi, suite sempat merah 368/374 — tiga gagalnya sudah ada
sebelum Paket 33 (terdokumentasi sebagian di komentar `src/kb.ts` soal
regresi Paket 32.1, 367/370) dan semuanya hanya soal ekspektasi tes:
1. **"offline procedure guide renders"** — tes mengharap 10 entri, padahal
   panduan prosedur (`src/kb.ts`) sudah tumbuh jadi 16 entri sejak Paket
   32.1 (domisili, jam-layanan, dasar-hukum, ktp-hilang, belum-menikah,
   +1). Ekspektasi diperbarui ke 16.
2. **"Anin does NOT invent office hours"** — jawaban Anin sudah benar
   (entri Jam Layanan: "jam tidak tercantum di aplikasi ini"), tapi regex
   tes `/konfirmasi/` (huruf kecil) tidak cocok dengan "Konfirmasi" di
   awal kalimat langkah. Regex jadi case-insensitive.
3. **"Tanya answers a KK question"** — gagal di 2 run pertama, lolos di
   run ke-3 tanpa perubahan kode aplikasi: `matchKb` terbukti benar di
   Node (`"Bagaimana cara mengurus KK baru?"` → `["kk"]`) dan alur Tanya
   terbukti benar di probe browser terpisah (jawaban panduan KK tampil
   + status Anin offline). Penyebab yang paling mungkin: balapan waktu
   init Firebase di VM ini (init selesai di tengah suite → jalur AI
   sempat terpanggil dan `generateStream` menggantung di tunnel yang
   diblokir). Bukan bug aplikasi; cek ini sensitif terhadap waktu init.
   Dicatat sebagai risiko flake bila suite dijalankan ulang di VM ini.

## File yang berubah (commit kode)
`index.html`, `src/i18n.ts`, `src/main.ts`, `src/anin-kb.ts`,
`scripts/headless-test.mjs`, `scripts/screenshot-p33.mjs` (baru).
Rencana di `PAKET-33-RENCANA.md` (tidak di-commit, seperti paket lalu).

## Yang TIDAK dilakukan
- **Tidak deploy** ke gh-pages — menunggu Gas Bos.
- Tidak menyentuh kredensial/API key; tidak mengubah logika isi surat.
- Backlog yang masih terbuka (tidak disentuh Paket 33): tombol
  'Export Word' masih mengunduh CSV bukan .docx; cloud generation belum
  terbukti jalan (butuh langkah konsol Bos); area print surat masih teks
  polos; perilaku PWA live belum terbukti dari HP Bos.
- Berikutnya sesuai urutan: Paket 34 (9 ide Anin/aplikasi) — jangan
  paralel dengan Paket 33 sebelum deploy.
