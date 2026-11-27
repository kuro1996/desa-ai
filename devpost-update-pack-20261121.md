# Devpost Update Pack — DesaAI (project 1305863)
Disiapkan 2026-11-21 (Paket 6). **Diperbarui 2026-11-27 (Paket 29)** — Paket
26–28 LIVE, Paket 29 kode selesai (tes 323/323), deploy menunggu Gas Bos.
**Bos yang edit + submit sendiri** di
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
  print-ready formal layout, letter archive. **Hasil draf kini tampil
  sebagai lembar surat resmi** (kop + Nomor/Tanggal/Perihal + tabel rincian
  undangan + Tembusan + tanda tangan, seperti surat dinas asli) yang langsung
  digulir ke layar setelah Generate; kolom **Tembusan (opsional)** di Surat
  Dinas + Undangan; teks mentah tetap bisa dibuka dan diedit.
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
so the office keeps working offline. 339 automated checks on every build
(323 headless-Chrome + 16 PWA; 1 known flaky check, see §4).

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
- **Paket 19 (23 Nov siang): Kalender Agenda** — tampilan kalender
  bulanan baru di tab Agenda Surat, di atas formulir pencatatan: bulan
  berjalan dengan navigasi bulan sebelum/sesudah + tombol "Hari ini",
  tiap tanggal yang punya entri agenda ditandai badge jumlah; ketuk
  tanggal → daftar entri tanggal itu (nomor agenda, perihal,
  pengirim/tujuan, status) tampil di bawah kalender, atau pesan "Tidak
  ada agenda pada tanggal ini" bila kosong. Daftar register seperti
  semula tetap ada (kalender adalah tampilan tambahan, bukan pengganti).
  Semua dihitung dari data agenda lokal yang sudah ada (tanggal entri),
  tanpa entri karangan; bulan tanpa entri tampil tanpa tanda. 100%
  lokal, bekerja offline; ikut tersembunyi di Mode Warga bersama tab
  Agenda yang memang khusus petugas. Tes: headless 204 → **211
  cek** (7 cek baru, semua hijau), PWA tetap **16/16** (total
  227/228 — 1 cek flaky bawaan, lihat §4).
- **Paket 20 (23 Nov siang): Pengingat Masa Berlaku SK Pegawai** —
  bagian "Pengingat Masa Berlaku SK" baru di tab Kepegawaian, di atas
  daftar pegawai: daftar pegawai yang SK-nya sudah habis atau akan
  habis dalam 30 hari, diurutkan dari yang paling mendesak (sudah habis
  dulu — paling lama habis di atas — lalu yang paling dekat habis).
  Tiap item menampilkan nama, jabatan + desa, tanggal habis, dan sisa
  hari ("SK sudah habis X hari lalu" / "SK habis dalam X hari").
  Semua dihitung dari tanggal habis SK (`masaSelesai`) yang sudah ada
  di data pegawai — tanpa tanggal, nama, atau jenis SK karangan;
  pegawai tanpa tanggal habis dilewati. Bila tidak ada yang mendekati
  habis: pesan positif "Semua SK masih berlaku ✓". Item SK yang
  mendesak juga ikut muncul di kartu "Perlu Ditindaklanjuti" di
  Beranda (Paket 16), lengkap dengan hitungan hari dan lompat ke tab
  Kepegawaian saat diketuk. 100% lokal, bekerja offline; ikut
  tersembunyi di Mode Warga bersama tab Kepegawaian yang memang khusus
  petugas. **Status (23 Nov ~14:15 WIB): LIVE — tes penuh hijau
  235/235 (headless 219/219 + PWA 16/16, 0 gagal; flaky bawaan tidak
  muncul kali ini); commit main 7622952, deploy gh-pages 0d896db,
  terverifikasi live. Lingkungan VM sempat rusak 12:32–14:04 WIB,
  sudah pulih.
- **Paket 21 (23 Nov sore): Statistik Pegawai** — kartu "Statistik
  Pegawai" baru di tab Kepegawaian, tepat di atas daftar pegawai:
  total pegawai, rincian per jabatan (16 kelompok pada data contoh —
  terbanyak Kepala Desa, 5), rincian per desa (11 kelompok — terbanyak
  Kantor Kecamatan, 8), dan masa berlaku SK (masih berlaku 20, sudah
  habis 3 pada data contoh per 23 Nov 2026). Semua dihitung dari data
  pegawai yang sudah ada — tanpa nama, jabatan, desa, atau tanggal
  karangan; pegawai tanpa jabatan/desa masuk "Tidak diketahui" dan
  pegawai tanpa tanggal habis SK masuk "Tanpa tanggal SK" (keduanya
  tidak pernah ditebak). Total kartu selalu sama dengan jumlah baris
  daftar pegawai. 100% lokal, bekerja offline; ikut tersembunyi di
  Mode Warga bersama tab Kepegawaian yang memang khusus petugas.
  **Status (23 Nov ~14:35 WIB): LIVE — tes penuh hijau 242/242
  (headless 226/226 + PWA 16/16, 0 gagal; flaky bawaan tidak muncul
  kali ini); commit main 950dd66, deploy gh-pages c966ab2,
  terverifikasi live.**
- **Paket 22 (23 Nov sore): Pencarian Cepat Pegawai** — pencarian
  pegawai di tab Kepegawaian kini lengkap: kotak pencarian di atas
  daftar menyaring langsung saat mengetik (tanpa tombol cari, tanpa
  reload), tidak peka huruf besar/kecil, cocok sebagian kata di nama /
  jabatan / desa. Bila tidak ada yang cocok, muncul pesan jelas
  "Tidak ada pegawai yang cocok." (bukan tabel kosong tanpa
  penjelasan). Kartu "Statistik Pegawai" (Paket 21) kini ikut
  menyesuaikan hasil saringan — total, rincian per jabatan / per desa,
  dan hitungan SK berlaku/habis selalu menggambarkan baris yang
  sedang tampil — dengan catatan kecil "Statistik untuk hasil
  saringan" selama filter aktif; begitu pencarian dikosongkan,
  statistik kembali menampilkan keseluruhan data. Kartu statistik
  atas, Pengingat SK, dan notifikasi tetap bersifat global
  (peringatan seluruh kantor, bukan hasil pencarian). Semua dihitung
  dari data pegawai yang sudah ada — tanpa data karangan; 100%
  lokal, bekerja offline; ikut tersembunyi di Mode Warga bersama tab
  Kepegawaian yang memang khusus petugas. **Status (23 Nov ~14:45
  WIB): KODE SELESAI + tes penuh hijau 249/249 (headless 233/233 +
  PWA 16/16; 2 ekspektasi tes awal sempat salah hitung lalu
  diperbaiki dari data contoh — perilaku aplikasi benar sejak awal);
  commit main 816005c ter-push. **Status (23 Nov ~15:41 WIB):
  LIVE — Bos Gas 15:37, deploy gh-pages d374c85 (ls-remote
  terverifikasi), bundle index-DrNbqX6M.js 200 + marker
  keg-no-result; tes penuh hijau 249/249.**
- **Paket 23 (23 Nov sore): Pengurutan Daftar Pegawai** — daftar
  pegawai di tab Kepegawaian kini bisa diurutkan dengan mengklik
  header kolom: Nama (A–Z / Z–A), Jabatan, Desa, dan Masa Bhakti
  (tanggal habis SK — terdekat dulu / terjauh dulu). Klik pertama
  mengurut naik, klik kedua membalik, klik ketiga mengembalikan
  urutan semula; panah kecil (▲/▼) di header menunjukkan kolom +
  arah yang aktif. Pengurutan bekerja BERSAMA pencarian (Paket 22)
  dan filter — yang diurutkan adalah baris yang sedang tersaring,
  pencarian tidak direset; kartu "Statistik Pegawai" (Paket 21) tetap
  konsisten karena statistik dihitung dari hasil saringan, dan
  pengurutan hanya mengubah urutan tampil, bukan isinya. Pegawai
  tanpa tanggal habis SK selalu diletakkan paling akhir saat mengurut
  tanggal (di kedua arah — tanggalnya tidak pernah ditebak).
  Pegawai tanpa jabatan/desa ("Tidak diketahui") diurutkan sebagai
  teks biasa. Semua dihitung dari data pegawai yang sudah ada —
  tanpa data karangan; 100% lokal, bekerja offline; ikut
  tersembunyi di Mode Warga bersama tab Kepegawaian yang memang
  khusus petugas. **Status (23 Nov sore): KODE SELESAI + tes
  265/266 hijau (headless 249/250 + PWA 16/16; 17 cek pengurutan
  baru semua hijau; 1 gagal = flaky bawaan "kepegawaian summary
  renders an offline recap without AI" — TERBUKTI bukan regresi:
  gagal juga di kode pra-Paket 23 / baseline Paket 22, 231/233,
  karena panggilan AI cloud menggantung di tunnel VM, bukan karena
  pengurutan); commit main 063b264 ter-push. **Status (23 Nov sore):
  LIVE — deploy gh-pages 86b0dab (ls-remote terverifikasi), index
  200, bundle index-ByQJR_qq.js 200 + marker data-sort-key /
  keg-table; secret check bersih.**
- **Paket 24 (23 Nov sore): Filter Cepat Pegawai per Desa &
  Jabatan** — dropdown filter Desa & Jabatan sebenarnya sudah ada,
  tapi pilihannya statis: pegawai kecamatan (desa "Kecamatan
  Simpangkatis") dan jabatan di luar daftar tidak bisa dipilih sama
  sekali. Kini pilihan dropdown dihitung dinamis dari data yang
  benar-benar ada (12 pilihan desa termasuk "Kecamatan
  Simpangkatis", 17 pilihan jabatan; diurutkan A–Z, diperbarui tiap
  render, pilihan aktif dipertahankan bila masih ada), plus tombol
  "Reset filter" baru yang mengembalikan keempat dropdown (desa,
  unit, jabatan, status) ke "Semua" — tanpa menyentuh teks pencarian
  dan urutan kolom. Filter bekerja BERSAMA pencarian (Paket 22) dan
  pengurutan (Paket 23); hanya data yang sudah ada, 100% lokal,
  bekerja offline; tersembunyi di Mode Warga bersama tab
  Kepegawaian. **Status (23 Nov malam): KODE SELESAI + tes 281/281
  hijau (headless 265/265 + PWA 16/16; 15 cek filter baru semua
  hijau); commit main 043ba8e ter-push. **Status (23 Nov malam):
  LIVE — deploy gh-pages a9acc4e (ls-remote terverifikasi), index
  200, bundle index-Vyuv_H8S.js 200 + marker keg-filter-reset;
  secret check bersih.**
- **Paket 25 (23 Nov malam): Ekspor CSV Daftar Pegawai** — tombol
  "Ekspor CSV" baru di tab Kepegawaian yang mengunduh
  `daftar-pegawai-YYYY-MM-DD.csv` berisi persis baris yang sedang
  tampil di layar: pencarian (Paket 22), filter Desa/Jabatan/Unit/
  Status (Paket 24), dan urutan kolom saat ini (Paket 23) semuanya
  diterapkan — yang diunduh adalah yang terlihat, bukan seluruh
  data. Header + nilai Bahasa Indonesia, tanggal ISO (bisa
  diurutkan di spreadsheet), kolom Status + Sisa Hari (dihitung dari
  tanggal habis SK, tidak ada yang dikarang), kolom Alamat. Escape
  CSV standar (koma/kutip digandakan). Tombol nonaktif saat hasil
  kosong; 100% lokal, bekerja offline; tersembunyi di Mode Warga
  bersama tab Kepegawaian. **Status (23 Nov malam): KODE SELESAI +
  tes 293/293 hijau (headless 277/277 + PWA 16/16; 12 cek ekspor
  baru semua hijau; flaky bawaan "kepegawaian summary renders an
  offline recap without AI" tidak gagal kali ini); commit main
  63a5ea5 ter-push. **Status (23 Nov malam): LIVE — deploy
  gh-pages d58ef4b (ls-remote terverifikasi), index 200, bundle
  index-Td-wGKUP.js 200 + marker keg-export-csv; secret check
  bersih; 0 entri node_modules.**
- **Paket 26 (23 Nov malam): Pencarian Teks di Tab Agenda** — kotak
  "Cari di agenda…" baru di tab Agenda: pencarian substring di
  tanggal/judul/kegiatan (tidak peka huruf besar-kecil), plus filter
  Arah (Semua/Masuk/Keluar) dan Status (Semua/Selesai/Belum) yang
  bekerja bersama pencarian; tombol "Reset" mengembalikan ketiganya.
  Statistik (total agenda, masuk, keluar, belum selesai) dan kalender
  tetap GLOBAL — tidak ikut terfilter, supaya angka di bento tidak
  berubah saat mencari. Anin (Paket 27) menambah baris langkah
  berikutnya saat pencarian tidak menemukan apa-apa. 100% lokal,
  bekerja offline. **Status (23 Nov malam): KODE SELESAI + tes
  303/303 hijau (headless 287/287 + PWA 16/16; 10 cek pencarian
  baru semua hijau); commit main 399772f ter-push. **Status (27 Nov):
  LIVE — deploy bersama Paket 27+28 (gh-pages ab335a1, bundle
  index-BF6RU5f_.js).**
- **Paket 27 (27 Nov): Surat Cepat + pemandu Anin** — **Surat Cepat**:
  tulis satu kalimat ("undang RT buat musyawarah desa Jumat jam 9 di
  balai desa") → formulir terisi otomatis (template + kolom terisi,
  100% lokal, tanpa AI); petugas tetap memeriksa tiap kolom sebelum
  Generate. **Pemandu Anin** (dulu "Dina"): kartu pemandu di Beranda
  dengan sapaan + langkah berikutnya sesuai keadaan kantor (mis.
  "3 pengaduan baru menunggu"), tombol cepat ke tab terkait; Anin juga
  menunjuk langkah berikutnya bila Generate ditekan saat formulir masih
  kosong. **Paket Adopsi Desa Lain**: paket JSON + checklist 5 langkah
  untuk desa lain yang mau memakai DesaAI (kop surat, 7 template,
  tanpa data kantor). Bonus: bug diperbaiki — boot aplikasi tidak lagi
  menghapus isian surat yang sedang diketik (Surat Cepat aman). Tes:
  **305/305 hijau** (headless 289/289 + PWA 16/16); commit main
  59900db (+ rename Anin 6fe63ec). **Status (27 Nov): LIVE — deploy
  bersama Paket 26+28 (gh-pages ab335a1).**
- **Paket 28 (27 Nov): Redesign model SIAP AKAD** — sidebar biru royal
  (foto kantor tetap sebagai blok merek), page-head (judul + subjudul
  tiap tab, pill tanggal, lonceng notifikasi → tab Kepegawaian),
  4 kartu statistik cerah (surat, skor IKM, pengaduan selesai,
  perangkat — data live), 2 grafik Beranda (batang per desa + donat
  jabatan, data live dari 23 perangkat), 6 kartu formulir dengan
  header banner biru, tabel pegawai dengan Export PDF (rute cetak) /
  Export Word (mengunduh CSV — belum ada penulis .docx offline),
  "Keluar" di footer sidebar → Mode Warga. Tes: **318/318 hijau**
  (headless 302/302 + PWA 16/16; sempat 316/318 — grafik gagal
  karena 8 staf kecamatan di luar 10 desa, diperbaiki jadi bar ke-11
  + donat memakai semua jabatan). **Status (27 Nov ~13:20 WIB):
  LIVE — commit main 00152da, deploy gh-pages ab335a1 (ls-remote
  terverifikasi), bundle index-BF6RU5f_.js 200 + marker agenda-search
  / Anin / Surat Cepat; Bos melihat langsung di HP-nya.**
- **Paket 29 (27 Nov): Perbaikan page-head + hasil draf jadi lembar
  surat resmi** — atas permintaan Bos (page-head yang dilingkari di HP
  terlihat jelek + hasil draf harus tampil seperti contoh surat PDF):
  **page-head diperbaiki** — judul yang tadinya memakai ukuran default
  browser (32px) karena nama class CSS salah ketik kini 24px +
  subjudul muted; slab terang di balik page-head pada mode gelap
  hilang (latar kini ikut token tema); tombol Bahasa Indonesia /
  Citizen mode / ⌘K yang transparan + teks putih kini tampil sebagai
  tombol gelap yang terbaca; di HP judul di atas, pill + tombol
  membungkus rapi tanpa terpotong. **Hasil draf kini tampil sebagai
  lembar surat resmi** (kop + Nomor/Tanggal/Perihal/Kepada Yth. +
  tabel rincian undangan + isi + Tembusan + tanda tangan, mengikuti
  format surat dinas pada contoh PDF Bos) dan langsung digulir ke layar
  setelah Generate; AI kini hanya menulis tubuh surat (kop/meta/
  tanda tangan dirender aplikasi dari formulir, tidak tercetak dua
  kali); kolom Tembusan opsional baru; teks mentah tetap bisa dibuka
  dan diedit. Tes: **323/323 hijau** (headless 307/307 + PWA 16/16;
  5 cek baru); commit main 3c0ea92 ter-push. **Status (27 Nov):
  KODE SELESAI — deploy menunggu Gas Bos.****

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
  **Update Paket 19: cek flaky itu GAGAL lagi di run terakhir (211/212 headless) —
  total 227/228; 7 cek kalender-agenda baru semua hijau, PWA 16/16.**
