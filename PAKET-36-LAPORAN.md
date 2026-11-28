# Paket 36 — Laporan: Layar Masuk (Login) Demo (SELESAI, belum deploy)

Perintah Bos 28 Nov ~10:37 WIB (screenshot referensi layar login SIAP
AKAD): buat layar masuk di awal aplikasi sebagai contoh dulu. Dikerjakan
SETELAH Paket 35 (Pengaturan) selesai + commit + laporan, sebagai Paket
terpisah dengan commit sendiri.

## Yang dibangun

### 1. Layar masuk demo di awal aplikasi

- Tata letak mengikuti screenshot referensi: kartu putih di tengah atas
  latar biru gradasi, ikon gedung, judul besar, subjudul, field
  Username, field Password, tombol biru "Masuk Sistem", footer
  copyright — dengan branding DesaAI. **Tidak ada teks "SIAP AKAD"**
  di mana pun (jargon itu sudah lama diperintahkan Bos untuk dihapus).
  - Judul: `DesaAI`
  - Subjudul: `Administrasi Kecamatan Simpangkatis`
  - Baris biru: `Kecamatan Simpangkatis 2026`
  - Footer: `© 2026 Kecamatan Simpangkatis – Bangka Tengah`
- Saat aplikasi dibuka dan belum login, tampil **HANYA layar login** —
  overlay layar penuh (`position: fixed`, `z-index: 9999`) menutup
  sidebar/dashboard sehingga tidak bisa diakses. Palet perintah
  (`⌘K`) juga dijaga: tidak terbuka sebelum login (pintasan keyboard).
- Ini login **DEMO lokal saja, BUKAN keamanan sungguhan** — tertulis
  jelas di kartu: "Mode demo — bukan keamanan sungguhan." + akun demo
  ditampilkan di layar ("Akun demo — username: demo, password:
  demo123"). Kredensial demo: username `demo`, password `demo123`.
- Kombinasi salah → pesan error di layar ("Username atau password
  salah. Pakai akun demo di bawah."), tetap di halaman login. Benar →
  masuk dashboard (tab Beranda).
- Sesi disimpan di localStorage (`desaai-session-v1`,
  `{"username":"demo"}`) — tetap login walau aplikasi ditutup/dibuka
  lagi. Skrip inline kecil di `index.html` menyembunyikan gerbang
  seketika bila sesi ada, supaya pengguna yang kembali tidak melihat
  layar login berkedip saat bundle boot (boot menunggu Firebase).
- Tombol Keluar di sidebar (bawah) → hapus sesi → kembali ke layar
  login (dan tetap pindah ke Mode Warga seperti sebelumnya). Tombol
  Keluar di Pengaturan juga sama.
- **Tidak disambungkan ke Firebase Auth** (tetap anonymous auth yang
  sudah ada untuk Firestore). Password **tidak disimpan di mana pun**
  selain perbandingan lokal saat login (`tryLogin`).
- Kunci i18n id/en baru: `loginSubtitle`, `loginLine`, `loginUser`,
  `loginUserPh`, `loginPass`, `loginPassPh`, `loginSubmit`,
  `loginDemoNote`, `loginDemoCreds`, `loginError`, `loginFooter`.
  Kartu login tetap putih + gradasi biru di mode gelap (gerbang merek,
  bukan panel aplikasi).
- Nomor Paket di "Bantuan & Tentang" kini `0.1.0 · Paket 36`.

## Verifikasi (di commit ini)

- `npm run build` — lolos (tsc + Vite 6.4.6; peringatan ukuran chunk
  sudah ada sebelumnya).
- `npm run test:headless` — **401/401 lolos** (0 gagal; 9 cek login
  baru). Bagian baru 0 (di awal suite, sebelum semua tes lain —
  seluruh suite berjalan dalam keadaan login): layar login tampil
  pertama saat belum login (menutup aplikasi, tanpa sesi, catatan
  demo terlihat); kredensial salah ditolak (error tampil, tetap di
  login, sesi tetap null); demo/demo123 masuk Beranda (sesi tersimpan
  persis `{"username":"demo"}`); sesi bertahan setelah reload. Tes
  Keluar 9d diperbarui: Keluar → Mode Warga + layar login + sesi
  null → login lagi → Beranda (tetap Warga) → toggle header kembali
  ke Petugas. Blok akhir setelah tes hapus-data: layar login kembali
  setelah wipe + reload (sesi ikut terhapus) → login lagi berhasil →
  Keluar → login lagi → Beranda. Tes hapus-data kini juga menegaskan
  sesi ikut terhapus.
- `npm run test:pwa` — **16/16 lolos**.
- `npm run check:secrets` — **bersih**.
- Screenshot 390px: `screenshots/p36-login-light.png`,
  `screenshots/p36-login-dark.png` (skrip: `scripts/screenshot-p36.mjs`).

### Dua hal yang diperbaiki saat verifikasi

1. **Kolom login tidak dibersihkan antar percobaan** — nilai field
   bertahan setelah logout, jadi `page.type` berikutnya menggandakan
   ("demodemo" / "demo123demo123") dan login terakhir gagal. Tes kini
   memakai helper `loginDemo()` yang selalu membersihkan kolom dulu.
   (Perilaku aplikasi benar; ini jebakan tes saja.)
2. **Ringkasan kepegawaian gagal sekali lalu lolos** — cek "kepegawaian
   summary renders an offline recap without AI" gagal pada jalankan
   pertama Paket 36 (teks rekap belum muncul dalam 30 detik — jalur
   AI gagal lambat di VM ini) lalu **lolos pada jalankan ulang tanpa
   perubahan kode**. Ini flake yang sudah dikenal (gagal juga di
   baseline pra-Paket-12); bukan akibat Paket 36.

## Yang TIDAK dilakukan

- **Tidak deploy ke gh-pages** — menunggu Gas Bos.
- Tidak membangun login sungguhan (backend + Firebase Auth).
- Tidak mengubah isi/logika surat, tidak menyentuh kredensial/API key.

## Berikutnya (keputusan Bos 28 Nov ~10:40 WIB — dicatat di sini)

- **Keamanan login sungguhan DITUNDA.** Bos: "Nanti kalau udah mantap
  kita bisa buat keamanan nya." Artinya: login sungguhan (backend +
  Firebase Auth) dibangun nanti, setelah aplikasi mantap — bukan
  sekarang. Paket 36 ini sengaja tetap demo (rentan): siapa pun yang
  tahu kredensial demo bisa masuk, sesi hanya localStorage, tidak ada
  proteksi server. Jangan jadikan ini keamanan produksi.
- Deploy Paket 35 + 36 menunggu Gas Bos.
- Setelah itu: Paket 34 (ide 1–9 dari `PAKET-34-RENCANA.md`).
