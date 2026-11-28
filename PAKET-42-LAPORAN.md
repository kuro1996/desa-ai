# Paket 42 — Layout Beranda menyamping (AIDEN) + tren IKM pindah ke tab IKM

**Tanggal:** 28 Nov 2026 ~15:00 WIB · **Base:** main `ade308f` (Paket 41) · **Status:** selesai + terverifikasi, deploy ke gh-pages atas Gas Bos 14:55 WIB (lihat §7).

## 1. Keputusan desain (final dari Bos)

Bos memberi dua contoh (14:42 WIB) lalu menegaskan bertahap:

- 14:44 — SEMESTA sebagai acuan utama (grid ikon menu dominan).
- **14:45 WIB (final, gambar AIDEN dilingkari): "Inj ambil yg design ini aja" — AIDEN kini SATU-SATUNYA acuan desain Beranda.** Revisi ini membatalkan penegasan SEMESTA.
- Konsekuensi: **grid ikon menu ala SEMESTA TIDAK dibangun** — bukan elemen dominan, dan bukan pula elemen kecil. Sidebar navigasi yang sudah ada tetap jadi jalannya menu (seperti sidebar AIDEN). Tidak ada merek, nama, atau teks SEMESTA/AIDEN yang disalin; identitas tetap biru-putih DesaAI, teks hitam, satu font (Plus Jakarta Sans).

## 2. Yang dibangun

### a. Baris 4 kartu statistik berwarna sejajar (gaya AIDEN) — elemen atas Beranda

Di dalam `#panel-home .bento`, paling atas (di bawah judul "Office dashboard"):

| Kartu | Warna (ala AIDEN) | Angka live | Ketuk → |
|---|---|---|---|
| Skor IKM | biru | cermin `home-ikm-score` (90,28; "–" bila 0 jawaban) | tab Kepuasan (IKM) |
| Surat bulan ini | teal | cermin `home-month-letters` | tab Draf Surat |
| Pengaduan baru | biru muda | cermin `home-aduan-baru` | tab Pengaduan |
| Masa bhakti | oranye | total akan habis + sudah habis (cermin `home-masa-akan` + `home-masa-habis`) | tab Data Kepegawaian |

- Tiap tile adalah `<button class="home-stat …" data-tab="…">` dengan ikon panah ↗ (inline SVG, bukan emoji); klik memanggil `activateTab()` — navigasi yang sudah ada.
- Sub-teks live: IKM "12 responden", Surat nama bulan ("November 2026"), Pengaduan "menunggu ditindaklanjuti", Masa "4 akan habis · 3 sudah habis".
- Cermin angka diperbarui di `renderHome()` di samping binding aslinya — tidak ada sumber data baru.
- Kartu biru muda memakai teks gelap di mode terang (keterbacaan, sesuai selera Bos); di mode gelap otomatis jadi biru gelap + teks putih.
- Layout: 4 kolom di desktop, 2 kolom di ≤700px (HP 390px tetap 2 per baris).

### b. Panel dua kolom di bawahnya (gaya AIDEN)

- `.bento` desktop kini **2 kolom** (dulu 6 kolom): kartu-kartu berdampingan berpasangan.
- Urutan DOM Beranda diubah (isi sama persis, hanya urutan): pencarian (penuh) → **Laporan bulanan (grafik tren bulanan) + Pengaduan baru** (grafik + aktivitas terbaru) → **Briefing Pagi + Pengingat hari ini** (pengumuman + agenda mendatang) → Anin + Skor IKM → Dashboard Camat + Masa bhakti → Bulan ini + Layanan warga.
- Breakpoint satu kolom diturunkan 1100px → **900px** (layout 2 kolom tetap lega sampai 900px; screenshot 980px sudah menunjukkan 2 kolom). Di HP 390px panel menumpuk 1 kolom; tile statistik tetap 2 per baris.
- Semua span lama dicabut (`.bento-ikm` span 2 + row span 2, `.bento-kpi/.bento-masa/.bento-month` span 2, `.bento-report/.bento-briefing/.bento-anin/.bento-camat` 1/-1). Kartu pencarian + baris stat tetap membentang penuh (`1 / -1`).

### c. Yang TETAP

- Header "Dashboard kantor" hasil Paket 41 tidak diubah; sidebar tidak berubah; semua 11 kartu Beranda tetap ada dan terjangkau (hanya layout, tidak ada yang dihapus); tombol lipat −/+ tetap ada di 11 kartu (tile stat bukan `.bento-card`, jadi tidak ikut dilipat/dihitung); FAB "Tanya Anin"; login demo; mode gelap rapi; strip `quick-stats` di atas panel **tidak disentuh** (strip global 4 kartu yang tampil di semua tab — lihat catatan §6).

### d. (e) Garis tren IKM pindah ke tab Kepuasan/IKM

- Latar: Paket 41 menghapus kartu "Tren IKM" dari Beranda; garis kumulatif itu hanya ada di sana. Atas perintah Bos ("Yah masukin ke menu tab IKM aja", 14:44 WIB), garisnya dikembalikan **di dalam tab Kepuasan/IKM, di bawah batang per unsur**.
- Implementasi: `ikmTrendPoints()` + `renderTrend()` dipulihkan dari riwayat git (induk `ade308f`, `src/main.ts` ~1036–1130) — **bukan ditulis ulang**: logika sama persis (skor kumulatif setelah tiap jawaban, diurutkan tanggal; SVG 600×180, sumbu Y 25–100, 12 titik untuk 12 jawaban contoh). Hanya id wadah yang baru (`ikm-trend` / `ikm-trend-empty`) agar tidak bentrok dengan Beranda; CSS `.trend-chart` sudah ada dari sebelumnya.
- Markup baru di `#panel-ikm` (bungkus `.ikm-trend-wrap`, di bawah catatan skala): judul "Tren IKM — skor dari waktu ke waktu" + hint + `#ikm-trend` + `#ikm-trend-empty` (tersembunyi bila ≥2 jawaban). `renderTrend()` dipanggil dari `renderIkm()`.
- Kunci i18n baru: `ikmTrendTitle/Hint/Empty`, `homeStatLetters`, `homeStatMasa`, `homeStatMasaAkan/Habis`.

## 3. File yang diubah

- `index.html` — baris stat (4 tile) + susun ulang 11 kartu Beranda + blok tren di `#panel-ikm`.
- `src/main.ts` — fungsi tren (pulihan git) + panggil dari `renderIkm()` + 4 cermin angka di `renderHome()` + wiring klik tile di `initHome()`.
- `src/i18n.ts` — 7 kunci baru (§2d).
- `src/styles.css` — `.bento` 2 kolom, cabut span lama, gaya `.home-stat*` (4 varian + dark mode + responsif 700px), breakpoint 900px, `.ikm-trend-wrap`.
- `scripts/headless-test.mjs` — cek Paket 41 "tab IKM tanpa tren" **dibalik** + 4 cek Paket 42 baru (lihat §4).
- `scripts/screenshot-p42.mjs` — baru (390px + 980px, light + dark, Beranda + tab IKM).

## 4. Verifikasi

| Tes | Hasil |
|---|---|
| `npm run build` | Lolos (tsc + vite, 4,99 dtk) |
| `npm run test:headless` | **417/417 lolos** (dulu 413; +4 cek baru, 1 cek dibalik — total naik 4) |
| `npm run test:pwa` | **16/16** |
| `npm run check:secrets` | Bersih |

Cek headless baru (semua lolos):

1. "Paket 42: IKM tab now shows the cumulative trend chart (moved from Beranda) + per-element bars" — SVG tren ada, **12 titik** (`circle`), `polyline` ada, batang per unsur tetap ada, `home-ikm-trend` tetap tidak ada di Beranda. (Menggantikan cek Paket 41 yang menegaskan tab IKM tanpa tren.)
2. "Paket 42: AIDEN stat row has 4 colored tiles mirroring live Beranda numbers" — 4 tile, 4 varian warna berbeda, angka = cermin kartu (IKM 90,28; surat 0; pengaduan 3; masa 7), sub-teks terisi.
3. "Paket 42: tapping a stat tile opens its tab" — tile Surat → panel Draf Surat; tile IKM → panel Kepuasan (tren tetap ter-render).
4. "Paket 42: Beranda panels sit two-column on desktop" — Laporan + Pengaduan satu baris, Briefing + Pengingat satu baris, 11 kartu tetap ada.
5. "Paket 42: at 390px stat tiles stay 2-per-row, panels stack 1 column, no horizontal overflow" — tile 2/baris, panel 1 kolom, `scrollWidth − 390 = 0`.

Dua kegagalan awal (bukan regresi) dan perbaikannya:

- Cek stat row menuntut sub-teks Indonesia ("akan habis", "responden") padahal suite berjalan dalam bahasa Inggris di titik itu (toggle ke Indonesia baru di baris ~1804) — cek dibuat agnostik bahasa (terima Indonesia/Inggris).
- Cek `cardsOneCol` gagal karena kartu warga yang `hidden` di mode Petugas punya rect 0 (`left: 0`) — kartu tersembunyi kini disaring sebelum memeriksa keseragaman kolom.

Screenshot (`screenshots/p42-*`, 16 file: Beranda atas + close-up stat + Beranda + tren IKM × 390px/980px × light/dark) — diperiksa visual:

- 980px light: 4 kartu stat berwarna sejajar + Laporan/Pengaduan berdampingan + Briefing/Pengingat berdampingan; tombol −/+ ada.
- 980px dark: kartu biru muda berubah jadi biru gelap + teks putih, semua terbaca.
- 390px light: header muat tanpa overflow; stat tetap 2 per baris.
- Tren IKM: garis + 12 titik ter-render di tab IKM di bawah batang per unsur.

Perbaikan skrip screenshot: `boot()` lama selalu login ulang — gagal di boot kedua karena sesi demo bertahan di localStorage (layar login tersembunyi, tombol tidak bisa diklik). Sekarang boot memeriksa dulu apakah layar login terlihat; bila sesi aktif, login dilewati.

## 5. Commit

- Pesan: `Paket 42: layout Beranda menyamping + tren IKM pindah ke tab IKM` (satu commit, sesuai perintah).
- Isi: `index.html`, `src/main.ts`, `src/i18n.ts`, `src/styles.css`, `scripts/headless-test.mjs`, `scripts/screenshot-p42.mjs`, `PAKET-42-LAPORAN.md`, `screenshots/p42-*.png`.
- **Tidak ikut commit:** `PAKET-41-LAPORAN.md` (addendum deploy Paket 41 oleh agen deploy — bukan bagian Paket 42), `PAKET-32/33/34-RENCANA.md`, `VIDEO-BARU-RENCANA.md`, `show-20261127/` (sudah ada sebelum Paket 42, tidak disentuh).

## 6. Catatan jujur

- **Dua baris statistik bertumpuk di Beranda.** Strip `quick-stats` (Surat tersimpan / Skor IKM / Pengaduan selesai / Perangkat desa) tetap tampil di atas panel karena ia strip global yang muncul di semua tab dan dicek headless (4 hero stat + nilai live). Baris stat AIDEN adalah baris kedua khusus Beranda. Angka IKM muncul di keduanya; metrik lain berbeda. Bila Bos merasa dobel, opsi lanjutan: sembunyikan `quick-stats` hanya saat tab Beranda aktif — belum dikerjakan karena di luar perintah Paket 42.
- **Grid ikon menu SEMESTA tidak dibangun** — sesuai keputusan final Bos 14:45 WIB (AIDEN satu-satunya acuan). Bila Bos berubah pikiran, grid itu bisa ditambahkan sebagai elemen kecil di bawah baris stat, bukan sebagai tampilan dominan.
- **Bahasa default screenshot/headless di awal suite adalah Inggris** (toggle ke Indonesia terjadi belakangan di suite) — karena itu sebagian screenshot Paket 42 berlabel Inggris; perilaku bahasa aplikasi sendiri tidak berubah (cek bahasa lolos semua).

## 7. Addendum deploy — (diisi setelah deploy ke gh-pages)
