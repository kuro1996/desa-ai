# PAKET 40 — Tab Contact Person, hapus kartu Hubungi Kami dari Beranda

Perintah Bos: 28 Nov 2026 12:02 WIB (koreksi atas pesan sebelumnya: kartu
Hubungi Kami di Beranda JANGAN dipertahankan). Tanggal pengerjaan:
28 Nov 2026. Commit di main (bukan deploy — deploy nanti gabung Paket
37–40 atas Gas Bos 12:03 WIB).

## Yang berubah

1. **Kartu "Hubungi Kami" dihapus dari Beranda** (`#home-contact-card`).
   Beranda kini 14 kartu.
2. **Menu/tab baru "Contact Person" di sidebar**, posisinya tepat **DI ATAS
   tab "Pengaturan"** (setelah Agenda Surat / Mail Register, sebelum
   Pengaturan). Sidebar kini 11 tab.
3. **Seluruh detail kontak pindah ke tab baru sebagai halaman penuh**
   (bukan kartu kecil). Data persis dari gambar Bos 28 Nov 10:40 WIB —
   tidak diubah/dikoreksi, tidak ada URL profil yang dikarang:
   - Alamat: Jl. Merdeka No 02 Desa Katis, Kode Pos 33674
   - Telepon: 08117121844 (tautan `tel:`)
   - Email: kec.spkatis2014@gmail.com (tautan `mailto:`)
   - Facebook: "kantor kecamatan simpangkatis" (teks saja)
   - Twitter/X: @kec_simpangkatis (teks saja)
   - Instagram: kecamatansimpangkatis (teks saja)
4. **Tab baru tampil untuk SEMUA mode (Warga dan Petugas)** — info kontak
   publik kantor, bukan officer-only seperti Pengaturan. Tab ini sengaja
   TIDAK dimasukkan ke `OFFICER_TABS` maupun aturan CSS `body.mode-warga`
   yang menyembunyikan tab petugas.
5. **Rujukan ke kartu lama diperbarui:**
   - Tombol "Kontak kantor" di Pengaturan → Bantuan & Tentang
     (`#set-contact-link`) kini **MEMBUKA tab Contact Person** (dulu scroll
     ke kartu Beranda — kartu itu sudah tidak ada).
   - Perintah Anin "buka contact person" / "buka kontak" membuka tab baru
     (kata kunci ditambah ke `TAB_KEYWORDS`; label tab didaftarkan di
     `ANIN_TAB_I18N`). Tidak ada perintah Anin lain yang merujuk kontak.
   - Nol referensi tersisa ke `home-contact-card` di `src/` + `index.html`
     (grep) — tidak ada null-crash.
6. **i18n id/en:** label menu `tabKontak` ("Contact Person"), judul halaman
   `contactPageTitle` ("Contact Person"), hint `contactPageHint` — mengikuti
   pola string yang sudah ada. Tab ini ikut mode gelap + ukuran teks +
   bahasa seperti tab lain (judul halaman mengikuti page head yang sudah
   ada; daftar kontak memakai gaya `.contact-list` yang sama seperti kartu
   lama).
7. **Deep link:** hash `#kontak` membuka tab Contact Person langsung
   (`TAB_HASHES`).
8. **Versi:** `APP_PAKET` 39 → 40; teks statis "0.1.0 · Paket 40".

## File yang diubah

- `index.html` — kartu Hubungi Kami dihapus; tombol tab Contact Person
  (ikon telepon+amplop) di antara Agenda dan Pengaturan; panel baru
  `#panel-kontak` (judul + hint + daftar kontak yang dipindah persis);
  teks versi Paket 40.
- `src/main.ts` — `TAB_HASHES` + `ANIN_TAB_I18N` (entri kontak);
  `set-contact-link` → `activateTab("kontak")`; `APP_PAKET` 40.
- `src/anin-chat.ts` — kata kunci navigasi kontak di `TAB_KEYWORDS`.
- `src/i18n.ts` — string `tabKontak`, `contactPageTitle`,
  `contactPageHint`.
- `scripts/headless-test.mjs` — cek Paket 40 (di bawah); cek bento 15→14;
  cek tombol lipat 14→13; cek tab sidebar 10→11 (dua tempat).
- `scripts/screenshot-p40.mjs` (baru) — screenshot 390px light+dark.
- `screenshots/p40-*.png` (4 file, baru).

## Verifikasi

- `npm run build` — lolos.
- `npm run test:headless` — **413/413 checks passed, exit 0**.
- `npm run test:pwa` — **16/16**.
- `npm run check:secrets` — bersih.

Cek headless baru (Paket 40):

- Kartu Hubungi Kami TIDAK ada lagi di Beranda; tab Contact Person ada di
  sidebar tepat di atas Pengaturan (setelah Agenda Surat), labelnya
  "Contact Person".
- Klik tab → halaman kontak tampil lengkap 6 baris dengan data persis di
  atas (alamat, telepon `tel:08117121844`, email
  `mailto:kec.spkatis2014@gmail.com`, 3 sosmed teks saja tanpa tautan
  karangan — hanya 2 tautan di halaman); judul page head "Contact Person".
- Tombol "Kontak kantor" di Pengaturan membuka tab Contact Person.
- Tab terlihat juga dalam Mode Warga (sementara Pengaturan tetap
  officer-only / tersembunyi).
- Anin "buka contact person" membuka tab Contact Person.
- Semua 11 tab punya ikon SVG + label (termasuk Contact Person).

## Screenshot (390px, light + dark)

- `screenshots/p40-kontak-top-light.png`, `p40-kontak-top-dark.png` —
  atas halaman: tab "Contact Person" aktif di antara Mail Register dan
  Settings + judul halaman "Contact Person" dengan hint-nya.
- `screenshots/p40-kontak-light.png`, `p40-kontak-dark.png` — halaman
  kontak penuh: 6 baris (Alamat, Telepon, Email, Facebook, Twitter/X,
  Instagram) di kedua tema.
