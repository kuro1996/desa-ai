# Paket 32 — Laporan: Anin, agent dalam aplikasi (SELESAI, belum deploy)

Perintah Bos 27 Nov 23:43–23:50 WIB + perluasan 28 Nov 00:02 WIB (Anin bicara,
Anin analis, Anin menguasai seluruh aplikasi) + perbaikan prioritas 28 Nov 00:13 WIB
(Anin mengambil alih Tanya Prosedur) + standar akhir 28 Nov 00:20 WIB
("Agent AI-nya Anin DIMAKSIMALKAN"). **Belum di-deploy — deploy menunggu Gas Bos.**
WhatsApp BUKAN bagian Paket 32 (ditunda Bos; tombol kirim ke WhatsApp = Paket 33).

## Yang dibangun

### 1. Anin — agent dalam aplikasi (semua tab, mobile + desktop)
- **Entry point:** tombol mengambang "Tanya Anin" (wajah Anin + animasi
  bob/tilt) di kanan bawah, terlihat di semua tab, 390px maupun 980px+,
  terang maupun gelap. Kartu Anin juga ada di Beranda + tombol "Tanya Anin"
  di kartu panduan.
- **Karakter:** ilustrasi Bos (`src/assets/anin-reference.jpg`, TIDAK
  digenerate ulang). 11 crop dari lembar karakter ke `public/`:
  `anin-depan.png` + 10 wajah (`tersenyum, senang, terkagum, sedih, marah,
  bingung, takut, malu, bersemangat, mengangguk`). Ekspresi mengikuti keadaan
  (Tersenyum default; Senang saat berhasil; Bingung saat tidak paham;
  Bersemangat saat menyambut; Mengangguk saat mengonfirmasi). Animasi
  CSS/SVG (berkedip, melambai, mengangguk). Satu karakter konsisten.
- **Tugas Anin** (`src/anin-chat.ts` + `src/main.ts` `initAninChat`):
  menjawab pertanyaan seputar aplikasi, mengisi formulir surat lewat
  perintah ("Anin, buatkan surat undangan musyawarah desa tanggal
  28 November 2026 di Balai Desa Simpangkatis" → formulir terisi: templat
  undangan, acara, hari, tempat), membuka tab lewat perintah
  ("Buka Data Kepegawaian"), dan menganalisis data. Semua kontrol manual
  tetap jalan.
- **Sumber jawaban, berlapis (standar "DIMAKSIMALKAN"):** on-device → cloud
  → KB offline → panduan prosedur. Bila satu jalur tidak bisa, jalur lain
  menutupinya — Anin tidak boleh buntu tanpa jawaban yang membantu.
- **Anin bicara (voice, gratis, tanpa server):** input suara via
  SpeechRecognition browser bila tersedia + tombol mikrofon di panel;
  Anin membacakan jawaban/draf via speechSynthesis + tombol "Bacakan" di
  tiap jawaban. Bila browser/perangkat tidak mendukung, tampil pesan yang
  jelas (bukan diam).
- **Anin analis** (`src/anin-analis.ts`): membaca data IKM + pengaduan
  (lokal/Firestore) dan menjawab tren — "IKM rata-rata berapa?",
  "Keluhan terbanyak bulan ini apa?", "Apa yang harus diperbaiki?" —
  plus saran perbaikan. Agregasi di perangkat; jawaban hanya berisi
  agregat (angka, rata-rata, kategori), tidak pernah data mentah.
- **Basis pengetahuan (25 entri, tanpa celah):** `src/anin-kb.ts` mencakup
  SEMUA fitur — draf surat, Surat Cepat, simpan draf, cetak, Export Word
  (jujur: masih CSV), IKM, pengaduan, Mode Warga, offline & keamanan data,
  Buku Agenda, SK pengangkatan, ringkasan, Arsip & Draf, Data Kepegawaian,
  kop surat, bahasa, tema, backup, AI gagal, QR survei, nomor surat
  otomatis, suara — **plus 3 entri baru di putaran perbaikan ini:**
  Beranda, Tanya Prosedur, Paket Adopsi Desa Lain. Panduan prosedur
  (KTP, KK, SKTM, … — 10 entri `src/kb.ts`) dipakai Tanya Prosedur dan
  chat Anin. Jawaban "belum paham" kini menyebut semua yang bisa dibantu
  Anin (surat, prosedur, kepegawaian, IKM, pengaduan, agenda, analisis),
  bukan sekadar menolak.

### 2. Anin mengambil alih Tanya Prosedur (perbaikan 28 Nov 00:13)
Gejala di HP Bos: pertanyaan "Bagaimana cara mengurus KK baru?" hanya
menampilkan error merah mentah "Panggilan AI gagal. Jika ini proyek
Firebase baru, jalankan npx -y firebase-tools@latest init ailogic dan
aktifkan App Check, lalu coba lagi." — tanpa jawaban sama sekali.
- Bagian Tanya kini dijawab OLEH ANIN: baris wajah Anin + penjelasan
  ("Dijawab Anin — pemandu aplikasi") di atas kolom pertanyaan.
- Alur: coba AI hybrid seperti sebelumnya; **bila AI gagal, Anin menjawab
  dari panduan prosedur bawaan (offline)** + penjelasan ramah bahwa jawaban
  ini dari panduan offline karena AI cloud belum aktif. Bila tidak ada
  panduan yang cocok, Anin memberi arahan kata kunci + jalan ke chat.
- **Error mentah TIDAK PERNAH lagi tampil ke pengguna** — di bagian Tanya,
  di chat Anin (AI gagal → jawab dari KB), di ringkasan kepegawaian, maupun
  di peringkas. Pesan `statusAiError` diubah menjadi ramah ("AI sedang
  tidak bisa dihubungi — coba lagi nanti, atau tanyakan Anin"); detail
  teknis hanya masuk `console.error`. Frasa error mentah juga dihapus dari
  jawaban KB "AI gagal" (`aninFaqAiGagal`).
- Tombol baru di jawaban Tanya: **"Bacakan"** (Anin membacakan jawaban;
  pesan jelas bila perangkat tidak punya suara) dan **"Lanjutkan dengan
  Anin"** (membuka panel chat dengan pertanyaan yang sama — Anin menjawab
  di sana dan bisa ditanyai lanjut).
- Draf surat (Paket 30) tetap memakai fallback offline seperti sekarang.

### 3. PWA — gambar Anin ikut precache
- `public/sw.js`: PRECACHE kini 18 file (7 shell + 11 gambar Anin),
  `CACHE_NAME` naik `desaai-v1` → `desaai-v2` (daftar precache berubah).
  Install tetap tahan satu file hilang (per-file catch).
- `scripts/pwa-test.mjs` diperbaiki: nama cache dibaca dari `sw.js`
  (bukan lagi hardcode `desaai-v1` — itulah yang membuat tes PWA sempat
  gagal 3 cek), dan jaringan palsu ikut menyediakan 11 PNG Anin.

## Diagnosis cloud — kenapa panggilan AI gagal di HP Bos

Diperiksa dari kode + konfigurasi (nilai kunci TIDAK pernah dicetak):
- **Nama model `gemini-3.8-flash` VALID** — model resmi yang dilayani
  Firebase AI Logic (daftar model resmi Firebase). Bukan penyebab.
- `firebase-config.js` (lokal, gitignored): `apiKey` ada, `appCheckSiteKey`
  ada (kunci reCAPTCHA Enterprise) → App Check diinisialisasi dan `getAI`
  memakai limited-use App Check tokens. Konfigurasi aplikasi sudah benar.
- Di HP Bos: init Firebase BERHASIL (Firestore + auth anonim jalan — draf
  tersinkron), jadi `svc.status === "ready"`; `generateStream` gagal di
  panggilan AI-nya. Itulah yang ditangkap screenshot Bos. On-device juga
  tidak tersedia di HP Bos (WebGPU/Transformers.js tidak didukung di sana)
  — kedua jalur hybrid mati di HP; KB offline satu-satunya jalur yang
  jalan sampai langkah konsol selesai.
- **Penyebab yang paling mungkin (sisi konsol, butuh login Google Bos):**
  1. **AI Logic belum di-provision di proyek Firebase** — `firebase init
     ailogic` / Console → AI Services → AI Logic belum pernah dijalankan.
     Pesan error SDK sendiri mengarah ke sini. Paling mungkin.
  2. **App Check wajib sejak 2 Nov 2026** untuk Firebase AI Logic
     (dokumen resmi Firebase). Bila domain yang diizinkan di kunci
     reCAPTCHA Enterprise tidak mencakup `kuro1996.github.io`, atau
     penilaiannya ditolak, panggilan gagal.
  3. **Pembatasan referrer API key** (`kuro1996.github.io/*`): seharusnya
     lolos dari situs live, tapi bila browser tidak mengirim referrer →
     403. Tidak bisa diverifikasi dari VM ini.
- **Yang harus dilakukan Bos di Firebase Console (butuh loginnya):**
  1. Firebase Console → proyek DesaAI → AI Services → AI Logic →
     selesaikan setup (atau jalankan
     `npx -y firebase-tools@latest init ailogic` dari komputernya).
  2. App Check → periksa kunci reCAPTCHA Enterprise: domain yang
     diizinkan harus mencakup `kuro1996.github.io`.
  3. Google Cloud Console → API key → pastikan
     `firebasevertexai.googleapis.com` aktif + pembatasan referrer
     `kuro1996.github.io/*`.
  - Cara memastikan sudah jalan: buka situs live di HP → Tanya Prosedur
    → tanya apa pun → badge jawaban harus "Cloud" (bukan
    "Di perangkat • privat") dan tidak ada lagi catatan offline.
  - Nama model bisa diubah tanpa redeploy lewat Remote Config
    (`cloud_model`) bila suatu saat model pensiun.

## Verifikasi (di commit ini)
- `npm run build` — lolos (tsc + vite, 5,17 dtk).
- `npm run test:headless` — **359/359** (Paket 31: 331; +28 cek baru:
  16 cek Anin 9c + 12 cek putaran perbaikan ini). Termasuk: panel Anin
  terbuka + chip; KB "Syarat KTP apa saja?" (Kartu Keluarga + 17 tahun);
  analis IKM (90,28; 12 jawaban; kategori A; Sarana terendah 3,08);
  keluhan terbanyak Keterlambatan; saran perbaikan (Sarana +
  Keterlambatan); SK pengangkatan; perintah isi formulir surat; 3 entri
  KB baru (beranda, Tanya Prosedur, adopsi desa lain); "belum paham"
  tetap menyebut kemampuan Anin; mic + bacakan memberi pesan jelas bila
  tidak didukung; panel gelap terbaca; **Tanya menjawab KK dari panduan
  offline + status ramah Anin + TIDAK ADA teks "Panggilan AI gagal" /
  "npx -y firebase-tools" di mana pun di halaman + tombol Bacakan dan
  Lanjutkan dengan Anin + "Lanjutkan dengan Anin" membuka chat dengan
  pertanyaan yang sama**.
- `npm run test:pwa` — **16/16** (install precache 18 file).
- `npm run check:secrets` — bersih.
- Screenshot VIEWPORT (bukan fullPage) — 8 file di `show-20261127/`
  (tidak di-commit), diverifikasi visual: terang + gelap, 390px + 980px,
  beranda (FAB Anin), panel chat Anin, dan Tanya Prosedur dengan jawaban
  KK dari Anin.
  - `desaai-p32-home-light-mobile.png`, `desaai-p32-home-dark-mobile.png`
  - `desaai-p32-chat-light-mobile.png`, `desaai-p32-chat-light-980.png`
  - `desaai-p32-qa-anin-light-mobile.png`, `desaai-p32-qa-anin-dark-mobile.png`
  - `desaai-p32-home-light-980.png`, `desaai-p32-qa-anin-dark-980.png`
- Dua bug tes yang ditemukan & diperbaiki selama verifikasi (bukan bug
  aplikasi): (1) tes PWA hardcode `desaai-v1` padahal worker sudah v2 —
  kini baca dari `sw.js`; (2) cek analis IKM 9c mengasumsikan data seed 12
  responden, padahal bagian IKM di awal suite me-reset data ke 1 jawaban
  (skor 25) — kini 9c me-re-seed dulu sebelum cek analis; (3) ekspektasi
  "Kategori A" di tes (huruf besar) vs templat jawaban "kategori A" —
  diperbaiki jadi case-insensitive.

## File yang berubah (commit kode)
`index.html`, `public/sw.js`, `public/anin-*.png` (11 baru),
`src/assets/anin-reference.jpg` (baru), `src/anin-chat.ts` (baru),
`src/anin-kb.ts` (baru), `src/anin-analis.ts` (baru), `src/i18n.ts`,
`src/main.ts`, `src/styles.css`, `scripts/headless-test.mjs`,
`scripts/pwa-test.mjs`, `scripts/screenshot-p32.mjs` (baru).
Rencana di `PAKET-32-RENCANA.md` (tidak di-commit, seperti paket lalu).

## Yang TIDAK dilakukan
- **Tidak deploy** ke gh-pages — menunggu Gas Bos.
- **Tidak ada WhatsApp / backend / server** — tetap di luar Paket 32.
- Tidak menyentuh kredensial/API key; tidak mengubah data contoh.

## Addendum — perbaikan tes SK reminder (28 Nov ~00:55 WIB, verifikasi ulang Kuro)
Verifikasi independen Kuro menemukan 1 cek gagal (358/359): "SK reminder
picks up a +10-day record…" — penyebabnya BUG TES, bukan bug aplikasi:
manipulasi tes memakai `toISOString()` (UTC) untuk membangun tanggal
+10 hari, sementara aplikasi + ekspektasi tes menghitung hari dari
tengah malam LOKAL (WIB). Lewat tengah malam WIB, UTC masih tanggal
lama, jadi +10 hari UTC = 9 hari lokal dan aplikasi benar menampilkan
"SK expires in 9 days". Perbaikan: tanggal dibangun dari komponen lokal
(`getFullYear/getMonth/getDate`). Tes ulang: **359/359**, PWA 16/16,
secrets bersih. Commit perbaikan tes: `ad6d4b8`.

## Addendum — Deploy (28 Nov 2026, Gas Bos)
- Deploy dieksekusi setelah Gas Bos (balasan ke laporan 00:58 + "Deploy dulu video nanti" ke naskah video 08:21).
- gh-pages: 64a0c5f → **e7c583c** (15 files changed; 11 gambar Anin baru + bundle baru index-OnxCXOiD.js / index-KPZd4XpQ.css).
- Verifikasi live: `ls-remote origin gh-pages` = e7c583c; https://kuro1996.github.io/desa-ai/ menyajikan bundle baru (HTTP 200 untuk JS + anin-depan.png).
- Video demo: DITAHAN dulu sesuai perintah Bos — produksi setelah deploy.
