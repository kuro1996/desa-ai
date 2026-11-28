# Paket 32.1 — Anin menjawab pertanyaan administrasi umum di luar aplikasi

Tanggal: 28 November 2026.
Pemicu: tangkapan layar Bos 28 Nov ~08:55 WIB di situs live (Paket 32) — Anin
ditanya "Kalau ada pengaduan bisa selesaikan" dan menjawab "Maaf saya belum
paham pertanyaan itu" + daftar kemampuan saja.
Commit kode: `bc083b5` (di atas `81309c5` Paket 32.2).
**TIDAK di-deploy ke gh-pages — menunggu Gas Bos.**

## Ringkasan

Anin tidak lagi hanya menjawab cara memakai aplikasi. Ia kini menjawab
pertanyaan administrasi kecamatan secara umum (layanan, pengaduan, alur
surat, dasar hukum), berpijak pada alur/data nyata aplikasi atau pengetahuan
umum yang sudah terkenal — dan tidak pernah mengarang tarif, nomor
peraturan daerah, nama/NIP pejabat, atau jam layanan.

## Kasus screenshot — sebelum / sesudah

**Sebelum (live Paket 32, 28 Nov 08:55):**

> "Maaf saya belum paham pertanyaan itu" + daftar kemampuan Anin.

**Sesudah (build ini, terverifikasi headless + screenshot 390px):**

> "Bisa. Pengaduan ditindaklanjuti petugas dengan alur status Baru →
> Diproses → Selesai. Buka tab Pengaduan untuk melihat daftarnya dan
> memantau status tiap pengaduan — petugas mengubah status lewat menu
> status di tiap pengaduan. Saat membuat pengaduan, isi jenis dan isi
> pengaduan yang jelas (apa masalahnya, kapan terjadi) supaya petugas
> bisa menindaklanjuti; nama dan kontak boleh dikosongkan (anonim).
> Saya sendiri tidak bisa menyelesaikan pengaduan — yang menyelesaikan
> adalah petugas kantor — tapi saya bisa menunjukkan trennya, misalnya
> tanya 'Keluhan terbanyak bulan ini?'. Soal berapa lama selesai,
> tidak ada batas waktu baku di aplikasi ini — tanyakan perkiraannya
> ke petugas."

Alur status Baru → Diproses → Selesai adalah alur nyata aplikasi
(`src/agenda.ts`, kunci i18n `aduStatusDiproses`). Varian pertanyaan yang
juga dijawab: "pengaduan saya gimana", "cara menyelesaikan pengaduan",
"Bagaimana cara lapor pengaduan?".

## Yang berubah (file)

- `src/kb.ts` — panduan prosedur 10 → **16 entri** (+6):
  `pengaduan-warga` (alur + status + data yang dibutuhkan),
  `surat-masuk-keluar` (agenda + disposisi),
  `jam-layanan` (jujur: jam tidak tercantum di aplikasi — konfirmasi ke
  kantor, jangan mengarang),
  `dasar-hukum` (hanya UU yang umum dan terkenal: UU No. 25 Tahun 2009
  tentang Pelayanan Publik, UU No. 30 Tahun 2014 tentang Administrasi
  Pemerintahan; perda/perbup spesifik diarahkan konfirmasi ke kantor),
  `ktp-hilang` (surat kehilangan polisi + KK asli),
  `belum-menikah` (KTP + KK + pengantar RT/RW).
- `src/anin-kb.ts` — app-KB 26 → **27 entri** (+1 `pengaduan-selesai`,
  jawaban kasus screenshot di atas). Total pengetahuan offline: 43 entri.
- `src/anin-chat.ts` — `suggestClosestTopics()` (near-miss tingkat kata +
  stopwords; omong kosong murni seperti "zxqv kltp 123" tidak memicu saran).
- `src/i18n.ts` — `aninFaqAduanSelesai`, `aninChatMaybeMeant`
  ("Mungkin yang Anda maksud: …").
- `src/main.ts` — `noUnderstandReply()` dipasang di KEDUA jalur no-match
  Anin (offline + AI gagal): jawaban "belum paham" selalu menyebut topik
  terdekat + chip saran, tidak pernah jalan buntu.
- `src/kb.ts` `matchKb()` — ambang skor minimal 2 (bonus +1 kata pertama
  judul tidak boleh cocok sendirian) + kata kunci pendek (KK/KTP/SK)
  dihitung +2 bila cocok sebagai KATA UTUH (batas kata), bukan substring.
- `scripts/headless-test.mjs` — 11 cek baru Paket 32.1 (kasus screenshot
  persis + 2 varian + lapor pengaduan + domisili + jam layanan + dasar
  hukum + KTP hilang + disposisi + near-miss + gibberish tanpa saran).
- `scripts/screenshot-p321.mjs` — baru (viewport 390px, pertanyaan persis
  screenshot Bos).

Lapisan jawaban tetap utuh: cloud dulu bila tersedia → offline KB →
panduan prosedur. Tanya Prosedur tetap diambil alih Anin (Paket 32) dan
draf surat offline Paket 30 tidak disentuh.

## Verifikasi

- `npm run build` — lolos (bundle baru `index-B_VOgDAc.js`).
- Headless `node scripts/headless-test.mjs` — **374/374 cek lolos**
  (total naik dari 359 di Paket 32: +11 cek 32.1 +4 cek Paket 33).
  Riwayat run: 367/370 → 368/374 → 373/374 → **374/374**.
- `npm run test:pwa` — **16/16**.
- `npm run check:secrets` — **bersih**.
- Screenshot `show-20261127/desaai-p321-chat-pengaduan-mobile.png`
  (390px, terang) — dicek visual: panel Anin rapi, jawaban menampilkan
  alur Baru → Diproses → Selesai, chip saran + tombol Bacakan tampil,
  tidak ada overlap.

## Bug yang ditemukan saat verifikasi (dan diperbaiki)

1. **Regresi Tanya KK — BUG APLIKASI** (dari perubahan ambang `matchKb`
   saya sendiri). "Bagaimana cara mengurus KK baru?" hanya bernilai 1
   (keyword "kk" +1; kata pertama judul KK adalah "Kartu", bukan "KK")
   sehingga lolos dari ambang 2 dan Tanya menjawab "tidak menemukan
   panduan". Perbaikan: kata kunci pendek (≤3 huruf) cocok sebagai kata
   utuh = +2. Diverifikasi langsung lewat Node untuk 12 pertanyaan kunci
   ("surat saya kapan selesai" tetap 0 cocok → jalur near-miss).
2. **Tes panduan offline — BUG TES.** Ekspektasi `kbItems === 10` tidak
   diperbarui saat KB tumbuh jadi 16. Diperbaiki jadi 16.
3. **Tes jam layanan — BUG TES.** Regex `/konfirmasi/` case-sensitive
   sedangkan jawaban menulis "Konfirmasi" di awal kalimat. Diperbaiki
   jadi `/konfirmasi/i`.
4. **Tes WhatsApp Paket 33 — BUG HARNESS TES.** Tiga cek gagal karena
   mengharapkan teks Indonesia, sedangkan bagian 2 suite jalan dalam
   bahasa default aplikasi (Inggris; Anin baru beralih ke Indonesia di
   bagian 9c). Mekanismenya sendiri bekerja (wa.me terbuka, teks
   tersalin 9.000 karakter). Diperbaiki: cek terima EN/ID.
5. **Tes kepegawaian flaky — DIKETAHUI, bukan regresi.** "kepegawaian
   summary renders an offline recap without AI" gagal sekali (373/374)
   lalu lolos di run ulangan (374/374). Sudah flaky sejak sebelum
   Paket 12: jalur gagal-AI di VM ini kadang lebih lambat dari tunggu
   30 detik. Tidak diubah — dicatat di sini.

## Catatan Paket 33 (transparansi)

Implementasi Paket 33 (tombol "Kirim ke WhatsApp" di `index.html`,
`shareLetterViaWhatsApp` + handler arsip di `src/main.ts`, kunci i18n
`wa*` + `sendWhatsApp`, entri app-KB `kirim-wa`, 4 cek headless,
`scripts/screenshot-p33.mjs`) **sudah ada di working tree** saat sesi ini
dilanjutkan, dan ikut ter-commit di `bc083b5` karena menyatu di file yang
sama dengan perubahan 32.1. Paket 33 BUKAN bagian laporan ini: masih butuh
`PAKET-33-LAPORAN.md` + verifikasi mandiri + Gas Bos sebelum deploy.
Empat cek headless Paket 33 lolos di run terakhir (374/374).

## Yang masih belum bisa dijawab offline (butuh cloud)

- Pertanyaan terbuka/bernuanasa di luar 43 entri KB offline → Anin memberi
  topik terdekat + chip saran, bukan jawaban penuh. Jawaban AI yang
  bernuansa tetap butuh Firebase AI Logic (cloud).
- Status cloud: Paket 32.2 (`81309c5`, parent) melepas
  `useLimitedUseAppCheckTokens` karena App Check memblokir panggilan AI
  cloud; diagnosis Node CLOUD_OK. Bila cloud hidup, badge Tanya di HP Bos
  menunjukkan "Cloud" — itu bukti yang ditunggu.
- Yang TIDAK akan dijawab Anin (by design): menyelesaikan pengaduan
  sendiri, mengarang jam layanan / tarif / nomor perda-perbup / nama dan
  NIP pejabat — selalu diarahkan konfirmasi ke kantor.

## Deploy

Tidak di-deploy ke gh-pages. Setelah Bos memberi Gas, deploy mengikuti
jalur Paket 32 (fresh single-branch clone gh-pages → copy `dist/*` →
`git status` bersih dari node_modules/src → commit → push → verifikasi
`ls-remote`).
