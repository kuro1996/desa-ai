# PAKET 39 — Hapus kartu duplikat dari Beranda

Perintah Bos: screenshot 28 Nov 2026 12:01 WIB + pesan "Yg lain
menyesuaikan aja yah". Tanggal pengerjaan: 28 Nov 2026. Commit di main
(bukan deploy — deploy nanti gabung Paket 37–40 atas Gas Bos 12:03 WIB).

Prinsip Bos: Beranda itu ringkasan, bukan duplikat isi menu.

## Yang dihapus dari Beranda

1. **"Complaints by Type"** (pengaduan dikelompokkan per jenis) —
   `.bento-chart` (`#home-aduan-chart`).
2. **"Officers per Village"** (pejabat dikelompokkan per desa) —
   `.bento-desa-chart` (`#home-desa-chart`).
3. **"Composition by Position"** (komposisi per jabatan + donat Total
   officers 23) — `.bento-jabatan-chart` (`#home-jabatan-donut`,
   `#home-jabatan-legend`).

Beranda kini 15 kartu (dari 18).

## Verifikasi data di menu terkait (dilakukan SEBELUM menghapus)

- **Data Kepegawaian** menampilkan daftar pejabat lengkap (`#keg-table`):
  kolom Nama, Unit, **Jabatan** (bisa diurutkan), **Desa** (bisa diurutkan),
  TTL, Agama, No HP, Masa Bhakti, Status — plus statistik "Total officers".
  Data di balik kedua kartu pejabat sepenuhnya bisa dilihat di menu ini.
- **Pengaduan** menampilkan daftar pengaduan lengkap (`#adu-list`) dengan
  jenis tiap pengaduan, plus filter **per jenis** (`#adu-filter-jenis`)
  dan per status. Data di balik kartu jenis pengaduan sepenuhnya bisa
  dilihat (dan difilter per jenis) di menu ini.

## Yang TETAP di Beranda (prinsip "menyesuaikan")

- "This Month" (ringkasan), "Monthly Report" (rekap + tombol Print/Export),
  "New Complaints" dan "Terms of Office — Needs Attention" (alarm yang
  perlu ditindak, bukan sekadar duplikat), "IKM Trend" (tidak diubah sama
  sekali), "Hubungi Kami", plus kartu lainnya (Pencarian, Anin, Briefing
  Pagi, Dashboard Pagi Camat, Layanan warga, IKM score, Letters today,
  Paket Adopsi, Needs follow-up).
- Tombol lipat Paket 38 hanya berlaku untuk kartu yang tersisa (14 dari 15
  kartu; IKM Trend tetap tanpa tombol).

## Catatan — fungsi ringkas yang hilang dari Beranda

Sesuai perintah Bos, ketiga kartu tetap dihapus — tapi ringkasan visualnya
tidak ada di menu manapun, jadi fungsi ini hilang dari Beranda:

- **Jumlah pengaduan per jenis dalam sekali lihat** (grafik batang:
  Delay 2, Unclear requirements 1, Unfriendly service 1, Incorrect fees 1,
  Other 1). Di tab Pengaduan, angkanya hanya bisa didapat dengan memfilter
  per jenis satu per satu.
- **Jumlah perangkat per desa dalam sekali lihat** (grafik batang 10 desa
  + 1 baris Kecamatan). Di tab Kepegawaian, angkanya hanya bisa didapat
  dengan mengurutkan/memfilter kolom Desa dan menghitung baris.
- **Komposisi per jabatan dalam sekali lihat** (donat + legenda + total 23
  di tengah). Di tab Kepegawaian, angkanya hanya bisa didapat dengan
  mengurutkan/memfilter kolom Jabatan dan menghitung baris.

Datanya tidak hilang — hanya ringkasan visualnya. (Konsistensi total
perangkat per desa/jabatan tetap terverifikasi lewat cek statistik
Paket 21 di tab Kepegawaian: group by jabatan/desa.)

## Pembersihan kode

- `src/main.ts` — fungsi `renderAduanChart()`, `renderDesaChart()`,
  `renderJabatanChart()` + konstanta `CHART_COLORS`, `JABATAN_ALL` dan 3
  call site-nya di `renderHome()` dihapus. Tidak ada null-crash: grep
  memastikan nol referensi tersisa ke id kartu yang dihapus. Tidak ada
  perintah Anin yang merujuk kartu-kartu ini (diperiksa di `anin-kb.ts`,
  `kb.ts`, `anin-chat.ts` — tidak ada).
- `src/i18n.ts` — 9 string yang hanya dipakai ketiga kartu dihapus:
  `aduanChartTitle/Hint/Empty`, `homeDesaChartTitle/Hint/Empty`,
  `homeJabatanTitle/Hint/Empty`.
- `src/styles.css` — aturan yang hanya dipakai ketiga kartu dihapus:
  `.chart-bars/.chart-row/.chart-track/.chart-fill/.chart-label/.chart-value`,
  `.donut-wrap/.donut-chart/.donut-total/.donut-total-label/.donut-legend/
  .donut-swatch/.donut-label`, grid `.bento-chart/.bento-desa-chart/
  .bento-jabatan-chart` (lebar + mobile). Grafik bilah IKM memakai class
  `ikm-bar*` sendiri dan tidak tersentuh.
- `src/main.ts` — `APP_PAKET` 38 → 39; teks statis "0.1.0 · Paket 39".

## File yang diubah

- `index.html` — 3 blok kartu dihapus + teks versi Paket 39.
- `src/main.ts`, `src/i18n.ts`, `src/styles.css` — pembersihan di atas.
- `scripts/headless-test.mjs` — cek Paket 39 (di bawah); cek bento 18→15;
  cek tombol lipat 17→14; 3 cek grafik yang menguji kartu yang dihapus
  dihapus (1 cek grafik pengaduan + 2 cek grafik Paket 28).
- `scripts/screenshot-p39.mjs` (baru) — screenshot 390px light+dark.
- `screenshots/p39-*.png` (4 file, baru).

## Verifikasi

- `npm run build` — lolos.
- `npm run test:headless` — **409/409 checks passed, exit 0**.
- `npm run test:pwa` — **16/16**.
- `npm run check:secrets` — bersih.

Cek headless baru (Paket 39):

- Ketiga kartu + elemennya (`#home-aduan-chart`, `#home-desa-chart`,
  `#home-jabatan-donut`) TIDAK ada lagi di Beranda.
- Kartu yang dipertahankan tetap tampil: This Month, Monthly Report, New
  Complaints, Terms of Office, IKM Trend, Hubungi Kami — dengan tombol
  lipatnya (kecuali IKM Trend yang memang tanpa tombol).
- Cek lipat Paket 38 tetap lolos (14 tombol di 15 kartu; lipat/buka +
  persistensi localStorage).

## Screenshot (390px, light + dark)

- `screenshots/p39-home-light.png`, `p39-home-dark.png` — Beranda atas
  sesudah perubahan.
- `screenshots/p39-home-mid-light.png`, `p39-home-mid-dark.png` —
  This Month → IKM Trend (tanpa tombol, grafik utuh) → Monthly Report:
  ketiga kartu yang dihapus sudah tidak ada di antara IKM Trend dan
  Monthly Report.

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
