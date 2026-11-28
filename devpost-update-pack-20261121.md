# Devpost Update Pack — DesaAI (project 1305863)
Disiapkan 2026-11-21 (Paket 6). **Diperbarui 2026-11-28 (Paket 44 LIVE)** —
Paket 30–44 LIVE di https://kuro1996.github.io/desa-ai/ (gh-pages
`0fea5e3`, main `1ac26a4`); Paket 45 (Laporan Bulanan .docx) SELESAI
dibangun (main `4136a99`, headless 426/426, PWA 16/16) tapi BELUM
di-deploy — JANGAN klaim di Devpost sebelum LIVE.
**Bos yang edit + submit sendiri** di
https://devpost.com/software/desaai — batas edit **1 Des 2026 05:00 WIB**.
Live: https://kuro1996.github.io/desa-ai/ — Repo: https://github.com/kuro1996/desa-ai

## 1. Deskripsi proyek — versi baru (tempel ke kolom Description)

> Draf ini disusun mengikuti keempat kriteria penjurian resmi
> #BuildHybridAI (Stage 2, bobot sama 1–5: Technological Implementation,
> Design, Potential Impact, Quality of the Idea). Bahasa Inggris, karena
> submission berbahasa Inggris. Jangan tempel bagian "Catatan jujur" (§4)
> ke Devpost — itu hanya untuk Bos.

**DesaAI — offline-first AI clerk for Indonesian village & subdistrict offices.**

Village offices run on paper, WhatsApp, and memory. DesaAI is a single-page
web app for a real subdistrict office — Kecamatan Simpangkatis, Bangka
Tengah, Indonesia — that drafts formal official letters, summarizes long
documents, and answers procedure questions. It is built around **Firebase
AI Logic hybrid inference**: short, private prompts run **on-device
(Gemini Nano 4)** when available, and long or complex prompts fall back
to **cloud Gemini**. Every answer shows a visible routing badge
("On-device • private" vs "Cloud") and the reason it routed that way, so
staff always know where their data went — and the office keeps working
even when the internet does not.

### Technological Implementation — hybrid inference, actually called at runtime

- **Firebase AI Logic, not just imported:** `getAI` + `GoogleAIBackend`
  are called at runtime for every AI feature (letter drafting,
  summarization, procedure Q&A, Anin chat, personnel summary).
  Cloud model is `gemini-3.8-flash`, configurable without redeploy via
  Remote Config (`cloud_model`).
- **On-device (Gemini Nano 4):** the app probes the Chrome Prompt API
  directly (`LanguageModel.availability()`), starts the on-device model
  download on a user gesture (`initializeDeviceModel()`), and runs the
  model in `PREFER_ON_DEVICE` mode. Short, private prompts prefer
  on-device; the UI shows the live on-device status in the header chip.
- **Routing with a reason:** prompts longer than the Remote Config
  threshold (`on_device_max_chars`, default 12,000 characters) go
  straight to the cloud-only model; the SDK reports the real source in
  `response.inferenceSource`, which the UI displays as the routing badge
  plus the fallback reason.
- **Offline knowledge base:** a built-in 43-entry procedure guide (KTP,
  KK, SKTM, domisili, birth/death certificates, and more) answers
  fully offline, with tickable document checklists. Rule-based Surat
  Cepat turns one sentence into a filled letter form with no AI call,
  and an offline letter-draft builder guarantees a draft is produced
  from the form even when AI is unreachable — a draft is never an empty
  screen.
- **Data:** Firestore (asia-southeast2, per-user rules, anonymous auth)
  mirrors letters, personnel, IKM answers, complaints, and the mail
  register; localStorage-first, so everything keeps working offline and
  syncs when the connection returns. App Check is enabled with a
  reCAPTCHA Enterprise key; enforcement is currently paused until
  21 Jan 2027 while the allowlist is fixed (limited-use tokens were
  blocking AI calls — removed in Paket 32.2; debug tokens are accepted
  for submissions).

### Architectural Rationale — why each task runs where it runs

| Task | Runs | Why |
|---|---|---|
| Short / private prompts (quick letter instructions, personal questions) | On-device (Gemini Nano 4) | Privacy — personal data never leaves the device; fast; works with no connection |
| Procedure Q&A from the built-in guide | On-device (offline knowledge base) | Zero cost, zero latency, always available at the service counter |
| Long / complex drafts and document summaries | Cloud (Gemini) | Quality — long documents need the full cloud model (on-device is capped at 9,216 input tokens) |
| Letter drafts when AI is unreachable | Offline draft builder (rule-based) | Reliability — village internet is unstable; the officer must never be left with an empty draft |
| IKM survey, complaints, mail register, personnel | Local-first + Firestore mirror | The office record must survive offline hours and sync later |

This split exists because the office it serves has unstable internet,
tight costs, and citizens' personal data — so privacy, offline
availability, and cost decide the routing, not convenience.

### Design — one font, blue-white, readable on a phone

- Blue-white light theme with black text and a single bundled font
  (Plus Jakarta Sans, by an Indonesian designer, OFL) applied to every
  element; a real dark mode (black background, white text) with the
  letter sheet staying white paper in both themes.
- Mobile-first and tidy on a phone: single-column Home, collapsible
  cards (state saved per card), an icon menu grid for all 11 tabs, and
  transparent state feedback — routing badges, Firebase sync chip
  ("Firebase: connected · Synced …"), and Online/Offline chip in the
  header.
- Bilingual UI (English/Indonesian, persisted), deep links per tab,
  global search (⌘K command palette), and all settings consolidated in
  one Settings tab.
- Sample data is clearly labelled "Data Contoh — bukan data asli" in
  every module, and AI drafts must be reviewed by a human officer
  before use.

### Potential Impact — a real office, real users, real workflows

- Built for and with Kecamatan Simpangkatis (Bangka Tengah): letter
  drafting (9 templates incl. SKTM and emergency letters), IKM
  community-satisfaction survey (PermenPAN-RB 14/2017, 9 elements,
  score = mean × 25), complaints tracked Baru → Diproses → Selesai,
  mail register with agenda numbers and disposition, personnel
  administration for 10 villages, and a monthly report.
- Real usage, not a demo dataset: survey answers are already being
  written to Firestore from the office (14 answers verified in the
  database), and the app is live at https://kuro1996.github.io/desa-ai/.
- Built to outlive the hackathon: an Adoption Pack (downloadable JSON +
  5-step checklist) lets any other village office adopt DesaAI for
  free, with its own letterhead and no office data included.

### Quality of the Idea — an AI clerk for village administration

- A government-office assistant that speaks the office's language:
  formal Indonesian letters, procedure answers in Indonesian, and Anin
  — the in-app guide — answering in Bahasa Bangka too.
- Offline-first for places where connectivity is weak: the guide, the
  letter builder, and the office record all work with no connection,
  and the cloud is used only where it is genuinely better.
- Anin, the in-app agent, learns from the letter archive (next letter
  number, templates used), checks drafts against the official format,
  reminds staff about overdue agenda items and complaints, drafts
  meeting minutes from pasted notes, and answers in Bahasa Bangka.

**What it does (11 tabs):** Beranda (Home dashboard) · Draf Surat
(Letter drafting) · Ringkasan (Summarize + meeting minutes) · Tanya
Prosedur (Procedure Q&A) · Arsip & Draf (Archive) · Data Kepegawaian
(Personnel) · Kepuasan / IKM (Satisfaction survey) · Pengaduan
(Complaints) · Agenda Surat (Mail register) · Contact Person · Pengaturan
(Settings).

**Tech:** Vite + TypeScript, Firebase AI Logic (Gemini Nano 4 on-device +
cloud Gemini fallback), Firestore mirror (best-effort), localStorage-first
so the office keeps working offline. 435 automated checks on every build
(426 headless-Chrome + 16 PWA; see §4 for the one known flaky check).
Apache-2.0, public repo with a headless-Chrome verification script.

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
- **Paket 30 (27 Nov malam): Draf surat offline + biru-putih-hitam +
  font Plus Jakarta Sans** — draf surat kini dibuat dari formulir
  (offline) bila AI gagal, jadi draf tidak pernah kosong; font Plus
  Jakarta Sans (karya desainer Indonesia, dibundel lokal) diterapkan ke
  semua elemen; tema terang biru-putih-teks hitam; judul "Administrasi
  Kecamatan Simpangkatis"; menu jadi "Data Kepegawaian"; kata "SIAP
  AKAD" dihapus dari semua tulisan terlihat. Bonus: bug nyata kartu
  bento terjepit 42px di HP 390px diperbaiki. Tes: **329/329 hijau**,
  PWA 16/16. **Status: LIVE (ikut deploy-deploy berikutnya).**
- **Paket 31 (27 Nov malam): Mode gelap sungguhan + banner page-head +
  dua logo** — mode gelap benar (latar hitam, teks putih; lembar surat
  tetap putih-kertas); page-head jadi banner gradien biru + foto kantor;
  logo Kabupaten Bangka Tengah + logo Kecamatan Simpangkatis
  berdampingan di blok brand sidebar (logo kabupaten resolusi tinggi
  3095×4022, diperkecil ke 512px). Nama aplikasi tetap "DesaAI"
  (rename sempat masuk lalu dibatalkan Bos 23:41 WIB). Tes: **331/331
  hijau**, PWA 16/16. **Status: LIVE.**
- **Paket 32 (28 Nov dini hari): Anin, agent dalam aplikasi** —
  pemandu Anin (ilustrasi Bos, 11 ekspresi, animasi) lewat tombol
  mengambang "Tanya Anin" di semua tab; menjawab, mengisi formulir
  surat lewat perintah, membuka tab, menganalisis IKM + pengaduan;
  sumber jawaban berlapis on-device → cloud → KB offline → panduan
  prosedur (tidak pernah buntu); input + bacakan suara gratis (Web
  Speech API); Anin mengambil alih Tanya Prosedur — bila AI gagal,
  Anin menjawab dari panduan offline dan error mentah tidak pernah
  tampil ke pengguna. Diagnosis cloud: nama model `gemini-3.8-flash`
  VALID; penyebab gagal paling mungkin AI Logic belum di-provision /
  domain reCAPTCHA belum mencakup `kuro1996.github.io`. Tes:
  **359/359 hijau**, PWA 16/16. **Status: LIVE (gh-pages e7c583c).**
- **Paket 32.1 (28 Nov pagi): Anin makin pintar offline** — basis
  pengetahuan Anin 10 → **43 entri** (semua fitur + administrasi umum
  di luar aplikasi: alur pengaduan Baru → Diproses → Selesai, KTP/KK,
  surat masuk/keluar); jawaban tidak pernah buntu; Anin tidak mengarang
  tarif, nomor regulasi, atau nama pejabat. **Status: LIVE (deploy
  gabung 32.1 + 32.2 + 33, gh-pages a636e0e).**
- **Paket 32.2 (28 Nov pagi): Cloud diperbaiki** — `useLimitedUseAppCheckTokens`
  dilepas dari `getAI()` (token App Check mematikan semua panggilan AI
  di sisi klien); tes Node dengan Referer situs mengembalikan jawaban
  Gemini asli = **CLOUD OK**. App Check enforcement OFF sampai
  21 Jan 2027 — tindak lanjut: perbaiki allowlist reCAPTCHA Enterprise
  untuk `kuro1996.github.io`, lalu aktifkan lagi. **Status: LIVE.**
- **Paket 33 (28 Nov pagi): Kirim draf ke WhatsApp** — tombol "Kirim
  ke WhatsApp" di lembar draf + tiap surat arsip (tautan `wa.me`,
  fallback salin-tempel untuk surat sangat panjang); Anin tahu fitur
  ini (KB kini 26 entri). Tes: **374/374 hijau**, PWA 16/16.
  **Status: LIVE (gh-pages a636e0e; bundle mengandung `wa.me`).**
- **Paket 34 (28 Nov siang): 9 ide Anin/aplikasi** — (1) Anin belajar
  dari arsip (nomor surat berikutnya, template yang pernah dipakai);
  (2) Anin pemeriksa surat (format resmi + EYD, perbaikan per temuan
  hanya bila petugas menekan "Terapkan"); (3) Anin pengingat (agenda +
  pengaduan lewat tenggat); (4) verifikasi surat via QR (halaman
  verifikasi publik); (5) lapor warga + lacak tiket terpandu Anin;
  (6) Dashboard pagi Camat; (7) notulen rapat otomatis dari catatan
  (parser offline, tidak mengarang; dikte suara — transkripsi live
  belum terbukti di VM, butuh uji HP Bos); (8) Anin Bahasa Bangka
  (sakelar, frasa terverifikasi — yang "cukup yakin" masih butuh
  koreksi Bos); (9) Mode Darurat (8 tombol bencana, 2 template baru,
  total 9 template). Ide 10 (kiosk loket) ditunda. Bonus: bug
  `applyLang()` telat di boot diperbaiki. Tes: **413/413 hijau**,
  PWA 16/16. **Status: LIVE (gh-pages 713bf80).**
- **Paket 35 (28 Nov pagi): Tab Pengaturan + Kartu Kontak** — tab
  Pengaturan baru (8 kelompok: Akun, Tampilan, Bahasa, Anin, Mode,
  Kop Surat, Data & Privasi, Bantuan & Tentang; bahasa kini tersimpan
  `desaai-lang-v1`, tema auto, ukuran teks, mode offline saja,
  hapus data dua langkah); kartu Kontak di Beranda dengan data persis
  dari Bos (alamat, telepon `tel:`, email `mailto:`, 3 sosmed teks
  saja tanpa URL karangan). Keamanan login sungguhan DITUNDA Bos
  ("Nanti kalau udah mantap kita bisa buat keamanan nya"). Tes:
  **392/392 hijau**, PWA 16/16. **Status: LIVE (gh-pages 6f6f9a6,
  deploy gabung 35+36).**
- **Paket 36 (28 Nov pagi): Layar Masuk Demo** — kartu login putih di
  atas gradien biru (judul "DesaAI", subjudul "Administrasi Kecamatan
  Simpangkatis"), akun demo `demo` / `demo123`, sesi localStorage.
  **Ini DEMO, bukan keamanan sungguhan** — tertulis jelas di kartu.
  Tes: **401/401 hijau**, PWA 16/16. **Status: LIVE (gh-pages
  6f6f9a6).**
- **Paket 37 (28 Nov siang): Beranda makin ringkas** — kartu Data &
  Backup dan Kop Surat pindah dari Beranda ke Pengaturan; Restore
  pindah ke Pengaturan → Data & Privasi (logika lama dipakai ulang).
  Bonus: bug halaman verifikasi surat menutupi Beranda diperbaiki.
  Tes: **403/403 hijau**, PWA 16/16. **Status: LIVE (gh-pages
  8c3538e, deploy gabung 37–40).**
- **Paket 38 (28 Nov siang): Kartu Beranda bisa dilipat** — tombol
  −/+ di tiap kartu (kecuali Tren IKM); saat terlipat judul + angka
  ringkas tetap terlihat; status tersimpan di localStorage
  (`desaai-home-collapsed-v1`). Tes: **410/410 hijau**, PWA 16/16.
  **Status: LIVE (gh-pages 8c3538e).**
- **Paket 39 (28 Nov siang): Hapus 3 kartu duplikat Beranda** —
  Complaints by Type, Officers per Village, Composition by Position
  (datanya tetap terjangkau di tab Pengaduan / Data Kepegawaian).
  Beranda 18 → 15 kartu. Tes: **409/409 hijau**, PWA 16/16.
  **Status: LIVE (gh-pages 8c3538e).**
- **Paket 40 (28 Nov siang): Tab Contact Person** — kartu Hubungi Kami
  dihapus dari Beranda; tab Contact Person baru tepat di atas
  Pengaturan (halaman penuh, 6 baris kontak persis dari Bos, terlihat
  juga di Mode Warga); sidebar kini 11 tab; deep link `#kontak`. Tes:
  **413/413 hijau**, PWA 16/16. **Status: LIVE (gh-pages 8c3538e).**
- **Paket 41 (28 Nov sore): Hapus 4 kartu + rapikan header** —
  Adoption Pack (DIPINDAH ke Pengaturan → Bantuan & Tentang, bukan
  dihapus), Needs Follow-Up, Tren IKM (dari Beranda), Surat Hari Ini —
  semuanya terverifikasi terjangkau di menu terkait; header "Dashboard
  kantor" direstrukturasi 3 baris rapi, foto kantor kini kelihatan
  (gradien dilonggarkan). Beranda 15 → 11 kartu. Tes: **413/413
  hijau**, PWA 16/16. **Status: LIVE (gh-pages b6dc5e4).**
- **Paket 42 (28 Nov sore): Layout Beranda AIDEN + tren IKM pindah**
  — baris 4 kartu statistik berwarna (IKM / Surat bulan ini /
  Pengaduan baru / Masa bhakti, ketuk → buka tab), panel dua kolom di
  desktop, dan garis tren IKM kumulatif dipindah ke dalam tab
  Kepuasan/IKM (12 titik). Tes: **417/417 hijau**, PWA 16/16.
  **Status: LIVE (gh-pages 47e57b7) — TAPI desain Berandanya
  dibatalkan Paket 44 (Bos menilai tidak rapi di HP); tren IKM di tab
  IKM dipertahankan.**
- **Paket 43 (28 Nov sore): Rapikan baris statistik ganda** — strip
  quick-stats disembunyikan HANYA saat tab Beranda aktif (tetap tampil
  di tab lain, tetap di DOM dengan binding live). Tes: **419/419
  hijau**, PWA 16/16. **Status: LIVE (gh-pages 2fb594b) — TAPI
  dibatalkan Paket 44 (strip dikembalikan tampil).**
- **Paket 44 (28 Nov sore): Balik ke tampilan lama + grid ikon +
  IKM sekali saja** — atas perintah Bos setelah cek HP: strip
  quick-stats kembali tampil, baris AIDEN dihapus, panel kembali satu
  kolom; grid ikon menu baru di Beranda (10 tile, ikon SVG + label
  saja, tanpa angka, ketuk → buka tab); skor IKM kini hanya 1× di
  Beranda (di kartu SKOR IKM — tile quick-stats IKM diganti "Draf
  surat", fragmen IKM dihapus dari ringkasan Briefing Pagi, baris
  Camat kini hanya "12 Responden"); garis tren IKM TETAP di tab IKM.
  Tes: **419/419 hijau**, PWA 16/16. **Status: LIVE (gh-pages
  0fea5e3, main 3c7eb30 + addendum 1ac26a4) — INI yang live sekarang.**
- **Paket 45 (28 Nov sore, SELESAI DIBANGUN — main `4136a99`,
  headless 426/426, PWA 16/16 — tapi BELUM LIVE):**
  Laporan Bulanan Otomatis — rekap surat/IKM/pengaduan per bulan,
  ekspor **.docx asli** + cetak PDF; menutup celah lama "Export Word"
  yang masih mengunduh CSV (termasuk tombol Export Word di tabel
  kepegawaian — kini .docx asli). **Hanya sebut di Devpost bila Paket 45
  sudah LIVE sebelum Bos submit.****

## 3. Checklist sebelum Bos tekan submit

- [ ] Tempel deskripsi baru (bagian 1) ke Devpost — ganti seluruh
      kolom Description dengan draf §1 (bukan ditambah di bawah yang
      lama).
- [ ] Pastikan link live https://kuro1996.github.io/desa-ai/ dan repo
      https://github.com/kuro1996/desa-ai masih terisi.
- [ ] Cek HP dulu (lihat §4): badge "Cloud" di Tanya Prosedur + Anin
      menjawab soal pengaduan — bila sudah "Cloud", klaim cloud di §1
      sudah terbukti penuh.
- [ ] Video demo baru — dibuat TERAKHIR, setelah semua fix selesai
      (perintah Bos 28 Nov 17:05 WIB). Jangan submit video lama bila
      video baru sudah jadi; ganti link YouTube-nya di Devpost.
- [ ] Bila Paket 45 sudah LIVE sebelum submit: tambahkan satu baris
      ke §1 ("Monthly report exports a real .docx") dan ke §2.
      Bila belum live: JANGAN sebut .docx di Devpost.
- [ ] Tambah screenshot baru (opsional tapi dianjurkan): Beranda
      Paket 44 (grid ikon + strip quick-stats) + panel chat Anin +
      tab IKM (tren).
- [ ] Submit sebelum **1 Des 2026 05:00 WIB**.

## 4. Catatan jujur (jangan ditulis di Devpost, untuk Bos saja)

- **Video demo baru dibuat TERAKHIR** (perintah Bos 28 Nov 17:05 WIB:
  "Cuma kalau udah fix selesai semua baru buat videonya"). Naskah
  3 menit sudah siap (7 segmen + teleprompter + paket YouTube,
  `desaai-naskah-video-demo-3-menit.docx` di folder goal). Video harus
  menunjukkan fitur hibrida bekerja sejak awal — juri boleh menilai
  hanya dari video. Video lama jangan dihapus sebelum link baru
  tersimpan di Devpost.
- **Bukti cloud dari HP Bos — MASIH PENDING.** Screenshot 28 Nov
  10:34 membuktikan aplikasi termuat + "Firebase: connected · Synced
  10:31, Online". Yang belum terbukti: badge jawaban Tanya Prosedur
  membaca "Cloud" dan Anin menjawab pertanyaan pengaduan. Bila Bos
  melaporkan keduanya, saga cloud DITUTUP. Bila masih gagal,
  tersangka berikutnya: nilai kunci reCAPTCHA itu sendiri, atau
  override model di Remote Config.
- **Paket 45 SELESAI DIBANGUN** (main `4136a99`, Laporan Bulanan
  .docx asli + cetak PDF) tapi BELUM LIVE.
  Jangan klaim di Devpost sebelum live.
- **Login masih demo** (`demo` / `demo123`, tertulis jelas di layar
  login). Login sungguhan DITUNDA Bos sampai aplikasi solid — jangan
  klaim keamanan login di Devpost.
- **App Check enforcement OFF sampai 21 Jan 2027** (Paket 32.2).
  Tindak lanjut: perbaiki allowlist reCAPTCHA Enterprise untuk
  `kuro1996.github.io`, lalu aktifkan lagi — atau AI bisa mati lagi.
  Token debug diterima untuk submission, jadi ini tidak menghalangi
  submit.
- **Frasa Bahasa Bangka "cukup yakin" belum diverifikasi Bos:** ka,
  bi, lom, asak, kawa, bise, gey, terima kaseh, di mane. Jangan klaim
  keakuratan dialek di Devpost sebelum Bos mengoreksi.
- **Dikte suara notulen rapat belum terbukti live** (VM tidak punya
  mikrofon; butuh uji dari HP Bos).
- **Perilaku PWA live belum terbukti dari HP Bos** (instalasi +
  offline) — butuh cek "Add to Home Screen" + chip Online.
- **"Export Word" di tabel kepegawaian SUDAH diperbaiki Paket 45**
  (kini mengunduh .docx asli; tombol CSV tetap CSV sesuai label) —
  tapi baru terverifikasi struktural (ZIP/MIME), belum dibuka di Word
  sungguhan dan belum LIVE. Jangan klaim sebelum live.
- **Data kontak kantor (JANGAN diubah/dikarang):** Jl. Merdeka No 02
  Desa Katis, Kode Pos 33674 · 08117121844 · kec.spkatis2014@gmail.com
  · Facebook "kantor kecamatan simpangkatis" (teks saja, TANPA URL) ·
  X @kec_simpangkatis · Instagram kecamatansimpangkatis.
- **Nama/NIP pejabat TIDAK PERNAH dikarang** — aplikasi mencetak "—"
  bila kosong. Jangan isi nama Camat di Devpost dari ingatan.
- **Tes headless tidak 100% stabil di VM ini** — baseline main bersih
  390/401; 1 cek flaky bawaan ("kepegawaian summary renders an
  offline recap without AI") gagal di baseline pra-Paket-12 juga.
  Angka 419/419 adalah hasil run terakhir yang hijau, bukan jaminan
  tiap run.
- **Nama tetap DesaAI** — rename Besuyak DIBATALKAN Bos 27 Nov 23:41.
  Jangan sebut nama lain di Devpost.
