# Paket 46 — Lacak Surat + Anin Suara + Radar Tenggat + Statistik Warga + TTE Demo

**Tanggal:** 28 Nov 2026 ~18:00 WIB · **Base:** main `4136a99` (Paket 45, belum di-deploy — live masih Paket 44 gh-pages `0fea5e3`) · **Status:** selesai + terverifikasi; **BELUM DEPLOY — menunggu Gas Bos** (lihat §7).

Catatan base: saat commit, main sudah maju satu langkah ke `364af23` (refresh Devpost update-pack oleh pekerjaan paralel — hanya menyentuh `devpost-update-pack-20261121.md`, file terpisah, tanpa konflik dengan file Paket 46).

## 1. Keputusan Bos

Bos mengadopsi lima ide dari daftar 10 yang ditawarkan 28 Nov 17:06 WIB — **#2 Lacak Status Surat, #3 Anin Suara, #5 Radar Tenggat Surat, #7 Statistik Kecamatan untuk Warga, dan #6 sebagai TTE DEMO SAJA** ("pakai tte aja tanda tangannya kasih contoh demo aja"). Ide #4, #8, #9, #10 TIDAK diadopsi — tidak dibangun.

## 2. Yang dibangun

Semua fitur memakai **data lokal nyata** aplikasi (surat/arsip, IKM, pengaduan, agenda) — tidak ada angka/nama yang dikarang; state kosong tampil jujur, bukan nol palsu. Semua kartu baru memakai tombol lipat −/+ seperti kartu Beranda lain (otomatis lewat `initHomeCollapse`, karena memakai `data-card`).

### a. #2 Lacak Status Surat (publik, tanpa login)

- Kartu baru di Beranda (`data-card="lacak"`): input nomor + tombol **Lacak** (Enter juga bisa), tanpa login.
- `findTrackable()` di `src/main.ts`: cocok persis (tanpa beda huruf besar/kecil) dengan **nomor tiket pengaduan** (`ADU-YYYY-NNNN`) atau **nomor surat / nomor agenda** dari buku agenda.
- Nomor ditemukan → pill status (Baru/Diproses/Selesai) + baris data surat itu (layanan surat, jenis pengaduan / perihal + pihak, tanggal) + **linimasa Baru → Diproses → Selesai** (tanggal tiap tahap bila ada datanya).
- Nomor tidak ditemukan → jujur **"Nomor tidak ditemukan — periksa lagi atau tanya petugas"**, hasil dikosongkan. **Tidak ada data pribadi lain yang tampil** (nama/kontak pelapor tidak pernah dirender di kartu ini).
- Supaya bisa dicoba langsung: 6 pengaduan contoh di `src/pengaduan.ts` (`ADUAN_SEED`) kini punya tiket **`ADU-2026-0001` s.d. `ADU-2026-0006`** (status Baru 3, Diproses 2, Selesai 1).
- Pesan simpan pengaduan kini menyebut nomor tiketnya (`aduSavedTicket`: "Pengaduan tersimpan. Nomor lacak Anda: ADU-… — simpan nomor ini untuk melacak status."), supaya warga langsung bisa melacak.

### b. #3 Anin Suara (tanya jawab pakai suara)

- Tombol mikrofon **🎤 "Tanya dengan suara"** (`#qa-mic`) di Tanya Prosedur, di samping tombol Tanya.
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) untuk mendengar + `speechSynthesis` (fungsi `speakText` yang sudah ada — pilih suara Indonesia bila tersedia) untuk Anin membacakan jawabannya. **Jawaban dibacakan otomatis bila pertanyaannya masuk lewat suara** (`qaVoiceAsked`); bila suara perangkat tidak tersedia, status menjelaskan (bukan diam).
- Indikator: tombol mendapat kelas `.listening` (denyut merah, animasi `mic-pulse`) + status "Mendengarkan…".
- Bila browser tidak mendukung → pesan jujur **"Browser ini belum mendukung suara, silakan ketik"** (`aninVoiceNoMic`); bila mikrofon gagal (mis. izin ditolak) → **"Mikrofon tidak bisa dipakai (…), silakan ketik saja"** (`aninVoiceMicError`). **Audio tidak dikirim ke server mana pun** — semua di perangkat.
- FAQ suara diperbarui (`aninFaqSuara` menyebut mikrofon Tanya Prosedur); jawaban FAQ suara Anin juga menyebutnya.

### c. #5 Radar Tenggat Surat

- Kartu baru di Beranda (`data-card="radar"`) + **badge jumlah** di judul; klik baris → membuka tab sumbernya (agenda/pengaduan), seperti widget Pengingat.
- Sumber yang sama dengan Pengingat (Paket 34 Ide 3) — `computeReminders()` — tapi tampil dengan **tanggal jatuh tempo yang eksplisit**: `Reminder` di `src/anin-pengingat.ts` mendapat kolom baru `dueAt` (agenda = tanggal surat; pengaduan = tanggal laporan + 3 hari batas tindak lanjut).
- Dikelompokkan **"Lewat tenggat"** dulu, lalu **"Mendekati tenggat (≤3 hari)"**; tiap baris memuat pihak + tanggal jatuh tempo + selisih hari ("9 hari lewat" / "2 hari lagi" / "besok").
- Tanpa data tenggat → jujur **"Belum ada surat yang mendekati tenggat"** (`home-radar-empty`).
- Data 28 Nov 2026 (data contoh): **7 item** — 2 agenda lewat + 5 pengaduan lama (menunggu >3 hari). Itu data nyata aplikasi, bukan alarm palsu (lihat §6).

### d. #7 Statistik Kecamatan untuk Warga

- Kartu baru di Beranda (`data-card="statistik"`), 4 baris dari data lokal nyata (`monthlyReportData()` bulan berjalan + `computeAduanStats()` total), berlabel jelas **"Angka terbuka untuk warga — dari data aplikasi DesaAI"**:
  - Surat tersimpan bulan ini: **0**,
  - Agenda surat bulan ini: **Masuk 2 · Keluar 2**,
  - Responden IKM bulan ini: **12**,
  - Pengaduan selesai (total): **1 / 6**.
- **TANPA angka skor IKM** — aturan Paket 44: skor hanya sekali di Beranda, di kartu SKOR IKM. Yang tampil hanya jumlah responden + tombol **"Lihat detail IKM"** → tab Kepuasan.
- Bila bulan berjalan belum ada responden IKM → barisnya jujur "Belum ada jawaban survei bulan ini" (`statIkmNone`).

### e. #6 TTE (DEMO SAJA — bukan TTE resmi)

- `renderTteDemoBlock()` di bawah blok tanda tangan **lembar draf surat** (`renderLetterSheet`) dan **lembar arsip** (`renderArchiveSheet`), plus baris teks di **cetak laporan bulanan** (`printMonthlyReport`).
- Label besar dan jelas (merah, huruf besar): **"CONTOH DEMO — bukan tanda tangan elektronik resmi dan tidak berkekuatan hukum"**; judul "Tanda Tangan Elektronik (TTE)"; isi: penandatangan (contoh) + waktu (contoh) + kode verifikasi (contoh); catatan: "TTE resmi diterbitkan penyelenggara tersertifikasi (mis. BSrE) — aplikasi ini belum terintegrasi. Blok ini hanya contoh tampilan."
- Penandatangan dari kop surat (`loadLetterhead()`); kosong = **"—"** (tidak mengarang). Waktu contoh **tetap** "01 Jan 2026 00:00 (CONTOH)"; kode contoh **tetap** "CONTOH-XXXX-0000" — bukan data asli, bukan hasil verifikasi.
- **TIDAK ada integrasi ke penyelenggara TTE sungguhan** (BSrE/dll.), **TIDAK ada klaim keabsahan hukum**. Blok ini juga **TIDAK masuk ke ekspor .docx** laporan bulanan (dokumen asli tidak boleh membawa kode contoh).

### f. Perbaikan ikut — linimasa pengaduan menampilkan status saat ini

- `aduTimeline()` (`src/pengaduan.ts`) dulu hanya menampilkan langkah dari `createdAt` + `riwayat`: tiket contoh berstatus Diproses tanpa riwayat hanya menampilkan "Baru", padahal pill-nya "Diproses" (ketahuan saat memeriksa screenshot lacak).
- Kini: status saat ini **selalu** ditambahkan sebagai langkah terakhir; bila tanggal perubahannya tidak tercatat, `at = null` — **bukan tanggal karangan** — dan perender menampilkannya tanpa tanggal (di kartu lacak maupun di dialog detail pengaduan).

### g. i18n + Anin

- Kunci baru: `lacakTitle/Hint/Label/Ph/Btn/NotFound/NeedInput/AduanKind/AgendaKind/Timeline/Perihal/Pihak/Tanggal/JenisSurat`, `radarTitle/Hint/Empty/Overdue/Soon/Due/DaysLeft/DaysOverdue/Waiting`, `statTitle/Hint/Letters/Agenda/Ikm/IkmNone/AduSelesai/OpenIkm`, `qaMic`, `qaMicListening`, `tteDemoTitle/Label/Signer/Time/Code/Note`, `aduSavedTicket`; `aninFaqSuara` diperbarui (menyebut mikrofon Tanya Prosedur); kunci baru `aninFaqLacak`, `aninFaqRadar`, `aninFaqStatistik`, `aninFaqTte`.
- Anin: 4 entri KB baru di `src/anin-kb.ts` — `lacak-surat`, `radar-tenggat`, `statistik-warga`, `tte-demo`. Entri `lacak-surat` diletakkan **SEBELUM** `pengaduan-selesai` supaya pertanyaan "lacak pengaduan" yang imbang skornya dijawab pelacak status, bukan alur penyelesaian.
- Catatan arsitektur: FAQ fitur hidup di **KB Anin** (`anin-kb.ts`, dipakai chat Anin), BUKAN di panduan prosedur Tanya Prosedur (`kb.ts` — KTP/KK/SKTM). Karena itu `#kb-list` tetap 16 entri (lihat §4).

### h. CSS

- `.bento-lacak .field`, `.lacak-result/head/dl/tl-title/timeline`, `.radar-group-title`, `#home-radar-groups .notif-item` (klik), `.stat-rows/.stat-row`, `.tte-demo/title/label/row/note` (blok bergaris putus-putus), `#qa-mic.listening` + `@keyframes mic-pulse`.

## 3. File yang diubah

- `index.html` — 3 kartu Beranda baru (lacak / radar / statistik) + tombol `#qa-mic` di Tanya Prosedur.
- `src/main.ts` — `findTrackable()`, `renderTrackResult()`, `renderRadar()`, `renderStatistik()`, `renderTteDemoBlock()` + wiring di `renderHome()`/`initHome()`; TTE demo di `renderLetterSheet()`, `renderArchiveSheet()`, `printMonthlyReport()`; pesan tiket di simpan pengaduan; mikrofon + auto-bacakan jawaban di `initQa()`; `aduTimeline` null-safe di dialog detail.
- `src/pengaduan.ts` — tiket `ADU-2026-0001..0006` di `ADUAN_SEED`; `aduTimeline()` selalu menampilkan status saat ini (`at: number | null`).
- `src/anin-pengingat.ts` — kolom baru `dueAt` di `Reminder` (4 situs push).
- `src/i18n.ts` — kunci baru (lihat §2g).
- `src/anin-kb.ts` — 4 entri KB baru + `aninFaqSuara` diperbarui.
- `src/styles.css` — gaya Paket 46 (lihat §2h).
- `scripts/headless-test.mjs` — 11 cek Paket 46 baru (lihat §4); hitungan kartu Beranda 11 → 14.
- `scripts/screenshot-p46.mjs` — baru (5 fitur × 390px/980px × light/dark).
- `PAKET-46-LAPORAN.md` — laporan ini.

Tidak ikut commit: `PAKET-32/33/34-RENCANA.md`, `VIDEO-BARU-RENCANA.md`, `show-20261127/` (sudah ada sebelumnya, tidak disentuh). `node_modules/` tidak di-commit.

## 4. Verifikasi

| Tes | Hasil |
|---|---|
| `npm run build` | Lolos (tsc + vite; bundle JS 1.332,19 kB / gzip 351,88 kB — peringatan chunk-size Vite, bukan error) |
| `npm run test:headless` | **437/437 lolos** (426 lama + 11 baru) |
| `npm run test:pwa` | **16/16** |
| `npm run check:secrets` | Bersih |

Cek headless baru (semua lolos):

1. "Paket 46: lacak nomor ada → status + linimasa tampil" — `ADU-2026-0003` → pill "In progress", linimasa **2 langkah** (Baru 15 Nov + Diproses tanpa tanggal).
2. "Paket 46: lacak nomor tidak ada → pesan jujur, tanpa data pribadi" — `ADU-2026-9999` → "Number not found…", hasil kosong.
3. "Paket 46: lacak nomor surat agenda → status tampil" — `470/12/DS-KTS/XI/2026` → "Mail register entry" + nomornya.
4. "Paket 46: radar tenggat — badge = jumlah baris, atau empty state jujur" — badge `7` = 7 baris.
5. "Paket 46: statistik warga tampil 4 baris dari data nyata, tanpa skor IKM" — 4 baris, tidak ada angka desimal skor (`/\d+,\d+/` tidak cocok), ada label sumber.
6. "Paket 46: blok TTE demo berlabel CONTOH DEMO di lembar surat" — blok ada + **terlihat** + label demo + "CONTOH-XXXX-0000".
7. "Paket 46: Anin Suara — tombol mikrofon ada + fallback jujur bila API tidak tersedia" — `#qa-mic` ada; klik → "The microphone couldn't be used (not-allowed) — please type your question instead." (Chromium headless menolak mikrofon).
8. "Paket 46: Anin menjawab FAQ lacak surat dari KB Anin" — "Bagaimana cara melacak status surat saya?" → jawaban memuat "Lacak Status Surat" + "ADU-2026-0001".
9. "Paket 46: Anin menjawab FAQ radar tenggat dari KB Anin" — "Surat apa yang jatuh temponya sudah dekat?" → "Radar Tenggat" + "3 hari".
10. "Paket 46: Anin menjawab FAQ statistik warga dari KB Anin" — "Di mana saya bisa melihat statistik kecamatan?" → "Statistik Kecamatan" + "data aplikasi DesaAI".
11. "Paket 46: Anin menjawab FAQ TTE demo dari KB Anin" — "Apa itu tanda tangan elektronik?" → "CONTOH DEMO" + "bukan tanda tangan elektronik resmi".

Cek lama yang diperbarui (bukan regresi — jumlah kartu berubah): "bento shows 14 cards…" (11 → 14), "every Beranda card has a collapse button (14 of 14)", "Paket 44: … 14 cards stay". Semua cek lama lain lolos tanpa perubahan.

Kegagalan selama pengerjaan (bukan regresi) dan perbaikannya:

- **Run 1 — 431/434, 3 gagal.** (a) "offline procedure guide renders — 16 entries": saya kira KB Anin menambah `#kb-list` — ternyata `#kb-list` merender panduan prosedur `kb.ts` (16 entri), sedangkan FAQ fitur hidup di `anin-kb.ts` (chat Anin). Cek dikembalikan ke 16; FAQ diuji lewat chat Anin (cek 8–11). (b) Mic: regex saya "could not be used", pesan sebenarnya "couldn't be used" — regex diperbaiki. (c) FAQ lacak di Tanya Prosedur tidak cocok — Tanya Prosedur memakai `kb.ts`, bukan KB Anin — dipindah ke chat Anin.
- **Run 2 — 435/437, 2 gagal.** (a) Radar: kata "tenggat" di pertanyaan memicu ringkasan Pengingat (`REMINDERS_RE`, langkah 2 — sebelum KB Anin, langkah 6), bukan FAQ. Pertanyaan diubah ke frasa "jatuh tempo" yang hanya cocok di kata kunci entri radar. (b) Statistik: kata "warga" saja sudah seri skor dengan entri Mode Warga yang lebih dulu di KB. Pertanyaan diubah tanpa kata "warga".
- **Run 3 — 437/437 lolos.**
- **Linimasa lacak tidak konsisten** (ketahuan dari screenshot, bukan dari tes): pill "Diproses" tapi linimasa hanya "Baru" — diperbaiki lewat §2f; cek 1 diperkuat ke tepat 2 langkah; run 4 tetap **437/437**.
- **Screenshot TTE gagal pertama** ("Node is either not visible"): `#letter-sheet` ada di dalam `#letter-output-wrap` yang `hidden` sampai draf dibuat — skrip screenshot + cek headless kini mengklik "Buat draf" dulu (fallback offline di headless) dan cek 6 menegaskan bloknya **terlihat**, bukan sekadar ada.

Screenshot (`screenshots/p46-*`, 20 file: 5 fitur × 390px/980px × light/dark) — diperiksa visual:

- `p46-lacak-390-light`: "Complaint ADU-2026-0003", pill "In progress", "Letter service: surat-dinas", "Complaint: Pelayanan kurang ramah", "Letter date: 15 Nov 2026", linimasa "1. New — 15 Nov 2026 / 2. In progress".
- `p46-radar-390-light` + `980-light`: badge 7; kelompok "Past deadline" — 2 agenda ("Undangan sosialisasi BOS 2026 — Due 19 Nov 2026 · 9 day(s) overdue", "Permohonan rekomendasi bantuan sosial — Due 20 Nov 2026 · 8 day(s) overdue") + 5 pengaduan ("Due 17–22 Nov 2026 · 8–13 day(s) waiting (3-day limit)").
- `p46-statistik-390-light`: "Letters saved this month 0", "Mail register this month: Incoming 2 · Outgoing 2", "IKM respondents this month: 12 respondents", "Complaints resolved (total): 1 / 6", tombol "See IKM details" — tanpa angka skor.
- `p46-tte-390-light`: blok bergaris putus-putus — "DEMO EXAMPLE — NOT AN OFFICIAL ELECTRONIC SIGNATURE AND NOT LEGALLY BINDING", "Signer (example): —", "Time (example): 01 Jan 2026 00:00 (CONTOH)", "Verification code (example): CONTOH-XXXX-0000", catatan BSrE.
- `p46-anin-suara-390-light`: tombol "🎤 Ask by voice" di samping "✨ Ask" + pesan jujur "The microphone couldn't be used (not-allowed) — please type your question instead."
- Dark (390 + 980): semua teks terbaca, kontras aman; FAB "Ask Anin" kadang menutupi ujung baris radar paling bawah di 390px — itu perilaku FAB yang sudah ada di seluruh aplikasi, bukan cacat Paket 46.

## 5. Commit

- Pesan: `Paket 46: lacak surat + Anin Suara + radar tenggat + statistik warga + TTE demo` (satu commit, sesuai perintah; di atas `364af23`).
- Isi: `index.html`, `src/main.ts`, `src/pengaduan.ts`, `src/anin-pengingat.ts`, `src/i18n.ts`, `src/anin-kb.ts`, `src/styles.css`, `scripts/headless-test.mjs`, `scripts/screenshot-p46.mjs`, `screenshots/p46-*.png`, `PAKET-46-LAPORAN.md`.

## 6. Catatan jujur

- **Bahasa default screenshot/headless di awal suite adalah Inggris** (toggle ke Indonesia terjadi belakangan di suite) — karena itu screenshot Paket 46 berlabel Inggris; perilaku bahasa aplikasi sendiri tidak berubah (cek bahasa lolos semua).
- **Radar menampilkan 7 item yang semuanya sudah lewat tenggat** (data contoh November 2026). Itu data nyata aplikasi — tanggal-tanggal contoh memang sudah lewat pada 28 Nov. Begitu data contoh diganti data kantor yang berjalan, radar mengikuti tanggal sebenarnya. Bila Bos ingin radar terlihat "tenang" di demo, data contoh agenda/pengaduan perlu tanggal yang lebih segar — itu keputusan data, bukan bug.
- **Anin Suara belum diuji dengan mikrofon sungguhan** — VM ini tanpa mikrofon; yang teruji: tombol ada, klik memicu `SpeechRecognition` (ada di Chromium sebagai `webkitSpeechRecognition`), penolakan izin menghasilkan pesan jujur. Di HP Bos, browser akan meminta izin mikrofon dulu; bila ditolak, pesan yang sama tampil. Pembuktian dengar + bacakan sungguhan tetap di perangkat nyata.
- **Entri KB radar-tenggat hampir tidak terjangkau lewat kata "tenggat"/"deadline" di chat Anin** — `REMINDERS_RE` (langkah 2) selalu menang dan menjawab dengan ringkasan pengingat langsung. Itu perilaku yang benar (ringkasan itu jawaban langsungnya); entri KB terjangkau lewat frasa "jatuh tempo" / "batas waktu surat" / "surat hampir telat". Bila suatu hari Bos ingin FAQ radar yang selalu menang, urutan routing di `anin-chat.ts` perlu diubah — sengaja tidak diubah di paket ini.
- **Blok TTE demo TIDAK masuk ke ekspor .docx** laporan bulanan (sengaja — dokumen asli tidak boleh membawa kode contoh). Di cetak/PDF laporan, blok demo tampil dengan labelnya.
- **Bundle naik sedikit** dari Paket 45 (JS 1.317,20 kB → 1.332,19 kB; gzip 347,58 → 351,88 kB) — Vite memberi peringatan chunk-size, bukan error.

## 7. Addendum deploy

*(KOSONG — belum deploy. Menunggu Gas Bos.)*
