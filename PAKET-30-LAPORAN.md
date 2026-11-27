# Paket 30 — Laporan

Tanggal: 27 November 2026 (malam)
Permintaan Bos (21:37–21:42 WIB):
1. Bug draf surat: isi surat tidak bisa dibuat dan tidak muncul di draf — perbaiki.
2. Warna beranda: biru, putih, tulisan hitam biar jelas.
3. Tata letak disusun ulang biar rapi, tidak berantakan — berlaku untuk keseluruhan aplikasi.
4. Menu "Kepegawaian & Status (SIAP AKAD)" jadi "Data Kepegawaian", gaya sama dengan menu lain.
5. Judul halaman dicari yang bagus ("Administrasi Kecamatan Simpangkatis"), penjelasan fokus ke tujuan/manfaat (bukan "diadaptasi"), hapus kata "SIAP AKAD" dari semua tulisan yang terlihat.
6. Font dicari yang keren dan bagus, diterapkan ke semua elemen.

## Yang diperbaiki

### 1. Draf surat offline (bug utama)
- Akar masalah: pembuatan surat sepenuhnya bergantung ke AI. Saat panggilan AI gagal (di HP Bos: "Panggilan AI gagal… init ailogic… App Check"), catch hanya menampilkan status error dan `#letter-output` tetap kosong — draf tidak pernah muncul.
- Perbaikan: `buildOfflineLetterBody()` baru di `src/templates.ts` — draf dibuat dari field formulir saja (salam pembuka, perihal/acara, isi pokok verbatim, detail undangan, penutup). Tidak pernah mengarang nama/nomor/tanggal. Dipasang di DUA jalur gagal: blok `catch` DAN early-return saat layanan AI belum siap (`src/main.ts`) — tes pertama gagal 328/329 justru karena jalur early-return ini.
- Status baru: "Panggilan AI gagal — draf dibuat offline dari formulir. Periksa sebelum dipakai."
- Terverifikasi dengan nilai persis formulir Bos: Nomor 140/001/DS/XI/2026, 28 November 2026, Undangan Musyawarah Desa, isi pokok 1–2.

### 2. Surat Cepat tahan typo
- Kalimat Bos "Musyawrah desa…" (typo, hilang 'a') sebelumnya tidak terdeteksi sebagai undangan.
- `src/cepat.ts`: normalisasi typo (musyawrah/musyawara/musawarah → musyawarah, musrenbag → musrenbang, undagan → undangan), bobot musyawarah 2 → 3.
- Terverifikasi: kalimat Bos dikenali sebagai undangan, acara "Musyawarah Desa", hari "28 November 2026", tempat "Halaman Kantor Camat Simpangkatis".
- Template undangan dapat field `agenda` baru (opsional).

### 3. Judul + nama menu
- Menu: "Data Kepegawaian" (id) / "Personnel Data" (en).
- Judul: "Administrasi Kecamatan Simpangkatis" / "Simpangkatis Subdistrict Administration".
- Penjelasan ditulis ulang fokus manfaat: pantau masa bhakti, pengingat sebelum habis, kelola data pegawai satu tempat.
- Kata "SIAP AKAD" dihapus dari semua teks yang terlihat. Sisa kemunculan hanya di komentar kode (tidak terlihat pengguna).

### 4. Font — Plus Jakarta Sans
- Font karya desainer Indonesia, lisensi OFL, dibundel lokal (`src/fonts/plus-jakarta-sans-var.woff2`, 27 KB, variable weight 200–800).
- Diterapkan ke semua elemen (body, tombol, input, select, textarea); judul tebal 800.
- Service worker sudah mencakup woff2 (cache offline tetap jalan).

### 5. Warna biru / putih / tulisan hitam
- Token terang digeser: latar `#eef2f7`, permukaan putih, teks `#111827`, teks redup `#4b5563`, garis `#dbe3ea`.
- Mode gelap kini memaksa konten terang (latar terang + teks hitam di kedua mode) — tidak ada lagi teks putih di atas putih. Sidebar tetap biru.
- Kartu IKM: hijau → biru; kartu Anin: cokelat/amber → putih + garis kiri biru; kartu briefing/adopsi: garis kiri biru.

### 6. Tata letak rapi
- Statistik cepat: 4 kolom di desktop (sebelumnya 3, kartu ke-4 turun baris), 2 kolom di HP.
- Layar ≤1100px (termasuk HP Bos yang merender viewport ~980px): bento satu kolom.
- Tab sidebar: satu baris, tidak melipat, teks panjang dipotong rapi.

### 7. BUG NYATA ditemukan saat verifikasi (sudah ada sejak Paket 28)
- Di HP 390px, semua kartu bento terjepit selebar 42px (teks Anin lebar 0, tinggi halaman 16.579px). Penyebab: aturan `.bento-chart { grid-column: span 2; }` tertulis SETELAH blok media query, jadi mengalahkan perbaikan `1 / -1`; `span 2` di grid 1 kolom menciptakan kolom kedua tersembunyi dan semua kartu terjepit ke kolom 42px.
- Perbaikan: `span 2` hanya berlaku di layar lebar (min-width 1101px); kartu adopsi + followup ditambahkan ke daftar override media query.
- Sesudah perbaikan (diukur langsung): bento 1 kolom 324px, kartu pencarian 324px, input 286px, teks Anin 194px, tinggi halaman 8.419px.
- Tes headless diperkuat dengan asersi lebar kartu pencarian ≥ lebar bento − 4px, supaya bug seperti ini gagal di tes mulai sekarang.

### 8. Label kartu statistik tidak terpotong di tengah kata
- Di lebar 980px, label "Complaints resolved" terpotong jadi "Complai/nts" (aturan `overflow-wrap: break-word`).
- Perbaikan: bungkus antar kata saja — kini tampil rapi "Complaints" / "resolved".

## Verifikasi akhir (pada tree yang di-commit)
- Build: lolos (`tsc -b && vite build`, 4,44 detik).
- Headless: **329/329 lolos**.
- PWA: **16/16 lolos**.
- `check:secrets`: bersih.
- Screenshot diperiksa visual (viewport, bukan fullPage): beranda terang 390px, beranda gelap 390px (konten terang, teks hitam — sesuai desain Paket 30), beranda 980px (4 kartu statistik satu baris, label rapi), lembar surat offline 390px (kop + Nomor 140/001/DS/XI/2026 + isi pokok 1–2 persis formulir Bos).

## Catatan
- Service worker tetap `desaai-v1` (daftar precache tidak berubah; file sw.js yang berubah memicu update worker di browser).
- "Export Word" di tabel kepegawaian masih mengunduh CSV, bukan .docx (belum ada penulis .docx offline) — tidak berubah di paket ini.
- Generasi cloud (AI Logic / App Check) masih gagal di HP Bos; jalur offline di atas adalah jalan yang berfungsi sekarang.
- Screenshot bukti ada di `show-20261127/desaai-p30-*.png` (tidak di-commit ke repo; 2,8 MB).

## Status
Selesai diimplementasi + terverifikasi. **Belum di-deploy ke live — menunggu Bos bilang "Gas".**
