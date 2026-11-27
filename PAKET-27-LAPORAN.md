# Paket 27 — Tiga Saran Juri Kiroween untuk DesaAI

**Tanggal:** 27 November 2026
**Basis:** main `399772f` (Paket 26, kode selesai — belum live)
**Status:** KODE SELESAI — **BELUM LIVE** (deploy ke gh-pages menunggu Gas Bos, seperti Paket 26)
**Tes:** **305/305 hijau** (headless 289/289 + PWA 16/16; 18 cek baru Paket 27 semua hijau)

Paket ini menerapkan tiga saran juri Kiroween dari email Devpost 26 Nov 2026
("How to make your project stand out from the graveyard") sebagai satu paket
yang kohesif — satu fitur konkret per saran, semuanya offline-first, tanpa
dependensi runtime baru, tanpa menyentuh data contoh SIAP AKAD.

---

## 1. Masalah nyata — "Surat Cepat" (saran Vivek Velso, CTO Genari AI)

Vivek mencari sesuatu yang menyelesaikan masalah nyata dan membuat orang
berpikir "ini tidak terbayangkan sebelum ada Kiro". Masalah nyata di kantor
desa: petugas harus mengisi formulir surat satu per satu — nomor, tanggal,
nama, NIK, jabatan, tempat, waktu — padahal permintaannya biasanya datang
sebagai satu kalimat lisan ("tolong buatkan undangan musyawarah hari Jumat
jam 9 di balai desa"). **Surat Cepat** (kotak baru di tab Draf Surat)
menerima satu kalimat itu, menebak templat suratnya, dan mengisi formulir
secara otomatis: undangan (acara, hari + tanggal, waktu, tempat, tujuan),
SK pengangkatan (nama, jabatan, desa, masa bhakti), SKTM (nama, NIK,
penghasilan, keperluan), surat dinas, dan surat keterangan domisili.

Parsernya **100% rule-based dan offline** (pencocokan kata kunci +
regex tanggal/waktu/tempat/nama, tanpa panggilan AI) — jadi tetap bekerja
di kantor desa tanpa internet. Aturan kejujurannya tegas: field yang tidak
dinyatakan jelas di kalimat **dibiarkan kosong, tidak pernah dikarang** —
nama, angka, dan tanggal tidak pernah ditebak. Petugas selalu memeriksa
isian sebelum menekan "Generate draft". Kalau jenis suratnya tidak bisa
ditebak, Anin yang menjawab: pilih templat dulu, lalu isi manual seperti
biasa. Kalimat yang tidak masuk akal juga dijawab jujur ("belum bisa
menebak") — bukan diisi asal-asalan.

## 2. UX playful — "Anin", pemandu DesaAI (saran Floor Mesters, Sr. Manager UX, Kiro)

Floor bilang: *"Scare me, then make it easy"* — antarmuka dengan sedikit
unsur iseng, tapi pengguna tetap tahu tombol berikutnya apa. **Anin** adalah
pemandu ramah DesaAI: karakter petugas desa (SVG murni, tanpa aset
eksternal — wajah tersenyum berpeci/songkok, seragam hijau, memegang
amplop), pantas untuk kantor pemerintahan dan **bukan hantu seram**.
Anin menyapa sesuai waktu ("Selamat pagi! Saya Anin, pemandu DesaAI…")
lalu selalu menunjuk langkah berikutnya yang paling jelas: ada pengaduan
baru → "buka tab Pengaduan, saya tunjukkan yang paling lama"; ada masa
bhakti yang mau habis → ingatkan; belum ada surat hari ini → "coba Surat
Cepat". Di bawahnya ada satu tips harian yang berputar (backup hari Jumat,
bagikan survei IKM, Ctrl+K untuk pencarian, …).

Anin juga menjaga pengguna dari jalan buntu: empty state di tab Draf dan
hasil pencarian Agenda yang kosong membawa baris langkah berikutnya dari
Anin, dan error "formulir masih kosong" saat menekan Generate tanpa isi
langsung menyarankan "tulis satu kalimat di Surat Cepat". Semua teks baru
tersedia dalam Bahasa Indonesia **dan** English (toggle bahasa ikut
mengubah sapaan, tips, dan pesan Anin).

## 3. Hidup lebih lama — "Paket Adopsi Desa Lain" (saran Sameer Ali, coding.kitty)

Sameer paling tertarik pada karya yang hidup lebih lama dari hackathon —
open-source tools dan aplikasi yang membantu komunitas tertentu. DesaAI
memang gratis dan open-source (Apache-2.0), tapi desa lain tidak bisa
memakainya kalau tidak tahu cara memulainya. **Paket Adopsi Desa Lain**
(kartu baru di tab Beranda + bagian baru di README) menutup celah itu:
checklist 5 langkah di dalam aplikasi (isi kop surat → ganti data contoh
dengan data desa sendiri → bagikan survei IKM → catat surat setiap hari →
backup mingguan) plus tombol unduh yang menghasilkan
`desaai-paket-adopsi-YYYY-MM-DD.json` — berisi kop surat kantor, ketujuh
templat surat, dan checklist-nya. **Tidak ada data kantor yang ikut
terunduh** dalam paket itu. README repo kini punya bagian "Adoption in
another village" yang menjelaskan langkah yang sama untuk pengembang yang
menemukan repo ini dari GitHub.

---

## File yang diubah

| File | Perubahan |
|---|---|
| `src/cepat.ts` (baru) | Parser Surat Cepat: `detectCepatTemplate`, `extractCepatFields`, `parseCepat` (skor kata kunci + regex tanggal/waktu/tempat/nama/NIK/penghasilan; tidak pernah mengarang field) |
| `src/anin.ts` (baru) | Karakter Anin (SVG murni) + `aninGreeting`, `aninTip`, `aninTipKey` (salam per waktu + tips kontekstual + tips harian berputar) |
| `src/adopsi.ts` (baru) | `ADOPTION_STEPS`, `buildAdoptionPack` (kop surat + 7 templat + checklist → JSON, tanpa data kantor) |
| `src/main.ts` | Wiring: kartu Anin di Beranda, kotak Surat Cepat di tab surat, baris Anin di empty state draf/agenda + error form kosong, panel adopsi + unduhan JSON; **perbaikan bug boot-race** — `renderLetterFields()` kini mempertahankan nilai yang sudah diisi saat render ulang (lihat bawah) |
| `src/i18n.ts` | Semua string baru Paket 27, id + en |
| `src/styles.css` | `.bento-anin`, `.cepat-box`, `.bento-adopsi`, `.anin-tip-line`; kartu Anin + adopsi disembunyikan di Mode Warga |
| `index.html` | Kartu Anin + kartu adopsi di Beranda, kotak Surat Cepat, `#letter-anin-tip`, `#drafts-empty-anin`, `#agenda-empty-anin` |
| `scripts/headless-test.mjs` | Seksi baru "9c. Paket 27": 18 cek (kartu Anin + tips sesuai state + 2 tombol, Surat Cepat S1/S2/S3/tidak-dikenali/kosong/offline, tips Anin di error Generate, baris Anin di empty state draf + agenda, panel adopsi 5 langkah + isi JSON + unduhan, toggle id untuk Anin + Surat Cepat) + 1 tes regresi boot-race; ekspektasi jumlah kartu bento 14 → 16 |
| `README.md` | Paragraf Surat Cepat (fitur 1), paragraf Anin (fitur 9), fitur baru 10 "Adoption Pack for Other Villages" + bagian "Adoption in another village" |
| `devpost-update-pack-20261121.md` | Entri Paket 26 (kode selesai 303/303, commit 399772f, BELUM LIVE — deploy menunggu Gas Bos) |
| `PAKET-27-LAPORAN.md` (file ini) | Laporan paket |

## Tes

- **Total: 305/305 hijau** — headless 289/289 (287 lama + 18 baru Paket 27,
  termasuk tes regresi boot-race) + PWA 16/16.
- **Tidak ada tes lama yang dihapus.** Satu ekspektasi lama diperbarui
  dengan benar: jumlah kartu bento 14 → 16 (kartu Anin + kartu adopsi).
- **Verifikasi parser di luar browser (Node, `tsc`): 6/6 kasus benar** —
  undangan (5 field tepat), varian undangan berkoma, SK pengangkatan
  (5 field), SKTM (4 field), "surat dinas perihal undangan rapat"
  (benar dikenali surat dinas, bukan undangan), kalimat tidak masuk akal
  → null.
- **Screenshot SVG Anin diperiksa langsung** — wajah ramah berpeci,
  seragam + amplop, tampil rapi di kartu Beranda.
- Tes flaky bawaan "kepegawaian summary renders an offline recap without
  AI" tidak gagal pada run ini.

### Bug yang ditemukan dan diperbaiki saat mengerjakan paket ini

Saat menjalankan suite, cek Surat Cepat gagal secara acak (run 1: S2,
run 2: S1, run 3: S1 dengan **semua field kosong padahal status bilang
"5 fields filled"**). Akar masalahnya adalah bug nyata di aplikasi, bukan
di tes: `boot()` memanggil `applyLang()` **setelah** `await
initFirebase()` + `await probeOnDevice()` yang lambat — dan `applyLang()`
memanggil `renderLetterFields()`, yang membangun ulang semua input surat
dari nol dan **menghapus apa pun yang sudah diisi** (isian Surat Cepat,
prefill "Buat SK", atau ketikan manual) bila boot selesai terlambat.
Perbaikan: `renderLetterFields()` kini menyimpan nilai yang ada sebelum
membangun ulang dan memulihkannya sesudahnya (nilai untuk key yang tidak
ada di templat baru dibuang, seperti seharusnya saat ganti templat).
Tombol "Bersihkan" tetap mengosongkan (memanggil dengan `keepValues =
false`). Tes regresi baru membuktikannya: isi lewat Surat Cepat, toggle
bahasa 2× (yang memaksa render ulang yang sama), nilai tetap utuh.

## Cara Bos mencoba tiap fitur di live site SETELAH deploy

> **Catatan:** Paket 27 belum live. Deploy Paket 26 dulu, lalu Paket 27
> (keduanya menunggu Gas Bos). Setelah live, buka
> https://kuro1996.github.io/desa-ai/ lalu:

1. **Surat Cepat** — buka tab **Draf Surat**, tulis di kotak "Surat
   Cepat" kalimat: `Buatkan undangan musyawarah desa hari Jumat, 20
   November 2026 jam 09.00 WIB di Balai Desa Simpangkatis untuk Ketua
   RT 01 sampai RT 05` lalu tekan tombol isi. Formulir harus terisi
   (Undangan, acara Musyawarah Desa, Jumat 20 November 2026, 09.00
   WIB, Balai Desa Simpangkatis, Ketua RT 01–05). Coba juga kalimat
   yang tidak jelas, misal `tolong buatkan surat` — Anin harus
   menjawab jujur bahwa jenis suratnya belum bisa ditebak.
2. **Anin** — di tab **Beranda**, kartu Anin menyapa sesuai jam dan
   memberi satu langkah berikutnya (misal: ada 3 pengaduan baru →
   tombol "Lihat pengaduan"). Kosongkan pencarian Agenda dengan kata
   yang tidak ada (misal `zzz`) — baris Anin muncul di bawah "tidak
   ditemukan". Tekan "Generate draft" dengan formulir kosong — pesan
   error muncul bersama saran Anin untuk mencoba Surat Cepat.
3. **Paket Adopsi** — di tab **Beranda**, kartu "Paket Adopsi Desa
   Lain" menampilkan 5 langkah; tekan "Unduh paket adopsi" — file
   `desaai-paket-adopsi-YYYY-MM-DD.json` terunduh berisi kop surat,
   7 templat, dan checklist (tanpa data kantor).

## Yang masih butuh keputusan Bos

1. **Gas deploy Paket 26 dulu, lalu Paket 27** — kode Paket 27 sudah
   di main; deploy gh-pages keduanya menunggu aba-aba Bos (prosedur
   deploy yang sama seperti Paket 11–25).
2. **Update Devpost setelah Paket 26 + 27 live** — submission DesaAI
   bisa diedit sampai **1 Des 2026 05:00 WIB**; entri Paket 26 sudah
   disiapkan di `devpost-update-pack-20261121.md` (entri Paket 27
   menyusul setelah live).
3. **Nama karakter "Anin"** — dipilih karena hangat dan umum dipakai di
   kantor desa; kalau Bos mau nama lain (atau tanpa nama), tinggal
   bilang — gantinya satu tempat di `src/anin.ts` + string i18n.
4. **Uji cloud generation + PWA dari HP Bos** — masih belum terbukti
   (tidak berubah oleh paket ini; tetap menunggu tes Bos di live site).
