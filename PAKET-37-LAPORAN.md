# PAKET 37 — Pindahkan Data & Backup dan Kop Surat dari Beranda ke Pengaturan

Perintah Bos: screenshot 28 Nov 2026 11:53 + 11:57 WIB.
Tanggal pengerjaan: 28 Nov 2026. Commit di main (bukan deploy — deploy nanti gabung Paket 37–40 atas Gas Bos 12:03 WIB).

## Yang berubah

Beranda makin ringkas: dua kartu yang isinya pengaturan dipindah ke tempatnya.

1. **Kartu "Data & backup" dihapus dari Beranda** (`#home-backup-card`).
2. **Kartu "Pengaturan Kop Surat" dihapus dari Beranda** (`#home-letterhead-card`).
   Kop Surat di Pengaturan (grup Kop Surat, `set-lh-*` + pratinjau) menjadi
   satu-satunya tempat — perilakunya tidak diubah, tetap tersimpan dan tetap
   tersinkron ke surat seperti sebelumnya.
3. **Restore dipindah, bukan dihapus.** Restore sebelumnya HANYA ada di kartu
   Beranda (tombol `home-backup-import` + dialog konfirmasi); tab Arsip & Draf
   tidak punya backup/restore. Sekarang Restore ada di Pengaturan → grup
   **Data & Privasi**: tombol "Pulihkan dari cadangan" (`#set-backup-import`)
   + input file tersembunyi (`#set-backup-file`) + dialog konfirmasi
   (`#set-backup-confirm`) + status (`#set-backup-status`), memakai ulang
   logika restore yang sudah ada (handler dipindah, bukan ditulis ulang).
   Export JSON sudah ada di Pengaturan (`#set-backup-export`) — dibiarkan.
4. **Hint Pengaturan diperbarui** — tidak lagi berbunyi "Cadangan lengkap yang
   sama seperti di Beranda" (Beranda sudah tidak punya lagi). Sekarang:
   "Download all office data as one JSON file, or restore it from a backup.
   Everything stays in this browser — no data leaves the device."
5. **main.ts dirapikan:**
   - Handler `home-backup-*` dan `home-letterhead-*` (fill, save, counts)
     dihapus; fungsi `renderBackupCard`, `backupCounts`, `mergedDraftCount`,
     `LETTERHEAD_INPUT_IDS`, `renderLetterheadForm`, `saveLetterheadForm`
     dan semua call site-nya dihapus (`renderHome`, `refreshDrafts`;
     `applyBackup` sekarang memanggil `renderSettingsLetterhead`).
   - Handler `set-backup-export` diperbaiki: sebelumnya membaca
     `$("home-backup-status")` — elemen itu sudah hilang; sekarang memakai
     `$("set-backup-status")`. `exportBackup` juga diarahkan ke status yang
     sama.
   - Perintah Anin `cmdBackup` → Pengaturan + klik `set-backup-export`.
   - Perintah Anin ke kop surat → tab Pengaturan (`#pengaturan`) + fokus
     `set-lh-camat-nama`.
   - `$()` melempar bila elemen tidak ada, jadi semua referensi `home-*`
     sudah dibersihkan — hasil grep: nol sisa.
6. **Versi:** `APP_PAKET` 36 → 37; teks statis "0.1.0 · Paket 37".
7. **styles.css:** selector mode-warga + aturan grid `.bento-backup` /
   `.bento-letterhead` + `.backup-counts` dihapus; `.backup-confirm` tetap
   (dipakai dialog restore di Pengaturan).
8. Kartu Kontak, data kontak, dan fungsi lain **tidak diubah**. Firebase/config
   **tidak disentuh**.

## File yang diubah

- `index.html` — dua kartu Beranda dihapus; grup Data & Privasi di Pengaturan
  mendapat tombol restore + input file + dialog konfirmasi + status.
- `src/main.ts` — hapus handler/fungsi home backup & kop surat; perbaiki
  handler export; arahkan ulang perintah Anin; `APP_PAKET` 37.
- `src/i18n.ts` — string restore + hint baru (id/en).
- `src/styles.css` — hapus aturan kartu yang dihapus; tambah
  `.verify-page[hidden]` (lihat catatan perbaikan di bawah).
- `scripts/headless-test.mjs` — cek Paket 37 (di bawah) + perbaikan cek yang
  flaky/usang (lihat catatan).
- `scripts/screenshot-p37.mjs` (baru) — screenshot 390px light+dark.
- `screenshots/p37-*.png` (6 file, baru).

## Verifikasi

- `npm run build` — lolos.
- `npm run test:headless` — **403/403 checks passed, exit 0** (dua run
  berturut-turut setelah perbaikan terakhir).
- `npm run test:pwa` — **16/16**.
- `npm run check:secrets` — bersih.

Cek headless baru (Paket 37):

- Beranda TIDAK lagi berisi `#home-backup-card` dan `#home-letterhead-card`.
- Pengaturan berisi tombol backup (`#set-backup-export`) DAN restore
  (`#set-backup-import`).
- Klik Restore tanpa memilih file tidak crash (dialog konfirmasi tetap
  tersembunyi).
- Isi kop surat lewat Pengaturan tersimpan dan muncul di pratinjau surat
  (`#set-lh-preview`); tes kop-print diarahkan ke Pengaturan.
- Cek Mode Warga kini menegaskan kedua kartu itu tidak ada; tes sinkron
  Paket 35 tidak lagi menegaskan form kop di Beranda.
- Jumlah kartu bento Beranda kini dicek berbasis set (18 kartu yang
  diharapkan, disebut satu per satu bila ada yang hilang).

## Screenshot (390px, light + dark)

- `screenshots/p37-home-light.png`, `p37-home-dark.png` — Beranda sesudah
  perubahan (tanpa kartu backup/kop surat).
- `screenshots/p37-settings-backup-light.png`,
  `p37-settings-backup-dark.png` — Pengaturan, grup Data & Privasi
  (tombol Backup data + Restore data).
- `screenshots/p37-settings-letterhead-light.png`,
  `p37-settings-letterhead-dark.png` — Pengaturan, grup Kop Surat
  (form + pratinjau).

## Catatan — perbaikan bug lama yang ditemukan saat verifikasi

Bukan bagian perintah Paket 37, tapi ketiganya menghalangi verifikasi dan
sudah diperbaiki di commit ini (dipisah jelas di bawah):

1. **Halaman verifikasi surat menutupi Beranda (bug aplikasi, dari Paket
   34B).** `.verify-page { display: flex; }` di `src/styles.css` mengalahkan
   atribut `hidden` (aturan `display: none` bawaan browser kalah dengan
   aturan author) — halaman verifikasi selalu tampil setinggi satu viewport
   di atas aplikasi, walau tanpa parameter `?verifikasi=`. Screenshot Beranda
   pertama menampilkan kartu "Checking the archive…" bukan Beranda.
   Perbaikan: tambah `.verify-page[hidden] { display: none; }`, mengikuti
   pola yang sudah ada (`.anin-panel[hidden]`, `.login-screen[hidden]`).
   Bug ini juga ada di live (gh-pages 6f6f9a6) — deploy Paket 37–40 akan
   memperbaikinya.
2. **Cek headless Anin "lapor" usang.** Cek lama mengharapkan jawaban Anin
   untuk "Bagaimana cara lapor pengaduan?" mengandung "Pengaduan baru" —
   padahal sejak Paket 34 Ide 5, pertanyaan itu deterministik memulai alur
   lapor terpandu ("Baik, kita laporkan langkah demi langkah…"), yang tidak
   mengandung frasa itu. Lebih parah: alur yang tertinggal aktif membuat 6
   cek KB sesudahnya gagal ("Balas dengan angka 1–5…"). Perbaikan (hanya
   tes): cek kini menegaskan alur lapor dimulai, lalu mengirim "batal"
   (balasan "laporan dibatalkan") supaya pertanyaan KB berikutnya dijawab
   normal.
3. **Klik seg di headless flaky di VM ini.** Klik koordinat
   `page.click('[data-seg=...]')` untuk tema/ukuran teks/bahasa kadang
   meleset satu tombol (tersimpan "light"/"normal" padahal yang diklik
   "auto"/"large") — hanya di suite penuh, tidak di probe isolasi
   (probe: kedua klik tersimpan benar). Perbaikan (hanya tes): klik seg di
   seksi Pengaturan memakai `page.$eval(..., el => el.click())` (klik DOM
   langsung, kebal geser layout).
4. **Cek Tanya Prosedur flaky.** `sleep(600)` diganti `page.waitForFunction`
   (maks 20 dtk) menunggu jawaban "Kartu Keluarga" muncul — bila Firebase
   berstatus ready, jawaban lewat jalur cloud yang di VM ini gagal lambat
   dan fallback offline-nya mendarat >600 ms.

**Kejujuran hasil tes:** suite headless TIDAK 100% stabil di VM ini — run
baseline di main bersih (git stash) hanya 390/401, dengan 10 kegagalan yang
sama persis (7 Anin + 3 settings) seperti yang dialami Paket 37 sebelum
perbaikan di atas. Setelah perbaikan 2–4, run terakhir **403/403 dua kali
berturut-turut**. Bila run mendatang kembali flaky di cek yang sama, itu
lingkungan (pergantian VM menghapus `/usr/bin/google-chrome`, fallback ke
`/opt/meta-chromium/chrome`), bukan regresi Paket 37 — bandingkan selalu
dengan baseline main bersih sebelum menyalahkan paket ini.

## Deploy (addendum 28 Nov 2026)

- Deploy gabung Paket 37–40 atas Gas Bos 28 Nov 12:03 WIB ("nanti deploy
  langsung biar saya check lagi").
- Main HEAD: 8d4ae09 (Paket 40). Build dari worktree bersih di HEAD itu.
- gh-pages: 6f6f9a6 → **8c3538e** ("Deploy Paket 37-40", `git ls-remote`
  terverifikasi).
- Cek live https://kuro1996.github.io/desa-ai/ (~1 menit setelah push):
  index 200, bundle baru `assets/index-Cs_7aeTP.js` 200 +
  `assets/index-D8p1o6Vf.css` 200, keduanya dirujuk index live;
  "Contact Person" ada di index live, "home-contact-card" 0.
