# Devpost Update Pack — DesaAI (project 1305863)
Disiapkan 2026-11-21 (Paket 6). **Bos yang edit + submit sendiri** di
https://devpost.com/software/desaai — batas edit **1 Des 2026 05:00 WIB**.
Live: https://kuro1996.github.io/desa-ai/ — Repo: https://github.com/kuro1996/desa-ai

## 1. Deskripsi proyek — versi baru (tempel ke kolom Description)

**DesaAI — offline-first AI clerk for Indonesian village & subdistrict offices.**

Village offices run on paper, WhatsApp, and memory. DesaAI is a single-page
web app that drafts formal official letters, summarizes long documents, and
answers procedure questions — with **Firebase AI Logic hybrid inference**:
short, private prompts run **on-device (Gemini Nano 4)** when available, and
long or complex prompts fall back to **cloud Gemini**. Every answer shows a
visible routing badge ("On-device • private" vs "Cloud") and the reason it
routed that way, so staff always know where their data went.

**What it does (9 tabs):**
- **Draft Letters** — 7 templates (Surat Dinas, SK, Undangan, Pengantar,
  Surat Keterangan, **SKTM — Surat Keterangan Tidak Mampu**, SK Pengangkatan
  Perangkat Desa), automatic per-template letter numbering, editable drafts,
  print-ready formal layout, letter archive.
- **Summarize** — paste minutes, regulations, or reports; get a concise
  summary (long inputs route to cloud automatically).
- **Procedure Q&A** — KTP, KK, domisili, SKTM, birth/death certificates,
  moving, business certificates — grounded in a built-in knowledge base
  that works fully offline, with tickable document checklists.
- **Personnel / Kepegawaian (SIAP AKAD)** — staff of the Simpangkatis
  subdistrict office and village officers of its 10 villages; automatic
  term-of-office status (Aktif / Akan habis / Habis), expiry notifications,
  per-village cards, 6 village institutions, "Buat SK" prefills the
  appointment decree from any record.
- **IKM — community satisfaction survey** (PermenPAN-RB 14/2017, 9 elements,
  score = mean × 25, categories A–D) with a shareable link + locally
  generated QR code for the service counter, CSV export, and a cumulative
  trend chart.
- **Pengaduan (Complaints)** — anonymous reporting, Baru → Diproses →
  Selesai tracking, status/type filters, detail dialog, CSV export.
- **Home dashboard** — bento grid: live IKM, letters today, **oldest
  unresolved complaints with waiting time**, expiring terms, monthly
  totals, IKM trend, and a **printable monthly report** (now with a
  "Perlu perhatian" action section).
- **My Drafts** — local library + JSON backup of all data.

**Built for real offices:** bilingual UI (English/Indonesian), dark mode,
deep links per tab (`#ikm` for the survey), global search, mobile-first,
no external fonts or CDNs (only Firebase). Sample data is clearly labelled
"Data Contoh — bukan data asli" in every module. AI drafts must be reviewed
by a human officer before use.

**Tech:** Vite + TypeScript, Firebase AI Logic (Gemini Nano 4 on-device +
Gemini cloud fallback), Firestore mirror (best-effort), localStorage-first
so the office keeps working offline. 199 automated checks on every build
(183 headless-Chrome + 16 PWA; 1 known flaky check, see §4).

## 2. Yang baru sejak submit (untuk kolom "What's new" / pembaruan deskripsi)

- **Rebuild (20 Nov):** digabung dengan SIAP AKAD — administrasi
  kepegawaian 10 desa + administrasi surat + status pegawai otomatis.
- **Paket 2–3:** link + QR survei IKM, logo Simpangkatis, ikon tiap menu.
- **Paket 4:** hero foto kantor, polish elegan, upgrade fitur.
- **Paket 5:** beranda bento, mode gelap, pencarian global, laporan bulanan
  (cetak), tren IKM.
- **Paket 6 (21 Nov):** daftar pengaduan belum selesai di Beranda (dengan
  lama menunggu), ekspor CSV pengaduan, template SKTM baru, seksi "Perlu
  perhatian" di laporan bulanan cetak, theme-color mobile. Tes headless
  125 → 130 cek, semua hijau.
- **Paket 7 (21 Nov sore):** command palette (Ctrl+K) — lompat ke menu/aksi
  apa pun dari keyboard; **Mode Warga** — tampilan sederhana untuk warga
  (hanya Survei IKM, Pengaduan, Tanya Prosedur; menu petugas disembunyikan);
  grafik batang pengaduan per jenis di Beranda; **database Firestore
  (default) dibuat di Jakarta (asia-southeast2) dengan aturan terkunci
  per pengguna** — cermin Firestore kini aktif. Tes headless 130 → 137
  cek, semua hijau.
- **Paket 8 (21 Nov sore):** sinkronisasi Firestore otomatis saat aplikasi
  dibuka (IKM + pengaduan + kepegawaian) — data lokal yang tersimpan saat
  Auth belum aktif terunggah sendiri saat reload. **Auth Anonymous
  dinyalakan 21 Nov 17:57 WIB** (sebelumnya belum pernah disetup — itulah
  penyebab survei pertama Bos tidak masuk database). Tes headless 137 cek,
  semua hijau.
- **Paket 9 (21 Nov sore):** indikator status sinkronisasi di header —
  chip Firebase menampilkan jam sinkron terakhir ("Firebase: terhubung ·
  Tersinkron 18:26") atau "Belum tersinkron". **Tulisan pertama Bos
  TERVERIFIKASI masuk Firestore 21 Nov 18:27 WIB** (users/{uid}/ikm/rekap:
  14 item — 12 demo + 2 jawaban Bos; updatedAt 18:26:08 WIB). Tes
  headless 138 cek, semua hijau.
- **Paket 10 (23 Nov pagi): Briefing Pagi** — kartu ringkasan harian di
  Beranda: tanggal hari ini, ringkasan (pengaduan baru, masa bhakti
  habis, skor IKM, surat hari ini), 3 fokus hari ini (pengaduan tertua,
  masa bhakti terdekat, unsur IKM terendah — klik fokus membuka tab
  terkait), ringkasan memerah bila ada yang mendesak, dan tombol
  **Salin briefing** yang menyalin teks WhatsApp siap tempel untuk grup
  staf/Camat (disembunyikan di Mode Warga). Tes headless 138 → **142
  cek, semua hijau**.
- **Paket 11 (23 Nov siang): Buku Agenda Surat** — tab ke-9, register
  surat masuk/keluar lengkap: nomor agenda otomatis (001/AGS/2026…),
  nomor surat, pengirim/tujuan, perihal, tanggal, disposisi (Camat,
  Sekretaris, Kasi, Arsip), status (baru/diproses/selesai), statistik
  (masuk/keluar/belum ditindaklanjuti), filter arah + status, ekspor
  CSV, dan pencarian global menemukannya. Jumlah surat masuk hari ini
  juga masuk ke ringkasan Briefing Pagi. Disembunyikan di Mode Warga.
  Bonus: ringkasan kepegawaian kini **fail-soft** — bila AI gagal,
  rekap offline tetap tampil, bukan panel kosong (memperbaiki cek
  headless yang flaky). Tes headless 142 → **152 cek, semua hijau**.
- **Paket 12 (23 Nov siang): PWA offline (offline-first)** — aplikasi
  kini bisa diinstal (Add to Home Screen) dan dibuka tanpa internet:
  manifest + service worker; shell (index.html) selalu diambil dari
  jaringan saat online (network-first) sehingga build baru tidak pernah
  basi, aset ber-hash di-cache; semua tab yang datanya lokal (surat,
  pegawai, IKM, pengaduan, agenda) tetap bisa dibuka + dibaca offline;
  entri baru tersimpan lokal dan terunggah otomatis ke Firestore saat
  online kembali (agenda kini ikut tersinkron); chip Online/Offline di
  header, di samping chip sinkronisasi Firestore. Tes: headless
  152 → **158 cek**, harness PWA baru **16/16 cek** (logika service
  worker diuji: shell segar setelah deploy, aset ter-cache offline,
  API Firebase tidak pernah di-cache).
- **Paket 13 (23 Nov siang): Ekspor CSV Laporan Bulanan** — tombol
  **Ekspor CSV** di kartu Laporan Bulanan (Beranda) mengunduh rekap
  bulan berjalan sebagai `laporan-bulanan-YYYY-MM.csv`: surat tersimpan,
  agenda masuk/keluar + per status (baru/diproses/selesai), IKM
  (responden, skor rata-rata, kategori), pengaduan per status, dan
  kepegawaian (aktif/akan habis/habis). Header Bahasa Indonesia,
  pemisah koma, escape benar; 100% data lokal sehingga bekerja offline.
  Kartu laporan kini juga menampilkan baris agenda, dan versi cetaknya
  ikut mencantumkan rekap agenda. Tes: headless 158 → **163 cek**,
  PWA tetap **16/16** (total 179/179 hijau).
- **Paket 14 (23 Nov sore): Backup & Restore Semua Data** — kartu baru
  **Data & cadangan** di Beranda: tombol **Backup data** mengunduh
  semua data kantor sebagai satu file `desaai-backup-YYYY-MM-DD.json`
  (surat/arsip draf — termasuk salinan Firestore — pegawai, jawaban
  IKM, pengaduan, agenda + metadata versi/tanggal/jumlah per koleksi);
  tombol **Restore data** membaca file pilihan pengguna, **memvalidasi
  dulu** (versi format, struktur tiap koleksi, jumlah isi harus cocok —
  file rusak/asing ditolak tanpa menyentuh data), lalu menampilkan
  ringkasan isi backup dan meminta konfirmasi sebelum mengganti data;
  setelah restore semua tampilan + cermin Firestore mengikuti data
  baru lewat jalur sync yang sudah ada. 100% lokal, bekerja offline,
  disembunyikan di Mode Warga. Tes: headless 163 → **173 cek**
  (10 cek backup/restore baru, semua hijau), PWA tetap **16/16**
  (total 189/190 — 1 cek flaky bawaan, lihat §4).
- **Paket 15 (23 Nov sore): Cetak Surat Resmi dari Arsip** — tiap entri
  surat di Arsip kini punya tombol **Cetak Surat**: membuka pratinjau
  surat resmi dengan kop (logo + Pemerintah Kabupaten Bangka Tengah /
  Kecamatan Simpangkatis) dan kolom yang bisa diedit sebelum cetak —
  nomor surat (ada tombol **Nomor otomatis** yang memakai penomoran
  per-template yang sudah ada), tanggal, ditujukan kepada, perihal, dan
  isi surat dari draf arsip. Tidak ada data yang dikarang: nomor/tujuan
  yang kosong tercetak "—", dan nama penandatangan tercetak "—" karena
  aplikasi tidak menyimpan nama Camat. Cetak via `window.print` dengan
  stylesheet khusus (hanya surat yang tercetak, rapi di A4), 100% lokal
  dan bekerja offline; tombol ikut tersembunyi di Mode Warga (arsip
  memang khusus petugas). Tes: headless 173 → **183 cek** (10 cek
  cetak-surat baru, semua hijau), PWA tetap **16/16** (total 199/200
  — 1 cek flaky bawaan, lihat §4).
- **Paket 16 (23 Nov sore): Kartu "Perlu Ditindaklanjuti" di Beranda** —
  satu daftar semua yang masih butuh tindakan petugas, dari yang
  terlama: pengaduan berstatus Baru/Diproses + agenda berstatus
  Baru/Diproses (surat masuk tanpa disposisi ditandai "Belum
  didisposisi", bukan diduplikasi). Tiap item menampilkan jenis,
  status, tanggal, dan umur ("… hari menunggu"); ketuk item →
  lompat ke tab Pengaduan/Agenda Surat. Bila tidak ada yang terbuka,
  kartu menampilkan "Semua sudah ditindaklanjuti ✓" (bukan kartu
  kosong). Badge jumlah di judul kartu + ringkasan per jenis;
  100% data lokal, bekerja offline, disembunyikan di Mode Warga.
  Tes: headless 183 → **189 cek** (6 cek kartu baru, semua hijau),
  PWA tetap **16/16** (total 205/206 — 1 cek flaky bawaan, lihat §4).
- **Paket 17 (23 Nov siang): Pengaturan Kop Surat** — kartu baru di
  Beranda tempat petugas mengisi identitas kantor yang tercetak di kop
  dan blok tanda tangan surat resmi (Paket 15): instansi baris 1 & 2
  (sudah terisi "Pemerintah Kabupaten Bangka Tengah" / "Kecamatan
  Simpangkatis"), alamat, telepon, email, nama + NIP Camat, dan nama
  Sekretaris (opsional, muncul sebagai blok tanda tangan kedua bila
  diisi). Tidak ada data yang dikarang: field kosong tercetak "—" dan
  baris kontak kop dihilangkan bila kosong. Pengaturan ikut dalam
  backup JSON Paket 14 sebagai koleksi keenam (format tetap v1 — backup
  lama tanpa pengaturan tetap valid dan tetap bisa dipulihkan). 100%
  data lokal, bekerja offline, disembunyikan di Mode Warga; ada juga
  perintah di command palette (Ctrl+K). Tes: headless 189 → **199
  cek** (10 cek baru, semua hijau), PWA tetap **16/16** (total
  215/216 — 1 cek flaky bawaan, lihat §4).
- **Paket 18 (23 Nov siang): Grafik Tren Bulanan** — grafik batang di
  kartu Laporan Bulanan (Beranda) untuk 6 bulan terakhir: Surat
  tersimpan, Agenda masuk, Agenda keluar, dan Pengaduan — semuanya
  dihitung dari data lokal yang sudah ada (tanggal tiap entri), tanpa
  library (SVG buatan tangan, pola yang sama dengan grafik tren IKM).
  Tiap batang berlabel angka (bulan tanpa data tampil 0, bukan kosong
  atau dikarang), tooltip per batang, legenda Bahasa Indonesia, dan
  sumbu Y dengan langkah bilangan bulat. 100% lokal, bekerja offline;
  kartu laporan — dan grafiknya — tetap terlihat di Mode Warga,
  konsisten dengan laporan itu sendiri. Tes: headless 199 → **204
  cek** (5 cek baru, semua hijau), PWA tetap **16/16** (total
  220/221 — 1 cek flaky bawaan, lihat §4).

## 3. Checklist sebelum Bos tekan submit

- [ ] Tempel deskripsi baru (bagian 1) ke Devpost.
- [ ] Pastikan link live https://kuro1996.github.io/desa-ai/ masih diisi.
- [ ] (Opsional) Tambah screenshot baru: Beranda bento + daftar pengaduan.
- [ ] Submit sebelum **1 Des 2026 05:00 WIB**.

## 4. Catatan jujur (jangan ditulis di Devpost, untuk Bos saja)

- Cloud generation masih belum terbukti dari VM (endpoint Google tidak
  terjangkau dari VM) — butuh tes tombol Generate dari HP Bos.
- Jawaban survei IKM tersimpan di localStorage responden (mirror Firestore
  best-effort) — tidak auto-sync ke dashboard kantor. **Update 21 Nov sore:
  database Firestore (default) sudah dibuat di Jakarta + aturan terkunci
  per pengguna diterbitkan + Auth Anonymous dinyalakan, dan TULISAN SUDAH
  TERVERIFIKASI 21 Nov 18:27 WIB — jawaban Bos ada di
  users/{uid}/ikm/rekap (14 item, updatedAt 18:26:08 WIB).**
- Sprint 2 quota Firebase: jendela s.d. **24 Nov 15:00 WIB**.
- Paket 12: 1 cek headless flaky bawaan ("kepegawaian summary renders an
  offline recap without AI") — gagal 3 dari 4 run 23 Nov, TERBUKTI gagal
  juga di kode pra-Paket 12 (baseline 151/152). Bukan akibat PWA; jangan
  klaim 158/158 sebelum cek itu diperbaiki. **Update Paket 13: cek flaky
  tersebut LOLOS di kedua run headless hari ini — total 179/179 hijau
  (163 headless + 16 PWA).** Registrasi service worker
  live BELUM terbukti dari VM (Chrome headless di VM tidak bisa mencapai
  origin HTTP apa pun) — bukti live: buka situs di HP Bos, cek chip
  Online + "Add to Home Screen" muncul (lihat uji-cloud-hp-20261123.md).
  **Update Paket 14: cek flaky itu GAGAL lagi di run terakhir
  (173/174 headless) — total 189/190; 10 cek backup/restore baru semua
  hijau, PWA 16/16.** **Update Paket 15: cek flaky itu GAGAL lagi di
  run terakhir (183/184 headless) — total 199/200; 10 cek cetak-surat
  baru semua hijau, PWA 16/16.** **Update Paket 16: cek flaky itu
  GAGAL lagi di run terakhir (189/190 headless) — total 205/206;
  6 cek kartu follow-up baru semua hijau, PWA 16/16.** **Update Paket
  17: cek flaky itu GAGAL lagi di run terakhir (199/200 headless) —
  total 215/216; 10 cek kop-surat baru semua hijau, PWA 16/16; satu
  cek "Buat SK" sempat gagal di 2 run lalu lolos di run ke-3 (flaky
  timing, bukan regresi — kode prefill tidak disentuh Paket 17).**
  **Update Paket 18: cek flaky itu GAGAL lagi di run terakhir (204/205 headless) —
  total 220/221; 5 cek tren-bulanan baru semua hijau, PWA 16/16.**
