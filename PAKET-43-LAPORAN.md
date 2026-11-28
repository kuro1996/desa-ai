# Paket 43 — Sembunyikan strip quick-stats di Beranda (rapikan baris statistik ganda)

**Tanggal:** 28 Nov 2026 ~15:20 WIB · **Base:** main `569a7ab` (addendum deploy Paket 41; Paket 42 sudah LIVE di gh-pages `47e57b7`) · **Status:** selesai + terverifikasi, commit main. **TIDAK di-deploy** — deploy butuh Gas baru dari Bos.

## 1. Perintah

Bos 28 Nov 15:15 WIB, membalas tawaran di laporan Paket 42: **"Deploy dulu baru rapikan yah"** — deploy Paket 42 dulu, lalu rapikan. Deploy Paket 42 selesai dan live; paket ini mengerjakan rapikannya.

## 2. Masalah

Setelah Paket 42, Beranda punya **dua baris statistik bertumpuk**:

- Strip `quick-stats` global (lama, Paket 28 — 4 kartu: Surat tersimpan, Skor IKM, Pengaduan selesai, Perangkat desa), tampil di **semua** tab karena letaknya di `<main>`, di luar panel tab.
- Baris 4 kartu statistik berwarna baru ala AIDEN (`.home-stat-row`, Paket 42) di dalam `#panel-home`.

Akibat: angka IKM muncul dua kali di Beranda (sekali di strip lama, sekali di kartu baru).

## 3. Perbaikan (satu-satunya perubahan perilaku)

Strip `quick-stats` **disembunyikan HANYA saat tab Beranda aktif**; di tab lain tetap tampil seperti biasa.

- `src/main.ts` — `activateTab()` kini menandai body: `document.body.classList.toggle("tab-home", tab === "home")` (pola yang sama dengan `mode-warga`). Semua jalur ganti tab melewati `activateTab()` (klik sidebar, command palette, hash/deep link), jadi kelas selalu sinkron — termasuk saat boot (tab awal home).
- `src/styles.css` — aturan baru `body.tab-home .quick-stats { display: none; }` tepat di bawah aturan dasar `.quick-stats`. Spesifisitasnya mengalahkan semua aturan `.quick-stats` lain (termasuk media query 2 kolom di HP). Berlaku di light + dark (`display: none` tidak bergantung tema).
- **Tidak ada yang dihapus:** strip tetap di DOM (4 `.hero-stat` + binding live `qs-letters`/`qs-ikm`/`qs-aduan`/`qs-perangkat` tetap diperbarui), kartu statistik baru, panel dua kolom, header Paket 41, sidebar, dan semua tab lain tidak disentuh.

## 4. File yang diubah

- `src/main.ts` — 1 baris + komentar di `activateTab()`.
- `src/styles.css` — 1 aturan + komentar.
- `scripts/headless-test.mjs` — 2 cek baru Paket 43 (lihat §5).
- `scripts/screenshot-p43.mjs` — baru (390px + 980px, light + dark; Beranda atas + close-up stat + tab Draf Surat sebagai pembanding).

## 5. Verifikasi

- `npm run build` lolos (56 modul).
- `npm run test:headless` **419/419** (dulu 417; +2 cek baru Paket 43, 0 gagal):
  - "Paket 43: quick-stats strip hidden on Beranda, AIDEN stat row still visible" — `body.tab-home` ada, strip `display: none`, baris stat AIDEN terlihat, 4 hero-stat tetap ada di DOM.
  - "Paket 43: quick-stats strip visible again on other tabs" — pindah ke tab Draf Surat: kelas `tab-home` hilang, strip tampil lagi; kembali ke Beranda: tersembunyi lagi.
  - Cek lama yang menyentuh strip tetap hijau tanpa diubah: data live quick-stats (1 surat, IKM = dashboard, 2 selesai, perangkat = total) dan layout HP 390px (`qsCols === 2`) — keduanya berjalan saat tab non-Beranda aktif, jadi tidak terpengaruh.
- `npm run test:pwa` **16/16**; `npm run check:secrets` bersih.
- Screenshot 12 file (`screenshots/p43-*`): Beranda atas + close-up stat + tab Draf Surat × 390px/980px × light/dark — diperiksa visual: Beranda 980px light/dark langsung header → 4 kartu AIDEN (tanpa strip lama); tab Draf Surat tetap menampilkan strip lama; 390px light/dark rapi, tanpa overflow. (Sebagian screenshot berlabel Inggris karena suite berjalan dalam bahasa Inggris di awal — perilaku bahasa aplikasi tidak berubah.)

## 6. Catatan jujur

- Perbaikan ini menyembunyikan strip, bukan menghapusnya: bila suatu hari Bos ingin strip lama hilang total dari semua tab, itu satu baris CSS lagi — tapi selama strip masih berguna di tab lain (ringkasan cepat tanpa membuka Beranda), menyembunyikan hanya di Beranda adalah pilihan yang paling aman.
- Angka di screenshot bukti sedikit berbeda dari suite headless (mis. "Complaints resolved 1" vs "2") karena script screenshot memakai profil browser segar dengan data contoh bawaan, sementara suite headless memakai data seed-nya sendiri — bukan bug, hanya beda data awal.

## 7. Deploy (belum dilakukan)

Paket ini **belum di-deploy** ke gh-pages. Live masih Paket 42 (`47e57b7`). Deploy menunggu Gas baru dari Bos; jalurnya sama seperti Paket 41/42 (worktree bersih di commit Paket 43 → clone gh-pages → salin dist → push → verifikasi ls-remote + cek live).
