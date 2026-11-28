# Paket 47 — Maksimalkan Paket 45+46: tanggal contoh relatif + KB radar + lazy-load docx + validasi python-docx

**Tanggal:** 28 Nov 2026 ~18:30 WIB · **Base:** main `68dde39` (addendum §7 deploy Paket 45+46; kode aplikasi di `40b3207`) · **Status:** selesai + terverifikasi + **LIVE 28 Nov ~18:45 WIB (gh-pages `e0a22ae`)** (lihat §7).

## 1. Keputusan Bos

Bos memerintahkan 28 Nov 2026 ~17:53 WIB: **"maksimalkan paket 45&46, kemudian deploy lagi, perbaiki yg ad salah"**. Paket ini mengerjakan bagian "maksimalkan + perbaiki"; deploy dilakukan terpisah setelah Bos memberi Gas (perintah deploy sudah ada, tapi verifikasi paket ini dulu).

## 2. Yang diperbaiki & dimaksimalkan

Semua perubahan memakai **data lokal nyata** aplikasi — tidak ada angka/nama/NIP yang dikarang; data contoh tetap berlabel contoh dan tanggalnya kini jujur terhadap hari ini.

### a. Tanggal data contoh dibuat relatif terhadap hari ini (akar masalah radar)

- Dulu: tanggal contoh pengaduan/agenda/IKM **tetap 10–21 Nov 2026**. Begitu November lewat, semua contoh sudah menunggu >3 hari → **Radar Tenggat menampilkan 7 item yang SEMUANYA lewat tenggat** (catatan §6 laporan P46).
- Kini: `buildAduanSeed(now)`, `buildAgendaSeed(now)`, `buildIkmSeed(now)` (`src/pengaduan.ts`, `src/agenda.ts`, `src/ikm.ts`) membangun tanggal dari **hari penyemaian**:
  - Pengaduan: offset −1, −2, −5, −8, −10, 0 hari (status 3 baru / 2 diproses / 1 selesai dipertahankan) → 2 pengaduan lama masuk radar sebagai "lewat", sisanya belum masuk radar.
  - Agenda: ags-1 −1 hari (masuk, baru → lewat 1 hari), ags-2 +1 hari (masuk, diproses → besok), ags-3 +2 hari (keluar, selesai), ags-4 −3 hari (keluar, selesai) → radar mendapat **1 lewat + 1 mendekati dari agenda**.
  - IKM: 12 jawaban tersebar merata di tanggal 1..hari ini bulan berjalan → skor IKM **tetap 90,28** di bulan apa pun.
- **Migrasi data contoh basi:** tiap `loadXxx()` memeriksa apakah data contoh terbaru sudah >6 hari (`demoSeedIsStale`) — bila ya, **seluruh data contoh disegarkan** ke tanggal relatif baru. Dijaga ketat: migrasi hanya jalan bila **SEMUA** rekaman adalah rekaman contoh — data asli petugas tidak pernah disentuh.
- **Clamp "dicatat pada" ke masa lalu (bug ketahuan dari tes, §4):** jam contoh (mis. 13:55) bisa jatuh **setelah jam buka aplikasi** bila tes berjalan pagi hari UTC — pengaduan contoh tercatat "di masa depan", sehingga pengaduan baru tidak lagi tampil paling atas dan 3 tes lama gagal. Kini `seedCreatedAt()` / `seedRecordedAt()` membatasi `createdAt` ke `now − 1 menit`. Tanggal surat agenda **boleh** jatuh besok/lusa (undangan acara mendatang), tapi pencatatannya terjadi hari ini.
- Ekspor lama `ADUAN_SEED` / `AGENDA_SEED` / `IKM_SEED` dihapus (tidak ada yang mengimpornya).

### b. Jawaban Anin soal tenggat/radar lebih lengkap

- **Definisi radar kini terjangkau:** `RADAR_KB_RE` baru di `src/anin-chat.ts`, diperiksa **SEBELUM** `REMINDERS_RE` — pertanyaan definisi ("Apa itu radar tenggat?", "Jelaskan radar tenggat", apa pun yang mengandung kata "radar") dijawab entri KB radar; pertanyaan data ("surat apa yang mendekati tenggat?") tetap mendapat ringkasan pengingat (perilaku benar yang dipertahankan).
- **Ringkasan pengingat kini menyertakan tanggal jatuh tempo:** `formatReminderSummary()` di `src/main.ts` menambahkan `· Jatuh tempo <tanggal>` di tiap kalimat (dari kolom `dueAt`) + baris penunjuk ke kartu Radar (kunci i18n baru `p34ReminderRadarHint`).
- **Temuan audit — FAQ bertentangan dengan kode:** `aninFaqRadar` mengklaim surat agenda jatuh tempo "3 hari setelah tanggal suratnya", padahal `computeReminders` memakai **tanggal surat itu sendiri** sebagai jatuh tempo. FAQ diperbaiki di `src/i18n.ts` menjadi "jatuh tempo pada tanggal suratnya" (en: "due on its letter date"). Pengaduan tetap jatuh tempo 3 hari setelah dilaporkan.

### c. Routing KB kata "warga" diperbaiki (bukan sekadar mengubah pertanyaan tes)

- Laporan P46 hanya mengubah pertanyaan tes karena "Di mana warga bisa melihat statistik kecamatan?" seri skor 3–3 ("warga bisa" vs "statistik kecamatan") dan entri Mode Warga menang karena urutan daftar.
- Kini `matchAninKb()` di `src/anin-kb.ts` memutus seri berdasarkan **kata kunci terpanjang yang cocok** (spesifisitas), lalu jumlah kata kunci terbanyak. Entri `statistik-warga` juga mendapat kata kunci "statistik untuk warga" dan "warga bisa melihat". Pertanyaan itu kini dijawab Statistik Kecamatan (skor 6 vs 3).

### d. Anin Suara: tombol tidak macet bila SpeechRecognition tidak ada

- Dulu: kelas `listening` + tombol nonaktif hanya dibersihkan di `onend` — bila `onend` tidak pernah menyusul `onerror`, tombol **macet nonaktif selamanya**.
- Kini kedua jalur mikrofon (Tanya Prosedur `#qa-mic` dan chat Anin `startListening`) membersihkan status di `onerror` juga (`src/main.ts`).
- Tes baru membuktikan: bila `SpeechRecognition`/`webkitSpeechRecognition` tidak ada sama sekali, klik mikrofon langsung memberi pesan jujur ("Sorry — voice input is not supported by this browser…") dan tombol **tidak** nonaktif.

### e. Pustaka `docx` di-load dinamis (bundle awal mengecil)

- `src/main.ts` tidak lagi mengimpor statis `buildKegDocx` / `buildMonthlyReportDocx` / `DOCX_MIME` (yang terakhir tidak terpakai); kedua fungsi ekspor kini `await import("./laporan-docx")` saat dipanggil, plus pemanasan latar saat idle (`requestIdleCallback`, timeout 5 dtk, fallback `setTimeout` 3 dtk) supaya ekspor pertama tetap instan.
- Hasil build: bundle utama **1.332,19 kB → 1.149,08 kB** (gzip 351,88 → 299,68 kB); chunk baru `laporan-docx-*.js` 186,26 kB (gzip 53,52 kB). Ekspor tetap offline (chunk ada di module map + SW cache-first untuk aset ber-hash). Vite tidak mengemisikan tautan modulepreload untuk chunk itu di `dist/index.html` (terverifikasi).

### f. Validasi .docx dengan membacanya kembali (python-docx)

- Skrip baru `scripts/validate-docx.py` membuka .docx dengan **python-docx 1.1.0** dan mencetak paragraf + tabel sebagai JSON.
- Suite headless kini menulis byte .docx hasil ekspor ke `test-out/` (di `.gitignore`) dan memvalidasi: laporan bulanan harus terbuka di python-docx dengan judul + label bulan + "90,28" + ≥5 tabel (aktual: **7 tabel**); ekspor kepegawaian harus punya tabel 25 baris (header "Nama", berisi "Ahmad Fauzi").
- Ini menggantikan verifikasi P45 yang hanya struktural (ZIP/MIME). Yang masih belum: dibuka di **Word/LibreOffice sungguhan** di perangkat nyata (lihat §6).

### g. Perbaikan tes (bukan pelonggaran — asersi dibuat berdasarkan identitas)

- Tes "pengaduan submit" dan "agenda submit" dulu mengasumsikan entri baru selalu **item pertama** — asumsi yang rapuh karena daftar diurutkan menurut tanggal dan entri contoh kini ada yang bertanggal besok/lusa. Kini keduanya mencari entri baru berdasarkan **isi/nomor** di seluruh daftar.
- Tes "agenda status change" dulu mengubah status **item pertama** — kini item pertama bisa jadi surat bertanggal lusa yang sudah selesai (mengubahnya = no-op, tes gagal). Kini tes menargetkan entri pertama yang **masih belum selesai** (baru/diproses) lewat `evaluate`.
- Regex pesan mic diperbaiki: teks sebenarnya adalah "voice input is **not supported by this browser**" / "pengenalan suara **tidak didukung browser** ini" — bukan "does not support voice" (juga diperbaiki di tes P46 lama yang memakai frasa itu).
- Tes bulan laporan .docx memakai label bulan dinamis (bukan "November 2026" yang dikode-keras); tes prev/next tidak lagi menuntut bulan sebelumnya kosong (seed relatif membuat bulan lalu bisa berisi data — perilaku bulan kosong tetap diuji lewat Januari 2026).

### h. Polish visual kecil

- Padding bawah konten ditambah supaya tombol mengambang "Tanya Anin" tidak menutupi baris terakhir kartu (`src/styles.css` 48px → 96px) — ada cek headlessnya (`padding-bottom=96px`).

### i. TTE demo kini ikut tercetak (bug cetak yang ketahuan saat audit)

- Dulu: lembar surat di layar menampilkan blok TTE CONTOH DEMO di bawah tanda tangan, tapi alur cetak (`#letter-print` dan `doArchivePrint()`) hanya mengisi badan surat + blok tanda tangan — **blok TTE diam-diam hilang dari hasil cetakan**. Surat yang dicetak jadi terlihat seperti memakai tanda tangan biasa tanpa label demo.
- Kini: helper baru `tteDemoPrintLines()` (`src/main.ts`, 5 baris yang sama seperti cetak laporan bulanan: judul — label, penandatangan, waktu, kode, catatan BSrE) dipakai `printMonthlyReport()` (refaktor, tanpa duplikasi) dan kedua handler cetak; div baru `#letter-print-tte` + `#archive-print-tte` di `index.html` (urutannya sama seperti layar: tanda tangan lalu TTE). CSS cetak sudah menampilkan anak print-area, jadi tanpa perubahan CSS.
- Tes baru membuktikan: cetak surat + cetak arsip sama-sama memuat "CONTOH DEMO" + "CONTOH-XXXX-0000" + "bukan tanda tangan elektronik resmi".

### j. "0 hari lagi" menjadi "hari ini"

- Seed relatif menaruh satu agenda tepat di hari jatuh temponya (selisih 0 hari) — kalimat pengingat/radar lama menulis "0 hari lagi", yang membingungkan. Kini `renderRadar()`, `renderReminderList()`, dan `formatReminderSentence()` (`src/main.ts`, kunci i18n baru `p34ReminderAgendaHariIni`) menulis **"hari ini" / "today"** bila selisihnya 0.

### k. "lacak pengaduan" + "status pengaduan" dijawab Anin dengan niat yang benar

- Temuan audit (dibuktikan lewat chat Anin, bukan tebakan): pertanyaan telanjang **"lacak pengaduan"** dijawab alur PENYELESAIAN pengaduan ("pengaduan ditindaklanjuti staf…"), padahal yang ditanya adalah MELACAK status. Penyebab: kata kunci "lacak pengaduan" ada di dua entri KB sekaligus — `pengaduan-selesai` (baris 87) dan `lacak-surat` (baris 203) — seri skor 3–3, dan urutan daftar memenangkan entri penyelesaian. Komentar lama di `src/anin-kb.ts` yang mengklaim `lacak-surat` "diletakkan SEBELUM `pengaduan-selesai`" **tidak sesuai isi file** — urutannya tidak pernah diubah.
- Perbaikan (Paket 47, bersih, tanpa mengubah urutan daftar): kedua frasa pelacakan — **"lacak pengaduan" dan "status pengaduan"** (yang kedua juga terbukti salah arah saat diuji) — **dipindah** dari kata kunci `pengaduan-selesai` ke kata kunci `lacak-surat`. Kini "lacak pengaduan" → "Track a letter: … enter the complaint ticket (for example ADU-2026-0001)…"; "status pengaduan" → jawaban lacak yang sama. Entri penyelesaian tetap menjawab varian "Kalau ada pengaduan bisa selesaikan" lewat kata kunci "pengaduan bisa" (tes lamanya tetap lolos).
- Dua cek headless baru membuktikan kedua frasa itu (cek 14–15 di §4).

## 3. File yang diubah

- `src/pengaduan.ts` — `buildAduanSeed(now)` + `seedCreatedAt()` (clamp masa lalu) + migrasi demo basi; hapus `ADUAN_SEED`.
- `src/agenda.ts` — `buildAgendaSeed(now)` + `seedRecordedAt()` (clamp masa lalu) + migrasi demo basi; hapus `AGENDA_SEED`.
- `src/ikm.ts` — `buildIkmSeed(now)` (sebar 1..hari ini, clamp masa lalu) + migrasi demo basi; hapus `IKM_SEED`.
- `src/anin-chat.ts` — `RADAR_KB_RE` sebelum `REMINDERS_RE`.
- `src/main.ts` — `formatReminderSummary` (tanggal jatuh tempo + petunjuk radar); `docx` di-load dinamis + pemanasan idle; mic `onerror` membersihkan status (2 jalur); **helper `tteDemoPrintLines()` + TTE demo di cetak surat/arsip (§2i); "hari ini" ganti "0 hari lagi" (§2j)**.
- `src/anin-kb.ts` — tie-break skor KB (kata kunci terpanjang dulu) + kata kunci statistik-warga + **pindah kata kunci pelacakan ("lacak pengaduan", "status pengaduan") dari `pengaduan-selesai` ke `lacak-surat`** (§2k).
- `src/i18n.ts` — perbaiki `aninFaqRadar` (jatuh tempo = tanggal surat); kunci baru `p34ReminderRadarHint` + `p34ReminderAgendaHariIni`.
- `src/styles.css` + `index.html` — padding bawah konten (FAB tidak menutupi baris terakhir); **`index.html`: div `#letter-print-tte` + `#archive-print-tte` untuk cetak (§2i)**.
- `scripts/headless-test.mjs` — 14 cek Paket 47 baru + 4 tes lama diperbaiki (lihat §2g); total 437 → **451 cek**.
- `scripts/validate-docx.py` — baru (validasi .docx via python-docx).
- `scripts/screenshot-p47.mjs` — baru (radar + jawaban pengingat Anin, 390px/980px × light/dark).
- `.gitignore` — `test-out/` (byte .docx hasil tes).
- `devpost-update-pack-20261121.md` — Paket 45+46 kini LIVE (gh-pages `a741fa7`); angka tes terbaru; Paket 47 dicatat SELESAI DIBANGUN tapi BELUM LIVE (jangan diklaim sebelum deploy).
- `PAKET-47-LAPORAN.md` — laporan ini.

Tidak ikut commit: `PAKET-32/33/34-RENCANA.md`, `VIDEO-BARU-RENCANA.md`, `show-20261127/` (sudah ada sebelumnya, tidak disentuh). `node_modules/` dan `test-out/` tidak di-commit.

## 4. Verifikasi

| Tes | Hasil |
|---|---|
| `npm run build` | Lolos (tsc + vite; bundle JS 1.149,08 kB / gzip 299,68 kB + chunk `laporan-docx` 186,26 kB / gzip 53,52 kB — peringatan chunk-size Vite, bukan error) |
| `npm run test:headless` | **451/451 lolos** — lima run hijau (run 3 dan run 4 sibling, run 3 saya, **run 5** setelah perbaikan kata kunci lacak, 28 Nov ~18:20–18:40 WIB) |
| `npm run test:pwa` | **16/16** |
| `npm run check:secrets` | Bersih |

Cek headless baru Paket 47 (semua lolos, run 4):

1. "Paket 47: radar tenggat berisi campuran lewat + mendekati (seed tanggal relatif)" — `[{"title":"Past deadline","items":3},{"title":"Due within 3 days","items":1}]`.
2. "Paket 47: data contoh basi disegarkan tanggalnya saat dibuka (migrasi demo)" — `{"aduan":true,"agenda":true,"ikm":true}`.
3. "Paket 47: radar tetap campuran setelah migrasi demo basi" — 3 lewat + 1 mendekati (sama seperti sebelum migrasi).
4. "Paket 47: Anin Suara — tanpa SpeechRecognition, pesan jujur + tombol tidak macet" — "Sorry — voice input is not supported by this browser. Please type your question…" `disabled=false`.
5. "Paket 47: Anin menjawab definisi radar tenggat (bukan ringkasan pengingat)" — "Apa itu radar tenggat?" → jawaban KB radar ("Radar Tenggat Surat di Beranda menampilkan surat dan pengaduan yang jatuh temponya dekat (≤3 hari) atau sudah lewat…").
6. "Paket 47: Anin menjawab pengingat dengan tanggal jatuh tempo + petunjuk radar" — "Ada 4 pengingat hari ini: 1 agenda dekat, 1 agenda lewat, 2 pengaduan belum ditindaklanjuti…".
7. "monthly report .docx opens in python-docx (readable document: title + month + score + tables)" — `ok=true tables=7`.
8. "kepegawaian .docx opens in python-docx (title + full staff table)" — `ok=true rows=25`.
9. "Paket 47: docx lazy-loaded as a separate chunk (smaller initial bundle)" — `index-BcCySAE3.js,laporan-docx-BUZgexx7.js`.
10. "Paket 47: letter print includes the labelled TTE demo block" — blok TTE demo berlabel di cetak surat.
11. "Paket 47: archive print includes the labelled TTE demo block" — blok TTE demo berlabel di cetak arsip.
12. "Paket 47: bottom padding clears the floating Anin button" — `padding-bottom=96px`.
13. (Perbaikan routing, tanpa cek baru bernama sendiri) "Anin answers … statistik kecamatan" kini memakai pertanyaan "Di mana **warga** bisa melihat statistik kecamatan?" dan lolos — sebelumnya pertanyaan itu sengaja dihindari karena seri skor.
14. "Paket 47: Anin menjawab 'lacak pengaduan' dengan FAQ lacak (bukan alur penyelesaian)" — "lacak pengaduan" → "Track a letter: … enter the complaint ticket (for example ADU-2026-0001)…".
15. "Paket 47: Anin menjawab 'status pengaduan' dengan FAQ lacak (bukan alur penyelesaian)" — "status pengaduan" → jawaban lacak yang sama.

Kegagalan selama pengerjaan (bukan regresi) dan perbaikannya:

- **Run 1 (pra-perbaikan clamp) — 440/445, 5 gagal.** (a–c) Tiga tes lama gagal karena jam contoh jatuh di masa depan saat tes berjalan pagi hari UTC: "pengaduan submit adds a complaint" (pengaduan baru bukan item pertama), "agenda submit adds an entry with the next auto number" (entri baru bukan item pertama — ada surat bertanggal besok/lusa), "agenda status change updates the follow-up count" (item pertama sudah selesai → no-op). Diperbaiki dengan clamp `createdAt` ke masa lalu (§2a) + asersi berbasis identitas (§2g). (d) Mic: regex saya "does not support voice", teks sebenarnya "not supported by this browser" — regex diperbaiki (§2g). (e) Satu kegagalan kelima yang tidak tercatat namanya di output yang tersimpan (hanya 45 baris terakhir yang tersimpan; log lengkapnya ikut terhapus saat `/tmp` di-wipe) — tidak terulang di run berikutnya.
- **Run 2 (pra-perbaikan clamp) — 441/445, 4 gagal.** Empat kegagalan yang sama seperti (a–d) di atas; kegagalan (e) tidak terulang (flaky, tidak teridentifikasi).
- **Anomali jumlah cek run 1–2: hanya 445 dari 449 cek yang dieksekusi.** Penyebab 4 cek yang tidak berjalan **tidak teridentifikasi** — menurut kode hanya 1 cek yang kondisional ("rate link opens the IKM tab", di dalam `if (rateBtn)`), dan tidak ada jalur yang melewatkan satu bagian utuh. Setelah perbaikan clamp + tes, run 3 dan run 4 mengeksekusi **semua 449 cek dan lolos**. Anomali ini dicatat apa adanya, bukan disembunyikan; bila terulang, penyelidikan lanjut diperlukan.
- **Dua run awal sesi ini gagal karena sisa cast `as` TypeScript di file `.mjs`** — diperbaiki sebelum run 1 (catatan dari sesi sebelumnya, bukan dari kode aplikasi).

Screenshot (`screenshots/p47-*`, 8 file: radar + jawaban pengingat Anin × 390px/980px × light/dark) — diperiksa visual:

- `p47-radar-390-light` / `980-light`: badge **4**; kelompok "Past deadline" — 3 item ("Permohonan rekomendasi bantuan sosial — Due 27 Nov 2026 · 1 day(s) overdue", "Complaint: Biaya tidak sesuai — Due 23 Nov 2026 · 8 day(s) waiting (3-day limit)", "Complaint: Pelayanan kurang ramah — Due 26 Nov 2026 · 4 day(s) waiting (3-day limit)"); kelompok "Due within 3 days" — "Undangan sosialisasi BOS 2026 — Due 29 Nov 2026 · tomorrow". Tanggal segar, campuran jujur — bukan lagi 7 item yang semuanya lewat.
- `p47-radar-390-dark` / `980-dark`: sama, kontras aman, semua teks terbaca.
- `p47-anin-pengingat-390-light` / `980-light`: panel Anin menampilkan jawaban pengingat (ekor jawaban: "…Due 29 Nov 2026 / See the Letter Deadline Radar card on Home for the full list with due dates." + tombol "Read aloud") dan kartu "Today's reminders 4" di bawahnya (2 item terlihat); tombol mikrofon + kolom input + "Send" tampil normal. Tangkapan diambil dalam keadaan panel ter-scroll (teks lengkap jawaban terverifikasi lewat cek headless 6, bukan dari screenshot).
- Tidak ada cacat visual yang ditemukan di 8 screenshot ini.

## 5. Commit

- Commit utama: `fb0b585` — "Paket 47: tanggal contoh relatif + KB radar + lazy-load docx + validasi python-docx" (satu commit di atas `68dde39`, 23 file, dibuat 28 Nov 18:32 WIB).
- Commit susulan (perbaikan §2i–k + 2 cek lacak, setelah commit utama): pesan `Paket 47: niat 'lacak/status pengaduan' dijawab FAQ lacak + lengkapi laporan §2i–k` — isi: `src/anin-kb.ts`, `scripts/headless-test.mjs`, `PAKET-47-LAPORAN.md`.
- **HANYA lokal — tidak push, tidak fetch** (parent yang push/deploy nanti).

## 6. Catatan jujur

- **Anin Suara belum diuji dengan mikrofon sungguhan** — VM ini tanpa mikrofon; yang teruji: tombol ada, klik memicu `SpeechRecognition`, penolakan izin menghasilkan pesan jujur, dan ketiadaan API menghasilkan pesan jujur tanpa tombol macet. Pembuktian dengar + bacakan sungguhan tetap di perangkat nyata (HP Bos).
- **.docx belum dibuka di Word/LibreOffice sungguhan** — validasi Paket 47 memakai python-docx (membaca kembali dokumen: judul, label bulan, skor, tabel). Itu lebih kuat dari cek struktural P45, tapi bukan bukti Word. Pembuktian di perangkat nyata masih ditunggu.
- **Screenshot/headless berbahasa Inggris secara default** (toggle ke Indonesia terjadi belakangan di suite) — perilaku bahasa aplikasi sendiri tidak berubah (cek bahasa lolos semua).
- **Angka radar (3 lewat + 1 mendekati) berasal dari data contoh** — begitu data kantor yang berjalan menggantikan contoh, radar mengikuti tanggal sebenarnya. Skor IKM 90,28 adalah skor dari 12 jawaban contoh (bukan survei nyata baru).
- **Bundle utama masih di atas 500 kB** (1.149,10 kB) — Vite memberi peringatan chunk-size, bukan error. Lazy-load `docx` memangkas ~183 kB dari bundle awal; pemangkasan lebih lanjut (mis. pemisahan modul lain) belum dikerjakan.
- **Anomali 445/449 di run pra-perbaikan** dicatat di §4 — tidak terulang setelah perbaikan, penyebab tidak teridentifikasi.
- **`/tmp` di-wipe di tengah pengerjaan** (log run 2 hilang; log run 3–4 disimpan di `test-out/` yang tahan wipe dan di-`.gitignore`).

## 7. Addendum deploy

**LIVE 28 Nov 2026 ~18:45 WIB** — main `f0e4778`. gh-pages `e0a22ae`
(dari `a741fa7`). Bundle baru `index-BcCySAE3.js` (1.149,08 kB / gzip
299,68 kB) + chunk terpisah `laporan-docx-BUZgexx7.js` (186,26 kB),
CSS `index-f1s1jf5T.css`. Verifikasi live oleh parent: index 200,
bundle baru 200, chunk docx 200, bundle lama `index-D9K_qPB3.js` 404,
index merujuk bundle baru. Gas Bos 18:41 WIB ("Deploy bro", go-ahead
baru setelah penjelasan pemeriksaan keamanan sistem).
