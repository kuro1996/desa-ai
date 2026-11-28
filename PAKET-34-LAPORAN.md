# Paket 34 — Laporan Konsolidasi: Ide 1–9 (SELESAI dibangun, belum deploy)

Perintah Bos 28 Nov 00:09 WIB: ide 1–9 masuk semua kalau bisa, ide 10 (kiosk
loket) ditunda. Semua gratis, dalam aplikasi, tanpa server/backend baru, tanpa
biaya. **Belum deploy — menunggu Gas Bos.**

Dikerjakan per kelompok di cabang terpisah, lalu digabung ke main dalam SATU
commit (`Paket 34: gabung Ide 1-3 + 7-9`):

- **Ide 4–6** sudah di main lebih dulu (commit `2815425`): QR verifikasi surat,
  lapor warga + lacak tiket, dashboard pagi Camat.
- **Ide 1–3** dari cabang `p34-a` (commit `0fee1e9`).
- **Ide 7–9** dari cabang `p34-c` (commit `6e2dab0`).
- Detail per kelompok tetap ada di laporan cabang: `PAKET-34-C-LAPORAN.md`
  (detail Ide 7–9 + tabel frasa Bangka).

## Yang dibangun

### Ide 1 — Anin belajar dari arsip (`src/anin-arsip.ts`, baru)
- Anin membaca draf surat lokal (arsip Firestore hanya bila sudah dimuat
  aplikasi — tidak ada query Firebase baru).
- **Nomor surat berikutnya:** Anin mem-parsing nomor arsip
  (`140/012/DS/XI/2026`, `470/45/Kec-Simp/XI/2026`, `188.4/05/DS/2026`),
  mengelompokkan per pola, lalu menyarankan urutan max + 1 dengan lebar nol
  yang sama (013 → 014). Tanggal biasa (`20/11/2026`) tidak dikira nomor surat.
  Perintah: "nomor surat berikutnya", "template surat undangan dari arsip".
- **Template yang pernah dipakai:** untuk jenis surat yang diminta, Anin
  menyebut format arsip terakhir (nomor terakhir + judul draf + jumlah surat
  sejenis). Jenis ditebak dari judul draf atau kata kunci isi.
- **Tombol di tab Arsip & Draf** ("Nomor & template dari arsip"): menampilkan
  saran yang sama + tombol "Pakai nomor ini" yang mengisi kolom nomor di
  formulir Draf Surat.
- **Jujur bila kosong:** arsip kosong → "Belum ada arsip surat…"; jenis belum
  pernah diarsipkan → Anin bilang begitu dan memakai pola umum arsip; arsip
  ada tapi tak ada nomor berpola → "tidak ada nomor surat yang polanya bisa
  dibaca". Tidak pernah mengarang nomor/template.

### Ide 2 — Anin pemeriksa surat (`src/anin-periksa.ts`, baru)
- Cek draf terhadap format resmi dengan aturan lokal (tanpa AI, tanpa server):
  kop surat terisi/tidak (dari pengaturan kop petugas), pola nomor surat,
  format tanggal (Indonesia `28 November 2026` atau ISO), perihal/tentang/
  acara terisi, tujuan terisi (peringatan), isi kosong, EYD dasar — huruf
  besar awal kalimat/setelah titik, spasi ganda, kata yang sering salah dan
  hanya yang yakin (dimana→di mana, diatas→di atas, dibawah, didalam, diluar,
  diantara, disini, disana, kesana, kesini, kemana, darimana, terimakasih,
  tanggungjawab, kerjasama).
- UI: tombol **"Periksa draf"** di lembar draf surat + perintah Anin "periksa
  surat ini" (membuka tab Draf Surat dan menampilkan panel hasil). Tiap temuan
  punya tombol **"Terapkan"** sendiri; perbaikan diterapkan hanya bila petugas
  menekannya — draf tidak pernah diubah diam-diam. Tanpa draf, Anin menjawab
  jujur "Belum ada draf yang bisa diperiksa".

### Ide 3 — Anin pengingat (`src/anin-pengingat.ts`, baru)
- Dihitung dari data aplikasi (lokal): agenda (Buku Agenda) yang belum selesai
  — besok, ≤3 hari lagi, atau sudah lewat tanggal; pengaduan status
  Baru/Diproses yang belum ditindaklanjuti lebih dari 3 hari.
- Tampil di **kartu "Pengingat" di panel Anin** (diperbarui tiap panel dibuka),
  **widget "Pengingat hari ini" di Beranda** (dengan badge jumlah), dan
  perintah Anin "ada pengingat apa hari ini" (plus chip saran baru). Ketuk item
  pengingat → membuka tab Agenda/Pengaduan yang bersangkutan.
- Semua angka dari data nyata; bila tidak ada, tampil "tidak ada pengingat".
- Pengingat agenda memakai `tanggal` surat sebagai tanggal acuannya (Buku
  Agenda tidak punya kolom tenggat terpisah).

### Ide 4 — Verifikasi surat via QR (sudah di main, commit 2815425)
- Kode QR verifikasi untuk surat arsip; halaman verifikasi publik
  (`?verifikasi=<id>&c=<checksum>`) yang hanya menampilkan halaman verifikasi.

### Ide 5 — Lapor warga + lacak tiket (sudah di main, commit 2815425)
- Alur lapor terpandu Anin ("saya mau lapor", "laporkan masalah",
  "buat pengaduan baru") + pelacakan status tiket Baru → Diproses → Selesai.

### Ide 6 — Dashboard pagi Camat (sudah di main, commit 2815425)
- Ringkasan pagi untuk Camat di Beranda.

### Ide 7 — Ringkasan rapat otomatis / Notulen Rapat (`src/notulen.ts`, baru)
- Panel **"Notulen Rapat — dari catatan rapat"** di tab **Ringkasan**, di bawah
  kartu peringkas dokumen. Tempel catatan rapat → **Buat notulen** → notulen
  terstruktur: Tanggal, Peserta, Agenda, Keputusan, Tindak Lanjut (+
  penanggung jawab bila disebut, mis. `PJ: Budi Santoso`).
- Parser murni offline, rule-based, tanpa AI: **tidak pernah mengarang** —
  bagian yang tidak ada di catatan tampil "—"; nama/tanggal hanya diambil bila
  tertulis jelas. Tombol **Buat surat tindak lanjut** mengisi formulir Surat
  Dinas (perihal "Tindak Lanjut Hasil Rapat tanggal …" + isi keputusan/
  tindak lanjut/peserta) lalu pindah ke tab Surat.
- **Audio (transkripsi) — KENDALA, dilaporkan jujur:** deteksi dipakai sama
  seperti mikrofon Anin (`SpeechRecognition ?? webkitSpeechRecognition`). Di
  headless Chrome VM ini konstruktornya ADA, tombol dikte tampil, dan klik
  dikte tidak crash. **TAPI transkripsi live TIDAK terbukti di VM ini:** klik
  dikte berakhir dalam <3 detik tanpa transkrip (tidak ada mikrofon; layanan
  speech Google tidak terjangkau — tunnel VM diblokir). Pesan error-nya kini
  dipertahankan di status (sebelumnya terhapus oleh `onend` — diperbaiki).
  Bila peramban TIDAK mendukung SpeechRecognition (mis. Firefox/Safari),
  tombol dikte **disembunyikan** dan tampil pesan jujur: *"Peramban ini tidak
  mendukung transkripsi audio — tempel teks rapat di kolom di atas."* Jalur
  teks (tempel → notulen) jalan penuh tanpa audio — teruji 21/21.
- **Butuh Bos:** coba dikte di HP/Chrome Bos (mikrofon + jaringan normal)
  untuk membuktikan transkripsi live; di VM ini tidak bisa dibuktikan.

### Ide 8 — Anin Bahasa Bangka (`src/bahasa-bangka.ts`, baru)
- Sakelar **"Jawab dalam Bahasa Bangka"** di kepala panel Anin, tersimpan di
  `localStorage` (`desaai-bangka-v1`, bertahan setelah reload — teruji).
- Sakelar aktif: sapaan Anin + jawaban prosedur **KTP, KK, surat pengantar,
  pengaduan** dalam Bahasa Bangka. Topik lain dijawab Bahasa Indonesia +
  catatan jujur *"Anin jawab pakai Bahasa Indonesia dulu — jawaban Bahasa
  Bangka untuk ini lom ade."* Jalur AI (cloud/on-device) juga diberi panduan
  kata Bangka yang sama supaya AI tidak mengarang kosakata.
- Istilah administrasi (KTP, KK, Disdukcapil, RT/RW) tetap Bahasa Indonesia —
  di Bangka memang dipakai apa adanya.

#### Daftar frasa Bangka yang dipakai + keyakinan (UNTUK DIVERIFIKASI BOS)

Sumber verifikasi: Kamus Bahasa Bangka Belitung (Scribd), Wikipedia Bahasa
Bangka, Kamus Indonesia–Melayu Bangka (Kantor Bahasa Prov. Kep. Bangka
Belitung), rubrik Bahasa Bangka Pangkal Pinang (SMP Budi Mulia), Kamus
Bangka–Indonesia (Buspy). Detail sumber per kata ada di `src/bahasa-bangka.ts`
(`BANGKA_PHRASES`).

| Bangka | Indonesia | Keyakinan |
|---|---|---|
| aok / auk | iya | YAKIN |
| ape | apa | YAKIN |
| apetah | mengapa | YAKIN |
| pacak | bisa | YAKIN |
| dak | tidak | YAKIN |
| ku | saya / aku | YAKIN |
| ikak | kamu / kalian | YAKIN |
| ka | kamu | CUKUP YAKIN |
| kelak | nanti | YAKIN |
| agik | lagi / masih | YAKIN |
| sikok | satu | YAKIN |
| bai | cuma / hanya | YAKIN |
| bi | saja | CUKUP YAKIN |
| lah | sudah | YAKIN |
| lom | belum | CUKUP YAKIN |
| ade | ada | YAKIN |
| asak | kalau / asalkan | CUKUP YAKIN |
| aek | air | YAKIN |
| mintak | minta | YAKIN |
| cemane | bagaimana | YAKIN |
| sape | siapa | YAKIN |
| saro | sulit / susah | YAKIN |
| kawa | mau | CUKUP YAKIN |
| bise | dapat / mampu | CUKUP YAKIN |
| urang | orang | YAKIN |
| umah | rumah | YAKIN |
| gey | pergi | CUKUP YAKIN |
| terima kaseh | terima kasih | CUKUP YAKIN |
| selamat pagi/siang/sore/malam | sama (sapaan Melayu baku) | YAKIN |
| di mane | di mana | CUKUP YAKIN |
| akhiran -e | -nya | YAKIN |

**Sengaja TIDAK dipakai** (tidak terverifikasi — jangan dipakai sebelum Bos
mengonfirmasi): `lum` (bentuk benar "belum" adalah `lom`), `ngape`
("mengapa" yang terverifikasi adalah `apetah`), `tulung` (tidak ditemukan),
`kite` (tidak ditemukan), `nek` (makna ambigu di contoh kalimat).
Catatan dialek: Bangka punya beberapa dialek (Belinyu akhiran -o, Toboali
akhiran -e dan s→h, Pangkal Pinang e keras); frasa di sini memakai bentuk
netral/Pangkal Pinang yang paling umum — **mohon Bos koreksi bila ada kata
yang kurang tepat untuk Simpangkatis**.

### Ide 9 — Mode Darurat (`src/cepat.ts`, `src/templates.ts`)
- Blok **"Mode Darurat — surat bencana, satu ketuk"** di area Surat Cepat
  (tab Surat), aksen merah tipis supaya langsung dikenali; 8 tombol:
  **Banjir, Kebakaran, Tanah Longsor, Gempa Bumi × Laporan Kejadian /
  Permohonan Bantuan**.
- Satu ketuk mengisi formulir dengan kerangka itu (jenis bencana terisi);
  petugas melengkapi lokasi, waktu, korban/kerusakan lalu **Buat draf**
  seperti biasa (jalur offline ikut bekerja — draf darurat teruji menyebut
  jenis bencana + lokasi).
- Template baru (2): `darurat-laporan` (Surat Laporan Kejadian Darurat) dan
  `darurat-bantuan` (Surat Permohonan Bantuan Darurat) — total template kini
  9. **Template lama tidak diubah** (7 template lama utuh — teruji).
- Perintah Anin: **"surat darurat banjir"** (tanpa kata kerja "buat") → tab
  Surat + template Laporan Darurat + jenis Banjir. `parseDarurat`
  mengembalikan null bila tidak ada jenis bencana yang jelas (tidak ditebak).
- Perintah Anin dengan kata kerja juga jalan via Surat Cepat biasa
  ("buatkan surat permohonan bantuan darurat banjir" → darurat-bantuan).

## File yang diubah/dibuat (gabungan)

- Baru: `src/anin-arsip.ts`, `src/anin-periksa.ts`, `src/anin-pengingat.ts`,
  `src/notulen.ts`, `src/bahasa-bangka.ts`, `scripts/headless-p34-a.mjs`,
  `scripts/headless-p34-c.mjs`, `scripts/screenshot-p34-a.mjs`,
  `scripts/screenshot-p34-c.mjs`, `PAKET-34-C-LAPORAN.md`,
  `screenshots/p34a-*.png` (8), `screenshots/p34c-*.png` (6).
- Diubah: `src/anin-chat.ts` (intent `archive`/`check`/`reminders`/`lapor`/
  darurat), `src/main.ts`, `src/i18n.ts` (714 kunci, tanpa duplikat),
  `src/anin-kb.ts`, `src/cepat.ts`, `src/templates.ts`, `index.html`,
  `src/styles.css`, `scripts/headless-test.mjs` (penyesuaian ekspektasi,
  lihat bawah).
- Tidak disentuh: `gh-pages`, file rencana lain.

## Catatan merge (cabang → main)

Basis kedua cabang: `ff8a6a4`. Main saat merge: `bff9d90` (Paket 37–40 sudah
masuk). Konflik diselesaikan dengan mempertahankan KEDUA sisi — tidak ada
fitur Paket 34 maupun Paket 37–40 yang dibuang:

### Merge p34-a → main (3 konflik)
- `src/anin-chat.ts`: aturan `lapor` (Ide 5, sudah di main) + aturan
  `archive`/`check`/`reminders` (Ide 1–3) digabung; urutan: navigasi (1),
  darurat (1b, dari p34-c), arsip/periksa/pengingat (2), perintah surat (3),
  lapor (4), analis (5), appkb (6), panduan prosedur (7).
- `src/main.ts` (2 titik): `ANIN_CHIP_KEYS` — `aninChipLapor` + chip
  `p34ReminderChip` sama-sama dipertahankan; handler intent — handler
  `lapor` + handler `archive`/`check`/`reminders` sama-sama dipertahankan.
- `src/styles.css`: blok Ide 4/5/6 (main) + blok Ide 1/2/3 (cabang)
  sama-sama dipertahankan. **Jebakan merge:** kurung kurawal penutup aturan
  `.adu-timeline li span` "dimakan" git sebagai baris bersama — ditambahkan
  kembali (build sempat gagal `Unclosed block`, lalu lolos).

### Merge p34-c → main (2 konflik)
- `src/anin-chat.ts`: cek darurat (1b) + arsip/periksa/pengingat (2)
  digabung sebelum perintah surat (3).
- `src/main.ts` (impor): impor `anin-arsip`/`anin-periksa`/`anin-pengingat`
  (Ide 1–3) + impor `cepat` (dengan `DARURAT_JENIS`, `daruratCepatResult`),
  `notulen`, `bahasa-bangka` (Ide 7–9) digabung; impor `cepat` yang ganda
  disatukan jadi satu baris.
- `src/styles.css` auto-merge bersih (kurung kurawal seimbang 652/652);
  blok Ide 8/9 (baris ~2668/2711) + blok Ide 4/5/6 + blok Ide 1/2/3
  semuanya ada.

### Dua perbaikan nyata yang ditemukan saat merge
1. **Kartu Pengingat belum punya tombol lipat (Paket 38).** Widget Beranda
   Ide 3 dibuat sebelum Paket 38, jadi tidak punya `data-card` dan
   `initHomeCollapse()` melewatinya — suite koordinator gagal 412/413
   ("13 of 14"). Perbaikan: `data-card="reminder"` di `index.html`
   (judul + badge jumlah sudah memakai `.bento-label`, jadi tetap terlihat
   saat terlipat sesuai aturan Paket 38). Beranda kini 15 kartu, 14 di
   antaranya punya tombol lipat (IKM Trend tetap tanpa tombol).
2. **Bug bahasa nyata: `applyLang()` berjalan telat di `boot()`.**
   `applyLang()` hanya dipanggil di AKHIR boot, setelah `await
   initFirebase()` + `await probeOnDevice()` — di VM ini probe Firebase
   menggantung (tunnel diblokir), jadi UI berbulan-bulan berbahasa Inggris
   (HTML statis) padahal `lang` sudah "id" dari localStorage. Akibatnya
   tombol bahasa bekerja TERBALIK setelah reload (klik "Bahasa Indonesia"
   justru mengubah id→en, dibuktikan probe headless), dan label yang
   dirender JS (mis. tombol Mode Darurat) tidak sejalan dengan label statis
   — inilah yang membuat tes p34-c gagal 19/21. Perbaikan: `applyLang()`
   dipanggil AWAL di `boot()`, tepat sebelum `initFirebase()` (idempotent;
   panggilan akhir tetap jalan untuk chip Firebase/perangkat). Setelah
   perbaikan, bahasa tersimpan langsung diterapkan setelah reload dan tes
   p34-c kembali 21/21. Catatan lama tentang ini ("fix = jalankan
   applyLang() lebih awal di boot()") kini sudah dikerjakan.

### Penyesuaian ekspektasi `scripts/headless-test.mjs`
- Kartu Beranda 14 → **15** (widget Pengingat Ide 3) + `home-reminder-card`
  masuk daftar harapan.
- Tombol lipat "13 of 14" → **"14 of 15"**.
- Adoption pack: template 7 → **9** (2 template darurat Ide 9).
- Header biru form: 6 → **7** (panel Notulen Rapat Ide 7).
- Tombol ekspor CSV kepegawaian: label yang diharapkan "Ekspor CSV" →
  **"Export CSV"** — bahasa aktif di titik itu adalah Inggris (suite beralih
  ke Indonesia lalu kembali ke Inggris); dulu label statis HTML menutupi
  ini karena `applyLang()` telat; setelah perbaikan applyLang-awal, label
  mengikuti bahasa aktif sejak awal.

## Verifikasi (setelah gabung, di main)

- `npm run build` — lolos (tsc + vite).
- `node scripts/headless-p34-a.mjs` — **16/16 lolos** (widget pengingat
  Beranda; kartu pengingat panel Anin; jawaban pengingat/arsip/periksa Anin;
  "Periksa draf" menandai 6 temuan lalu "Terapkan" per item; "Pakai nomor
  ini" mengisi 140/014/DS/XI/2026; arsip kosong → "Belum ada arsip";
  0 console error, 0 failed request di luar noise lingkungan).
- `node scripts/headless-p34-c.mjs` — **21/21 lolos** (jalur teks notulen
  penuh; sakelar Bangka + persistensi; 8 tombol darurat + satu ketuk +
  perintah Anin + draf darurat offline; 0 console error, 0 failed request
  di luar noise).
- `npm run test:headless` (suite koordinator) — **413/413 lolos**.
- `npm run test:pwa` — **16/16 lolos**.
- `npm run check:secrets` — bersih.
- `src/i18n.ts`: 714 kunci, **tanpa duplikat** (dicek setelah auto-merge).
- Screenshot 390px terang+gelap: `screenshots/p34a-*.png` (8),
  `screenshots/p34c-*.png` (6) — dicek visual, teks hitam terbaca di kedua
  tema.

## Yang masih butuh Bos

- **Gas untuk deploy** ke gh-pages (seperti biasa — tidak di-deploy di paket
  ini).
- **Verifikasi frasa Bahasa Bangka** — terutama yang keyakinannya "cukup
  yakin": ka, bi, lom, asak, kawa, bise, gey, terima kaseh, di mane. Bila ada
  yang kurang tepat untuk Simpangkatis, kabari supaya diperbaiki.
- **Uji dikte suara** notulen rapat dari HP Bos (mikrofon + jaringan normal)
  — di VM ini transkripsi live tidak bisa dibuktikan.
- Bila pola nomor surat kecamatan ternyata berbeda dari pola arsip yang dibaca
  Anin (mis. urutan bukan segmen kedua), kabari polanya supaya parser
  disesuaikan.
