# PAKET 38 — Tombol lipat kartu Beranda

Perintah Bos: screenshot 28 Nov 2026 11:55 WIB (Beranda terlalu panjang ke
bawah). Tanggal pengerjaan: 28 Nov 2026. Commit di main (bukan deploy —
deploy nanti gabung Paket 37–40 atas Gas Bos 12:03 WIB).

## Yang berubah

Setiap kartu Beranda kini bisa dilipat supaya Beranda tidak terlalu panjang.

1. **Tombol lipat (− / +) di kanan atas tiap kartu Beranda** (`bento-card`),
   **KECUALI kartu "IKM Trend — Score Over Time"** — kartu itu tidak punya
   tombol sama sekali dan tampilannya tidak diubah.
   - 17 dari 18 kartu mendapat tombol: Pencarian, Anin, Briefing Pagi,
     Dashboard Pagi Camat, Layanan warga, IKM score, Letters today, New
     complaints, Terms of office, This Month, Complaints by Type, Officers
     per Village, Composition by Position, Monthly Report, Hubungi Kami,
     Paket Adopsi, Needs follow-up.
   - Klik "−" → isi kartu disembunyikan, tombol berubah jadi "+"; klik "+"
     → isi tampil lagi.
2. **Yang tetap terlihat saat terlipat: judul + angka ringkas.**
   - This Month: "0 Letters saved / 12 Survey answers / 6 Complaints".
   - IKM score: skor, kategori + jumlah responden, elemen terendah.
   - Letters today / New complaints: angka besarnya.
   - Terms of office: "Expiring ≤ 90 days / Expired".
   - Briefing Pagi: ringkasan hariannya; Needs follow-up: ringkasannya.
   - Kartu grafik (Complaints by Type, Officers per Village, Composition):
     hanya judul — isi grafiknya yang dilipat.
   - Monthly Report: hanya judul — pratinjau + tren bulanan + tombol
     Print/Export ikut tersembunyi.
   - Hubungi Kami / Paket Adopsi / Camat / Layanan warga: judul + hint.
   - Kartu Anin: judul + sapaan (wajah, tips, dan tombol aksi tersembunyi).
   - Kartu pencarian: label "Search everything" (kolom + hasil tersembunyi).
3. **Status lipat/buka tersimpan per kartu di localStorage**, kunci baru
   `desaai-home-collapsed-v1`. Default: semua kartu TERBUKA saat pertama
   kali; setelah Bos melipat sekali, tetap terlipat di kunjungan berikutnya
   (termasuk setelah reload).
4. **Aksesibilitas:** tombol memakai `aria-expanded` + `aria-label`
   ("Kecilkan kartu" / "Tampilkan detail", ikut bahasa id/en); ukuran
   40×40 px — cukup besar untuk jari di HP; ikut mode gelap lewat variabel
   tema (tombol di kartu IKM yang biru memakai latar putih transparan supaya
   tetap terbaca).
5. **i18n:** string baru `homeCollapse` / `homeExpand` (id/en); aria-label
   tombol ikut berganti bahasa lewat `applyLang()`.
6. **Versi:** `APP_PAKET` 37 → 38; teks statis "0.1.0 · Paket 38".

## Cara kerja (teknis)

- Tiap kartu yang bisa dilipat ditandai `data-card="<kunci>"` di `index.html`;
  kartu IKM Trend sengaja TIDAK ditandai, jadi `initHomeCollapse()` tidak
  menyentuhnya sama sekali.
- Elemen ringkas yang harus tetap terlihat ditandai class `bento-keep`;
  CSS `.bento-card.collapsed` menyembunyikan semua anak langsung kartu
  kecuali `.bento-label`, `.bento-keep`, dan tombolnya. Dua kartu
  berstruktur khusus (pencarian, Anin — judulnya bukan anak langsung)
  ditangani aturan CSS terpisah.
- Tombol dibuat sekali di `initHomeCollapse()` (dipanggil `initHome()`);
  `renderHome()` hanya mengubah teks/isi di dalam kartu, jadi tombol tidak
  hilang saat data di-render ulang. Status dibaca dari localStorage saat
  boot dan disimpan setiap kali tombol diklik.

## File yang diubah

- `index.html` — `data-card` di 17 kartu + `bento-keep` di elemen ringkas +
  teks versi Paket 38.
- `src/main.ts` — `initHomeCollapse()`, `setCardCollapsed()`,
  `loadHomeCollapsed()` / `saveHomeCollapsed()`, `updateCollapseButtons()`
  (dipanggil `applyLang()`); `APP_PAKET` 38.
- `src/i18n.ts` — string `homeCollapse` / `homeExpand`.
- `src/styles.css` — gaya `.bento-collapse-btn`, aturan
  `.bento-card.collapsed`, ruang judul untuk tombol.
- `scripts/headless-test.mjs` — cek Paket 38 (di bawah) + satu perbaikan
  pemetaan nama kartu (lihat catatan).
- `scripts/screenshot-p38.mjs` (baru) — screenshot 390px light+dark.
- `screenshots/p38-*.png` (6 file, baru).

## Verifikasi

- `npm run build` — lolos.
- `npm run test:headless` — **410/410 checks passed, exit 0**.
- `npm run test:pwa` — **16/16**.
- `npm run check:secrets` — bersih.

Cek headless baru (Paket 38):

- 17 dari 18 kartu Beranda punya tombol lipat; IKM Trend tidak punya tombol
  dan grafiknya tetap tampil.
- Tombol mulai terbuka ("−", `aria-expanded=true`).
- Klik "−" di This Month → kartu terlipat, judul + angka bulan tetap
  terlihat, tombol jadi "+" (`aria-expanded=false`,
  aria-label "Tampilkan detail").
- Melipat Monthly Report menyembunyikan pratinjau + tombol Print/Export.
- Status lipat tersimpan di localStorage (`desaai-home-collapsed-v1`
  berisi "month" + "report") dan tetap terlipat setelah reload.
- Klik "+" membuka lagi dan membersihkan status tersimpan; cek mengembalikan
  semua kartu ke keadaan terbuka supaya cek-cek sesudahnya melihat Beranda
  utuh.

## Screenshot (390px, light + dark)

- `screenshots/p38-home-open-light.png`, `p38-home-open-dark.png` —
  Beranda semua terbuka.
- `screenshots/p38-home-collapsed-light.png`,
  `p38-home-collapsed-dark.png` — Beranda sebagian terlipat (atas halaman).
- `screenshots/p38-home-month-collapsed-light.png`,
  `p38-home-month-collapsed-dark.png` — close-up: kartu This Month terlipat
  (tombol "+", judul + angka tetap terlihat), kartu IKM Trend di bawahnya
  tanpa tombol dan grafiknya utuh, kartu Complaints by Type / Officers per
  Village masih terbuka (tombol "−").

## Catatan

- Perbaikan kecil di tes (bukan aplikasi): pemetaan nama kartu di cek bento
  memakai `className.split(" ").slice(1)` — sejak Paket 38 kartu mendapat
  class tambahan `has-collapse` dari JS, namanya jadi
  "bento-search.has-collapse" dan cek himpunan gagal. Pemetaan kini mengambil
  class `bento-*` yang spesifik.
- Kartu yang dihapus di Paket 37 (backup, kop surat) tidak dibuat ulang.
- Paket 39 nanti menghapus 3 kartu (Complaints by Type, Officers per
  Village, Composition by Position) — tombol lipat di ketiganya ikut
  terhapus bersama kartunya; Paket 40 menghapus kartu Hubungi Kami — sama.

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
