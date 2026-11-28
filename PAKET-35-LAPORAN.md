# Paket 35 — Laporan: Menu Pengaturan + Kartu Kontak (SELESAI, belum deploy)

Perintah Bos 28 Nov ~10:36 WIB (balasan atas screenshot HP halaman Arsip &
Draf): "Apakah ad ide menu tambahan, dan saya minta tambah menu pengaturan
bisa". Nomor Paket 35 dipakai karena Paket 34 baru berupa rencana
(`PAKET-34-RENCANA.md`, belum dibangun, belum ada laporan) — tidak bentrok.

Tambahan Bos yang masuk ke Paket ini (sebelum commit):
- 28 Nov ~10:40 WIB — **Kartu Kontak** di Beranda, data persis dari gambar
  Bos (lihat §2).
- 28 Nov ~10:41 WIB — **urutan struktur Pengaturan** mengikuti pola baku
  aplikasi umum (Akun paling atas, lalu tampilan/bahasa, Anin, Mode, Kop
  Surat, Data & Privasi, Bantuan & Tentang).
- 28 Nov ~10:40 WIB — **keamanan login sungguhan DITUNDA** ("Nanti kalau
  udah mantap kita bisa buat keamanan nya."). Paket 36 tetap login DEMO
  saja; auth sungguhan (backend + Firebase Auth) tidak dibangun sekarang.

## Yang dibangun

### 1. Tab baru "Pengaturan" (ikon gerigi, terakhir di sidebar)

- Hash `#pengaturan`; hanya Petugas (disembunyikan di Mode Warga lewat
  `OFFICER_TABS` + CSS); ikut terdaftar otomatis di palet perintah
  (`⌘K`). Satu-satunya tab baru — tidak ada tab/fitur lain yang diubah.
- Panel `#panel-settings`: daftar berkelompok, header kecil per kelompok,
  baris = label kiri + kontrol di kanan, mengikuti urutan yang diminta Bos.

### 2. Kartu Kontak di Beranda ("Hubungi Kami")

- Setelah kartu kop surat di bento Beranda, terlihat juga di Mode Warga
  (warga yang butuh). 6 baris + ikon, data **persis dari gambar Bos** —
  tidak diubah, tidak "dikoreksi", tidak ditambah:
  - Alamat: Jl. Merdeka No 02 Desa Katis, Kode Pos 33674
  - Telepon: 08117121844 (ketuk → `tel:`)
  - Email: kec.spkatis2014@gmail.com (ketuk → `mailto:`)
  - Facebook: kantor kecamatan simpangkatis (teks saja)
  - Twitter/X: @kec_simpangkatis (teks saja)
  - Instagram: kecamatansimpangkatis (teks saja)
- Nama media sosial tampil sebagai teks saja — **tidak ada URL profil
  yang dikarang** (tidak ada URL di gambar Bos). Kepala Pengaturan
  "Bantuan & Tentang" menautkan ke kartu ini.

### 3. Delapan kelompok Pengaturan (urutan Bos)

1. **Akun Pengguna** (paling atas): kartu profil — nama tampilan
   `Admin Kecamatan` + username akun demo yang sedang login + peran
   (Petugas/Warga, mengikuti Mode). Tombol Keluar di sini dan tetap ada
   di sidebar. **Tidak ada** ganti password / 2FA / hapus akun —
   keamanan sungguhan ditunda per keputusan Bos. Catatan di kartu
   menjelaskan ini akun demo, bukan keamanan sungguhan. Akun dibaca
   dari `desaai-session-v1` bila ada (maju-kompatibel dengan Paket 36),
   fallback demo bila belum ada.
2. **Tampilan**: tema Terang/Gelap/Otomatis — satu sumber kebenaran
   dengan toggle gelap di header (`desaai-theme-v1` kini menyimpan
   `"light"|"dark"|"auto"`; `"auto"` mengikuti perangkat, didengar
   lewat `matchMedia`). Ukuran teks Normal/Besar
   (`desaai-text-size-v1`; Besar = 16→18px, `html[data-text-size]`),
   untuk petugas senior.
3. **Bahasa**: Indonesia/English — satu sumber kebenaran dengan toggle
   di header (`setLang()`); **ditemukan saat menulis tes: bahasa
   sebelumnya hanya sesi (tidak tersimpan) — diperbaiki, kini
   `desaai-lang-v1`**. Pil tanggal mengikuti bahasa (`id-ID`/`en-GB`).
4. **Anin**: suara baca jawaban on/off (`desaai-anin-voice-v1`);
   dimatikan → tombol bacakan menampilkan catatan, bukan bersuara.
5. **Mode**: Warga/Petugas (kontrol yang sama dengan toggle header).
6. **Kop Surat**: 8 kolom (instansi 1/2, alamat, telepon, email, nama
   Camat + NIP, nama sekretaris) memakai penyimpanan yang sama dengan
   kartu kop di Beranda — kedua formulir saling sinkron. Pratinjau
   menampilkan kop seperti akan tercetak; **yang kosong tampil "—"**.
   Aturan keras dijaga: `instansi1/2` memakai default fakta kantor yang
   sudah ada sejak Paket 15/17 (bisa diedit); Camat/NIP/alamat/telepon/
   email/sekretaris default kosong — **tidak ada nama/NIP pejabat yang
   dikarang**.
7. **Data & Privasi**: tombol ekspor cadangan JSON (memanggil
   `exportBackup()` yang sudah ada + status yang sama); mode offline
   saja (`desaai-offline-only-v1`) — dijaga di kelima titik panggil
   `generateStream` (surat, ringkasan, Tanya, chat Anin, ringkasan
   kepegawaian — masing-masing jatuh ke jalur offline yang sudah ada);
   hapus semua data lokal — konfirmasi dua langkah (ketuk pertama
   hanya mempersenjatai tombol 10 detik, ketuk kedua menghapus semua
   kunci `desaai-*` lalu reload; data contoh kepegawaian muncul lagi
   sesudahnya karena seed bawaan, bukan kegagalan hapus).
8. **Bantuan & Tentang**: versi `0.1.0 · Paket 35` (konstanta
   `APP_VERSION`/`APP_PAKET`), catatan singkat, tautan kontak kantor
   (gulir ke kartu Kontak di Beranda).

Semua pengaturan tersimpan di localStorage, langsung berlaku tanpa
reload, bertahan setelah aplikasi ditutup. Kunci i18n id/en baru ~45
(`tabSettings`, `setAccount*`, `setTheme*`, `setTextSize*`, `setLang*`,
`setAninVoice*`, `aninVoiceOff`, `setMode*`, `setLhPreview*`, `setData`,
`setBackup*`, `setOfflineOnly*`, `setWipe*`, `setHelp`, `setVersion`,
`setContactLink*`, `setAboutNote`, `setSaved`, `contact*`).

## Verifikasi (di commit ini)

- `npm run build` — lolos (tsc + Vite 6.4.6; peringatan ukuran chunk
  sudah ada sebelumnya).
- `npm run test:headless` — **392/392 lolos** (0 gagal). Bagian baru 9
  (~13 cek): kartu kontak 6 baris + teks persis + tel/mailto + tepat
  2 tautan (tanpa URL sosmed karangan); Pengaturan terbuka; kartu akun
  demo/Petugas/Keluar; tema auto→gelap→terang; teks Besar 18px +
  bertahan setelah reload; bahasa en→id lewat Pengaturan (label tab +
  pil tanggal + tersimpan); pratinjau kop "—" → simpan `CAMAT-SET-35`
  → sinkron ke formulir Beranda + bertahan → reset kosong; suara
  mati + offline nyala bertahan setelah reload; Mode Warga lewat
  Pengaturan (tab petugas hilang, kembali ke Beranda) → kembali lewat
  toggle header; hapus data: ketuk pertama hanya mempersenjatai,
  ketuk kedua menghapus setelah reload.
- `npm run test:pwa` — **16/16 lolos**.
- `npm run check:secrets` — **bersih**.
- Screenshot 390px (terang + gelap): `screenshots/p35-settings-light.png`,
  `screenshots/p35-settings-dark.png`, `screenshots/p35-contact-card-light.png`,
  `screenshots/p35-contact-card-dark.png` (skrip: `scripts/screenshot-p35.mjs`).

### 5 ekspektasi tes lama yang diperbarui (bukan pelemahan cek)

Jalankan pertama 387/392 — kelimanya ekspektasi lama yang usang karena
perilaku baru Paket 35 yang benar, bukan cacat aplikasi:
- Bento Beranda 18 → **19 kartu** (kartu Kontak menambah satu).
- "Semua 9 tab" → **10 tab** (Pengaturan) — dua cek.
- Pil tanggal "selalu Indonesia" → **mengikuti bahasa UI** (aturan
  baru Paket 35; cek kini menghitung tanggal dalam bahasa UI aktif).
- Hapus data: `textSize`/`mode` tampak "tidak terhapus" karena boot
  menulis ulang default (`"normal"`/`"petugas"`) — cek kini menegaskan
  data pengguna hilang (tema/kop/suara/offline = null) dan default
  pulih. Perilaku boot ini sudah ada sebelumnya, tidak diubah.

### Dua perbaikan nyata yang ditemukan saat verifikasi

1. **Bahasa tidak tersimpan** — sebelum Paket 35, pilihan bahasa hanya
   hidup satu sesi. Kini `desaai-lang-v1` (lihat §3 di atas).
2. **Pengaturan tidak ikut ganti bahasa saat tab terbuka** —
   `applyLang()` tidak memanggil ulang render Pengaturan, jadi peran
   akun + pratinjau kop tertinggal dalam bahasa lama bila bahasa
   diganti dari header saat tab Pengaturan terbuka. Kini `applyLang()`
   memanggil `renderSettings()`.

### Catatan (pengamatan, bukan cacat Paket 35)

- Boot menunggu init Firebase + probe on-device sebelum `applyLang()`
  jalan. Di VM ini (terowongan ke Google diblokir) boot lambat, jadi
  label statis sempat tampil campur bahasa sampai boot selesai; di HP
  dengan jaringan normal boot selesai dalam hitungan detik. Urutan ini
  disengaja (komentar di `boot()`), jadi tidak diubah di Paket ini —
  bila Bos mengeluh tampilan awal campur bahasa, perbaikan lanjutannya
  adalah menjalankan `applyLang()` lebih awal di `boot()`.
- Tombol melayang "Tanya Anin" menutupi sebagian tombol bahasa di
  viewport 390px saat panel digulir — sudah ada di semua tab, bukan
  dari Paket 35.

## Yang TIDAK dilakukan

- **Tidak deploy ke gh-pages** — menunggu Gas Bos.
- Tidak mengubah isi/logika surat, tidak menyentuh kredensial/API key,
  tidak mengarang nama/NIP pejabat, tidak membangun auth sungguhan.
- Paket 34 (ide 1–9) belum dibangun — tetap antre setelah Paket 36.

## Berikutnya

- **Paket 36 — Layar Masuk (Login) Demo** (terpisah, setelah Paket 35):
  kartu login ala screenshot SIAP AKAD dengan branding DesaAI (tanpa
  teks "SIAP AKAD"), akun demo `demo`/`demo123`, sesi localStorage,
  Keluar di sidebar. **Keputusan Bos 28 Nov ~10:40 WIB: login
  sungguhan (backend + Firebase Auth) DITUNDA — "Nanti kalau udah
  mantap kita bisa buat keamanan nya."** Paket 36 tetap demo saja.
- Deploy Paket 35 (+ 36 bila sudah siap) menunggu Gas Bos.
