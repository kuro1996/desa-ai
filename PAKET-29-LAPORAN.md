# Paket 29 — Perbaikan Page-Head + Hasil Draf sebagai Lembar Surat Resmi

Tanggal: 27 Nov 2026. Perintah Bos 13:30 WIB: (1) "Yg saya lingkari design nya jelek
bisa rubah gk tampilannya" (page-head di mode gelap HP), (2) "pas ngisi draft surat,
bisa nggak tampilan hasilnya keluar", (3) "Format contoh hasil nya kayak gini" +
PDF Surat Upacara HUT KORPRI 2026 ke OPD.

## A. Diagnosis page-head (terbukti di repro, bukan tebakan)

Repro: Playwright 390px + mode gelap, tab Draf Surat — SEBELUM perbaikan:
- `h1Size: 32px` (default browser), `subColor` = warna judul (bukan muted),
  `contentBg: rgb(241,245,249)` = #f1f5f9 TERANG di mode gelap.
- Judul + subjudul + tombol Bahasa/Mode/⌘K nyaris tak terlihat (teks terang di atas
  slab terang; tombol ghost transparan + teks putih).

Akar masalah (3 bug):
1. **Class mismatch**: HTML `.page-head-titles`, CSS `.page-head-text h1/p` — aturan
   judul/subjudul TIDAK PERNAH cocok → h1 pakai default browser 2em, subjudul tanpa
   warna muted.
2. **`.app-content` hardcode `#f1f5f9`** tanpa override gelap → slab terang di mode gelap.
3. **`.page-head .btn-ghost` (0,2,0) kalah dari `html[data-theme="dark"] .btn-ghost`
   (0,2,1)** yang transparan + teks putih (untuk foto hero gelap) → tombol tak terlihat.

## B. Perbaikan page-head (src/styles.css)

- `.page-head-text h1/p` → `.page-head-titles h1/p` (24px/1.5rem + `--muted`).
- `.app-content { background: var(--bg); }` (dulu `#f1f5f9` mentah).
- Varian gelap eksplisit `html[data-theme="dark"] .page-head .btn-ghost` (+ hover)
  dengan spesifisitas lebih tinggi → tombol kembali ke token permukaan.
- Mobile ≤900px: `.page-head` jadi kolom (judul lebar penuh di atas, pill + lonceng +
  aksi membungkus rapi di bawah), h1 1.25rem, `.page-head-right` flex-wrap.
- SESUDAH (repro): h1 20px (mobile), judul rgb(232,240,234), subjudul
  rgb(159,179,164) = `--muted` gelap, contentBg rgb(15,26,19), scrollW 390 (tanpa
  overflow). Screenshot: `show-20261127/desaai-p29-head-dark-mobile.png`.

## C. Hasil draf = lembar surat resmi (seperti PDF Bos)

- `#letter-sheet` di dalam `#letter-output-wrap` (di atas teks mentah): kop (logo +
  2 baris instansi + kontak dari pengaturan kop petugas) + garis ganda + meta
  (Nomor/Tanggal/Perihal/Kepada Yth.) + **tabel rincian undangan** (Acara/Hari/
  Tanggal/Waktu/Tempat, seperti tabel di PDF) + isi (paragraf, justify) +
  **Tembusan** + tanda tangan (Camat dari pengaturan kop + Sekretaris bila diisi).
- Teks mentah tetap ada di balik `<details>` ("Teks draf — bisa diedit") — Copy/
  Download/Print/Save tetap membaca textarea, tidak berubah.
- `renderLetterSheet()` (src/main.ts) memakai ulang `printMetaRow`,
  `printSignBlock`, `printSecretaryBlock` (Paket 15/17) — tidak ada nama/nomor/
  tanggal yang dikarang: kolom kosong tampil "—".
- Wiring: bingkai lembar tampil saat Generate ditekan, terisi saat AI mengalir,
  **digulir ke layar setelah selesai** (`scrollIntoView`); edit kolom/teks mentah
  langsung memperbarui lembar; buka draf arsip juga merender lembar + scroll.
- Prompt AI diubah (src/templates.ts `buildLetterPrompt`): AI hanya menulis
  **tubuh surat** (salam pembuka, isi, penutup) — kop/nomor/tanggal/perihal/
  alamat/Tembusan/tanda tangan JANGAN ditulis (sudah dirender aplikasi).
  `stripLeadingLetterMeta` membuang baris kop/meta di awal teks lama (draf arsip),
  `splitTembusan` memisah bagian Tembusan dari teks AI; kolom Tembusan menang
  bila diisi.
- Kolom baru **Tembusan (opsional)** di template Surat Dinas + Undangan (textarea,
  satu per baris). Field undangan: 7 → 8.
- i18n baru: `letterSheetCaption` ("Hasil draf — format surat resmi"),
  `letterRawToggle` ("Teks draf — bisa diedit").
- Perihal dihitung dari: perihal → tentang → `Undangan <acara>` → `Keterangan
  <jenis>` → keperluan → nama template. Baris "Kepada Yth." hanya bila template
  punya kolom tujuan.
- Print TIDAK diubah (area print teks polos tetap jalan) — opsi lanjut: print
  memakai lembar yang sama.
- Kop memakai logo.png aplikasi (sama seperti pratinjau arsip Paket 15) — logo
  Garuda/kabupaten resmi belum ada di pengaturan kop; tidak dikarang.
- Screenshot: `show-20261127/desaai-p29-letter-sheet.png`.

## D. Tes

- Build: OK. Headless: **323/323** (5 cek baru 9e: judul 24px + subjudul muted;
  mode gelap bg gelap + tombol terlihat — perbaikan tes: baca gaya 300ms setelah
  ganti tema karena `.btn` mentransisikan background 0.15s, baca sinkron
  menangkap awal transisi; caption dibaca via `.letter-sheet-caption` bukan
  getElementById — elemennya hanya punya class; PWA: **16/16**;
  check:secrets bersih.
- Pelajaran tes: (1) computed style DURING a CSS transition = nilai interpolasi
  saat itu, bukan nilai akhir — beri jeda > durasi transisi sebelum assert;
  (2) hash deep-link tab surat adalah `#surat`, bukan `#letters` (repro awal
  salah tab karena ini).

## E. Status deploy

- Commit main: (isi setelah commit).
- Deploy gh-pages: MENUNGGU Gas Bos (pola Paket 28). Build `dist/` siap; jalurnya
  fresh-clone gh-pages seperti Paket 28.
