# Paket 41 — Hapus 4 Kartu Beranda + Rapikan Header Dashboard Kantor

Tanggal: 28 November 2026 (sore, setelah deploy Paket 34 live).
Perintah Bos: 5 screenshot koreksi dari HP, 14:14–14:21 WIB, situs live
setelah deploy Paket 34. Satu paket, satu commit, **TIDAK deploy** —
deploy menunggu Gas Bos secara terpisah.

Main HEAD sebelum mulai: `982eaf0` (terkonfirmasi). Commit Paket 41: lihat
`git log`.

## 1. Yang dihapus dari Beranda (15 kartu → 11 kartu)

| # | Kartu | Perintah Bos | Verifikasi "sudah ada di menu" |
|---|-------|--------------|-------------------------------|
| 1 | **Adoption Pack for Other Villages** (`home-adopsi-card`) — 5 langkah adopsi + tombol "Download adoption pack (JSON)" | "Ini dihapuskan saja sudah ad dipengaturan" | **TIDAK ADA di Pengaturan** — hanya kartu Beranda yang memilikinya. Maka fungsi **DIPINDAHKAN, bukan dihapus** (pola Paket 37/Restore): tombol + status baru `set-adopsi-download` / `set-adopsi-status` di Pengaturan → grup **Bantuan & Tentang** (index.html, sesudah baris kontak), dihubungkan di `initSettings()` dengan logika unduh yang sama persis (`buildAdoptionPack` + `downloadFile` + `setStatus`). Berkas JSON tetap berisi kop surat, 9 template surat, dan checklist adopsi 5 langkah, tanpa data kantor. Jawaban Anin (`aninFaqAdopsi`) diperbarui: "di Pengaturan, bagian Bantuan & Tentang". |
| 2 | **Needs Follow-Up** (`home-followup-card`) — "5 complaints · 2 register items · 3 staff SK", daftar Hadi Wijaya, Rizky Ramadhan, Agus Setiawan, Sinta, Anonymous, dst. | "Ini juga sudah ad di menu data kepegawaian gk usah ditampilkan lagi" | **Terkonfirmasi, ketiga sumber terjangkau:** SK pegawai di **Data Kepegawaian** (`keg-sk-list` / `keg-sk-count`, "Pengingat Masa Berlaku SK"); pengaduan di tab **Pengaduan** (`panel-pengaduan`); register surat di tab **Agenda Surat** (`panel-agenda`). Dicek otomatis oleh suite headless (cek Paket 41 baru). |
| 3 | **Tren IKM — Skor dari Waktu ke Waktu** (`.bento-trend`, `#home-ikm-trend`) — grafik garis skor kumulatif setelah tiap jawaban survei | "Ini hapus juga tampilan didashboard sudah ada dimenu IKM" | **SEBAGIAN.** Tab **Kepuasan/IKM** menampilkan skor + batang per unsur (9 batang, dicek headless) + unsur terendah/tertinggi — **tetapi TIDAK ada grafik garis skor-dari-waktu-ke-waktu di sana**. Perintah terbaru Bos merevisi perintah Paket 38 ("hasil IKM tidak usah diubah"); kartu dihapus sesuai perintah terbaru. Yang hilang dicatat di §3. Kartu biru **SKOR IKM 90,28** (`home-ikm-score`, "Buka survei") **TETAP** — tidak disentuh. |
| 4 | **Surat Hari Ini** (`data-card="letters-today"`, `#home-letters-today`, tombol "Buat surat") — "0 — draf tersimpan hari ini" | "Ini juga hapus aja tampilannya dan cuma ad di draft surat" | **Terkonfirmasi:** tab **Draf Surat** (`panel-letters`, tombol Generate/Simpan draf) dan tab **Arsip & Draf** (`panel-drafts`, `#drafts-list`) menampilkan draf tersimpan + aksi buat surat. Dicek otomatis oleh suite headless. Kartu **BULAN INI** (rekap bulanan) dan tabel ringkasan di atas **TIDAK disentuh**. |

Yang tetap: Monthly Report, Terms of Office, This Month, New Complaints,
Search, Anin, Morning Briefing, Camat Dashboard, Mode Warga, Pengingat,
dan semua tab lain (termasuk Contact Person).

## 2. Header Beranda dirapikan ("Dashboard kantor")

Perintah Bos: "Ini designnya dibagus lagi dan dirata lagi, dirapi lagi
cara referensinya biar enak dilihat."

Masalah di screenshot Bos (dikonfirmasi dari build lama):
- Foto kantor (`kantor.jpg`) nyaris tidak kelihatan — overlay gradien
  lama terlalu pekat (opasitas 0,94 / 0,88 / 0,90), foto jadi cucian biru.
- Pil dan tombol menumpuk dalam satu aliran yang sama — baris aksi
  membungkus sembarangan; tombol paling kanan (⌘K) terpotong di tepi.
  Catatan: tombol "K" yang disebut Bos adalah tombol **⌘K (Command
  Palette)**, bukan tombol ukuran teks — tombol ukuran teks ada di
  Pengaturan, bukan di header.

Perbaikan (`index.html` + `src/styles.css`):
- **Struktur kanan header jadi 3 baris rapi:** (1) `.page-head-meta`
  (pil tanggal + lonceng badge), (2) `.top-actions` (3 pil status:
  On-device / Firebase / Online), (3) `.page-head-actions` (4 tombol:
  tema, bahasa, mode, ⌘K). Tiap baris `flex-wrap` sendiri dengan gap
  konsisten — tombol yang tidak muat turun ke baris berikut, bukan
  terpotong.
- **Padding dilonggarkan:** 22px 24px → 26px 28px (desktop),
  16px → 20px 18px (HP). Judul rata kiri dengan `max-width: 600px`.
- **Foto kini kelihatan:** gradien diubah jadi gelap di kiri (tempat
  teks, 0,92) dan makin transparan ke kanan (0,55 / 0,45) — gedung
  kantor, papan nama SIMPANGKATIS, dan umbul-umbul merah-putih terlihat
  jelas, teks putih tetap terbaca, identitas biru-putih dipertahankan.
- **Semua fungsi header tetap jalan:** pil tanggal, lonceng + badge (7),
  pil status, toggle tema, tombol bahasa, tombol mode, ⌘K — tidak ada
  id/handler yang diubah, hanya pembungkus dan CSS.
- **Tidak ada overflow horizontal di 390px** — dibuktikan oleh cek
  headless baru (`docOverflow=0`, tepi kanan header = 390, tombol ⌘K
  utuh di x ≤ 224, pil tanggal terlihat).

Screenshot sebelum/sesudah (390px, light + dark):
`screenshots/p41-sebelum-header-{light,dark}.png` (build HEAD 982eaf0,
dari worktree sementara — sudah dihapus sesudah dipakai) vs
`screenshots/p41-header-{light,dark}.png` (baru), plus
`screenshots/p41-beranda-{top,}-{light,dark}.png` (Beranda 11 kartu).

## 3. Fungsi yang hilang (dicatat jujur, sesuai aturan Paket 39)

1. **Garis tren IKM kumulatif.** Hanya ada di kartu Beranda yang dihapus.
   Tab IKM tidak punya grafik garis skor-dari-waktu — hanya skor,
   batang per unsur, dan unsur terendah/tertinggi. Bila Bos mau, garis
   ini bisa dipindahkan ke tab IKM sebagai pekerjaan lanjutan (tidak
   diizinkan oleh perintah kali ini).
2. **Daftar tindak lanjut agregat (oldest-first) + badge total.**
   Gabungan "5 complaints · 2 register items · 3 staff SK" dalam satu
   daftar + angka totalnya hilang dari Beranda. Tiap item tetap bisa
   dibuka dari tabnya masing-masing (Pengaduan / Agenda / Kepegawaian).
   Turut hilang: baris agregat **"1 not yet dispositioned"** — tab
   Agenda tetap menampilkan disposisi per surat (atau ketiadaannya)
   di tiap baris, tetapi tidak ada lagi hitungan agregatnya.
3. **Angka "surat hari ini" di Beranda.** Jumlah draf hari ini tidak
   lagi tampil sebagai angka di Beranda; drafnya sendiri tetap terlihat
   di Draf Surat / Arsip & Draf. (Ringkasan Briefing Pagi masih
   menyebut "0 letters today" dalam teksnya — itu kartu lain.)
4. **Tidak hilang:** unduhan adoption pack (pindah ke Pengaturan),
   grafik tren **bulanan** di kartu Bulan Ini (grafik batang 6 bulan ×
   4 seri — tetap tampil), kelas CSS `.trend-chart` / `.followup-*`
   (dipakai grafik bulanan + kartu Pengingat + Anin — dipertahankan).

## 4. Perubahan teknis

- `index.html` — 4 kartu Beranda dihapus; baris adopsi baru di
  Pengaturan (Bantuan & Tentang); header direstrukturasi jadi 3 baris;
  teks versi → "0.1.0 · Paket 41".
- `src/main.ts` — fungsi `renderTrend()` + `ikmTrendPoints()` dan blok
  Paket 16 (`FollowUpItem` / `followUpItems()` / `renderFollowUp()`)
  dihapus; panggilan + handler kartu yang dihapus dicabut; `APP_PAKET`
  40 → 41; komentar lipat Paket 38 diperbarui (semua kartu kini punya
  tombol — Tren IKM yang dulu tanpa tombol sudah tidak ada); wiring
  adopsi ditambahkan di `initSettings()`. `const drafts =
  listLocalDrafts()` dipertahankan (dipakai hitungan surat bulanan).
- `src/i18n.ts` — kunci yang hanya dipakai kartu terhapus dihapus
  (`homeTrendTitle/Hint/Empty`, `homeFollowupTitle/Hint/Empty/Aduan/
  Agenda/NoDisposisi/Sk`, `homeLettersToday`, `homeLettersTodayHint`,
  `homeGoLetters`); `aninFaqAdopsi` + deskripsi tab Beranda diperbarui
  (adopsi → Pengaturan). Semua kunci `adopsi*` dipertahankan (dipakai
  pembangun JSON pack).
- `src/styles.css` — aturan eksklusif kartu terhapus dihapus
  (`.bento-trend`, `.bento-adopsi`, `.bento-followup`,
  `.adopsi-steps`); aturan header ditulis ulang (lihat §2).
- `scripts/headless-test.mjs` — ekspektasi Beranda 15 → 11 kartu,
  tombol lipat 14 → 11; cek baru Paket 41 (4 kartu hilang, sumber data
  terjangkau di menu, tab IKM tanpa tren, header pas di 390px);
  cek unduhan adopsi dipindah ke Pengaturan (`#set-adopsi-download`,
  JSON tetap 9 template + checklist 5 langkah, tanpa data kantor);
  3 cek turunan kartu follow-up diarahkan ulang ke permukaan yang
  bertahan (baris Agenda per-item, ringkasan Briefing Pagi, render
  offline); cek grafik tren dialihkan ke grafik batang bulanan
  (24 rect). Total suite tetap 413 cek.
- `scripts/screenshot-p41.mjs` — baru (Beranda + close-up header,
  390px light+dark; mendukung `DIST_DIR` + `PREFIX` untuk
  perbandingan sebelum/sesudah).

Catatan proses: skrip hapus pertama gagal pada assertion anchor
(baris komentar Paket 16 ternyata di 1296, bukan 1295) — tidak ada
penghapusan yang diterapkan sebelum diperbaiki; penghapusan diulang
dengan anchor yang benar dan diverifikasi lewat grep.

## 5. Hasil verifikasi

| Tes | Hasil |
|-----|-------|
| `npm run build` | Lolos (56 modul, `dist/assets/index-xd5PTE80.js`, CSS `index-DFZWVF-B.css`) |
| `npm run test:headless` | **413/413 lolos** (0 console error, 0 failed request di luar noise tunnel VM). Dua kegagalan sementara selama pengerjaan sudah diperbaiki: selector baris Agenda (tombol aksi ikut membawa `data-id` — dipersempit ke anak langsung) dan grafik bulanan ternyata grafik batang, bukan garis. |
| `npm run test:pwa` | **16/16 lolos** |
| `npm run check:secrets` | Bersih |
| Screenshot 390px light+dark | Beranda 11 kartu + header baru (sebelum/sesudah) — diperiksa visual: foto kantor kini kelihatan, baris-baris rapi, tidak ada yang terpotong |

## 6. Yang belum (menunggu Bos)

- **Deploy ke gh-pages TIDAK dilakukan** — menunggu Gas Bos.
  Perintah deploy seperti biasa (worktree bersih → clone gh-pages →
  salin `dist/` → push → verifikasi `ls-remote` + cek live).
- Bila Bos mau garis tren IKM kumulatif tetap ada, pekerjaan lanjutan
  yang masuk akal: pindahkan grafik garisnya ke dalam tab Kepuasan/IKM
  (di bawah batang per unsur) — beri tahu bila setuju.

## 7. Addendum deploy — LIVE 28 Nov 2026 ~14:52 WIB

- **Gas Bos 14:44 WIB ("Gas, deploy Paket 41")** → agen deploy pertama
  membangun dari `ade308f` (worktree bersih, dist sama persis dengan §5:
  JS `index-xd5PTE80.js`, CSS `index-DFZWVF-B.css`) tapi **BERHENTI di
  langkah clone gh-pages** — execution-risk check sistem menyala.
  Tidak ada yang ter-push; live tetap `713bf80` (Paket 34).
- Bos diberi tahu dalam kata biasa lalu memberi izin eksplisit
  **"Ya lanjutkan" (14:48 WIB)** → deploy dilanjutkan dari keadaan yang
  ditinggalkan (worktree + clone yang sudah disiapkan, tanpa clone ulang).
- **gh-pages baru: `b6dc5e4`** (`713bf80..b6dc5e4`, commit "Deploy Paket
  41 (main ade308f)"), `git ls-remote origin gh-pages` terkonfirmasi
  `b6dc5e434afa49c29ea2ef6b06dffd4c82cc1691`.
- **Cek live (28 Nov ~14:52 WIB, setelah ~60 detik propagasi):**
  index 200, bundle baru `index-xd5PTE80.js` 200, CSS baru
  `index-DFZWVF-B.css` 200, bundle lama `index-bIzYHLsW.js` 404.
  Penanda Paket 41 di bundle live: "Contact Person" ada (1×),
  "Needs Follow-Up" 0×, "Tren IKM" 0×, "Surat Hari Ini" 0×;
  satu-satunya "Adoption Pack" (1×) adalah di Pengaturan
  (`adopsiTitle` i18n + handler `set-adopsi-download`) — fungsi unduh
  yang dipindahkan, bukan kartu Beranda.
- Worktree deploy + clone gh-pages sudah dibersihkan setelah push.
- **Status §6 berubah:** deploy SELESAI (LIVE). Pemindahan garis tren
  IKM ke tab Kepuasan/IKM disetujui Bos 14:44 WIB dan dilipatkan ke
  Paket 42 (bersama desain Beranda ala AIDEN).
