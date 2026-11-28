# Paket 34 (C) — Laporan: Ide 7–9 (Notulen Rapat, Bahasa Bangka, Mode Darurat)

- **Branch:** `p34-c` (base `ff8a6a4`) — worktree `~/workspace/buildhybridai/desa-ai-p34-c/`
- **Tanggal:** 28 Nov 2026
- **Perintah Bos:** 28 Nov 00:09 WIB (ide 1–9 disetujui; #10 ditunda)
- **Status:** SELESAI dibangun, TIDAK di-deploy (menunggu Gas Bos). Tidak ada push ke remote.

## Ide 7 — Ringkasan rapat otomatis (Notulen Rapat) ✅ JADI

- Panel **"Notulen Rapat — dari catatan rapat"** di tab **Ringkasan**, di bawah kartu
  peringkas dokumen. Tempel catatan rapat → **Buat notulen** → notulen terstruktur:
  Tanggal, Peserta, Agenda, Keputusan, Tindak Lanjut (+ penanggung jawab bila
  disebut, mis. `PJ: Budi Santoso`).
- Parser murni di `src/notulen.ts` (offline, rule-based, tanpa AI): **tidak pernah
  mengarang** — bagian yang tidak ada di catatan tampil "—"; nama/tanggal hanya
  diambil bila tertulis jelas. Tombol **Buat surat tindak lanjut** mengisi
  formulir Surat Dinas (perihal "Tindak Lanjut Hasil Rapat tanggal …" + isi
  keputusan/tindak lanjut/peserta) lalu pindah ke tab Surat.
- **Audio (transkripsi) — KENDALA, dilaporkan sesuai perintah:**
  - Deteksi dipakai SAMA seperti mikrofon Anin (`SpeechRecognition ??
    webkitSpeechRecognition`).
  - Di headless Chrome VM ini konstruktornya **ADA** (`standard=true,
    webkit=true`), tombol dikte tampil, dan klik dikte tidak crash.
  - **TAPI transkripsi live TIDAK terbukti di VM ini:** klik dikte berakhir
    dalam <3 detik tanpa transkrip (tidak ada mikrofon; layanan speech Google
    tidak terjangkau — tunnel VM diblokir). Pesan error-nya kini dipertahankan
    di status (sebelumnya terhapus oleh `onend` — diperbaiki).
  - Bila peramban TIDAK mendukung SpeechRecognition (mis. Firefox/Safari),
    tombol dikte **disembunyikan** dan tampil pesan jujur: *"Peramban ini
    tidak mendukung transkripsi audio — tempel teks rapat di kolom di atas."*
  - Jalur teks (tempel → notulen) jalan penuh tanpa audio — teruji 21/21.
  - **Butuh Bos:** coba dikte di HP/Chrome Bos (mikrofon + jaringan normal)
    untuk membuktikan transkripsi live; di VM ini tidak bisa dibuktikan.

## Ide 8 — Anin Bahasa Bangka ✅ JADI

- Sakelar **"Jawab dalam Bahasa Bangka"** di kepala panel Anin, tersimpan di
  `localStorage` (`desaai-bangka-v1`, bertahan setelah reload — teruji).
- Sakelar aktif: sapaan Anin + jawaban prosedur **KTP, KK, surat pengantar,
  pengaduan** dalam Bahasa Bangka (`src/bahasa-bangka.ts`). Topik lain dijawab
  Bahasa Indonesia + catatan jujur *"Anin jawab pakai Bahasa Indonesia dulu —
  jawaban Bahasa Bangka untuk ini lom ade."* Jalur AI (cloud/on-device) juga
  diberi panduan kata Bangka yang sama supaya AI tidak mengarang kosakata.
- Istilah administrasi (KTP, KK, Disdukcapil, RT/RW) tetap Bahasa Indonesia —
  di Bangka memang dipakai apa adanya.

### Daftar frasa Bangka yang dipakai + keyakinan (UNTUK DIVERIFIKASI BOS)

Sumber verifikasi: Kamus Bahasa Bangka Belitung (Scribd), Wikipedia Bahasa
Bangka, Kamus Indonesia–Melayu Bangka (Kantor Bahasa Prov. Kep. Bangka
Belitung), rubrik Bahasa Bangka Pangkal Pinang (SMP Budi Mulia), Kamus
Bangka–Indonesia (Buspy). Detail sumber per kata ada di `src/bahasa-bangka.ts`
(`BANGKA_PHRASES`).

| Bangka | Indonesia | Keyakinan |
|---|---|---|
| aok / auk | iya | YAKIN |
| ape | apa | YAKIN |
| apetah | mengapa | YAKIN |
| pacak | bisa | YAKIN |
| dak | tidak | YAKIN |
| ku | saya / aku | YAKIN |
| ikak | kamu / kalian | YAKIN |
| ka | kamu | CUKUP YAKIN |
| kelak | nanti | YAKIN |
| agik | lagi / masih | YAKIN |
| sikok | satu | YAKIN |
| bai | cuma / hanya | YAKIN |
| bi | saja | CUKUP YAKIN |
| lah | sudah | YAKIN |
| lom | belum | CUKUP YAKIN |
| ade | ada | YAKIN |
| asak | kalau / asalkan | CUKUP YAKIN |
| aek | air | YAKIN |
| mintak | minta | YAKIN |
| cemane | bagaimana | YAKIN |
| sape | siapa | YAKIN |
| saro | sulit / susah | YAKIN |
| kawa | mau | CUKUP YAKIN |
| bise | dapat / mampu | CUKUP YAKIN |
| urang | orang | YAKIN |
| umah | rumah | YAKIN |
| gey | pergi | CUKUP YAKIN |
| terima kaseh | terima kasih | CUKUP YAKIN |
| selamat pagi/siang/sore/malam | sama (sapaan Melayu baku) | YAKIN |
| di mane | di mana | CUKUP YAKIN |
| akhiran -e | -nya | YAKIN |

**Sengaja TIDAK dipakai** (tidak terverifikasi — jangan dipakai sebelum Bos
mengonfirmasi): `lum` (bentuk benar "belum" adalah `lom`), `ngape`
("mengapa" yang terverifikasi adalah `apetah`), `tulung` (tidak ditemukan),
`kite` (tidak ditemukan), `nek` (makna ambigu di contoh kalimat).
Catatan dialek: Bangka punya beberapa dialek (Belinyu akhiran -o, Toboali
akhiran -e dan s→h, Pangkal Pinang e keras); frasa di sini memakai bentuk
netral/Pangkal Pinang yang paling umum — **mohon Bos koreksi bila ada kata
yang kurang tepat untuk Simpangkatis**.

## Ide 9 — Mode Darurat ✅ JADI

- Blok **"Mode Darurat — surat bencana, satu ketuk"** di area Surat Cepat
  (tab Surat), aksen merah tipis supaya langsung dikenali; 8 tombol:
  **Banjir, Kebakaran, Tanah Longsor, Gempa Bumi × Laporan Kejadian /
  Permohonan Bantuan**.
- Satu ketuk mengisi formulir dengan kerangka itu (jenis bencana terisi);
  petugas melengkapi lokasi, waktu, korban/kerusakan lalu **Buat draf**
  seperti biasa (jalur offline ikut bekerja — draf darurat teruji
  menyebut jenis bencana + lokasi).
- Template baru (2): `darurat-laporan` (Surat Laporan Kejadian Darurat) dan
  `darurat-bantuan` (Surat Permohonan Bantuan Darurat) — total template kini
  9. **Template lama tidak diubah** (7 template lama utuh — teruji).
- Perintah Anin: **"surat darurat banjir"** (tanpa kata kerja "buat") →
  tab Surat + template Laporan Darurat + jenis Banjir. `parseDarurat`
  mengembalikan null bila tidak ada jenis bencana yang jelas (tidak ditebak).
- Perintah Anin dengan kata kerja juga jalan via Surat Cepat biasa
  ("buatkan surat permohonan bantuan darurat banjir" → darurat-bantuan).

## File yang diubah / dibuat

**Dibuat:**
- `src/notulen.ts` — parser notulen + format + kolom surat tindak lanjut.
- `src/bahasa-bangka.ts` — frasa + jawaban prosedur Bangka + keyakinan.
- `scripts/headless-p34-c.mjs` — cek headless Ide 7–9 (21 cek).
- `scripts/screenshot-p34-c.mjs` — screenshot terang+gelap fitur baru.
- `screenshots/p34c-notulen-light.png`, `p34c-notulen-dark.png`,
  `p34c-darurat-light.png`, `p34c-darurat-dark.png`,
  `p34c-bangka-light.png`, `p34c-bangka-dark.png`.
- `PAKET-34-C-LAPORAN.md` (file ini).

**Diubah:**
- `src/templates.ts` — 2 template darurat + tubuh surat offline-nya.
- `src/cepat.ts` — aturan + ekstraksi darurat, `parseDarurat`,
  `daruratCepatResult`, `DARURAT_JENIS`.
- `src/anin-chat.ts` — intent darurat Anin (sebelum aturan surat biasa).
- `src/anin-kb.ts` — entri KB Anin: notulen, Bahasa Bangka, Mode Darurat.
- `src/i18n.ts` — string id/en baru (notulen, darurat, Bangka); `adopsiNote`
  "7 template" → "9 template".
- `src/main.ts` — `initNotulen()`, grid Mode Darurat, sakelar + jawaban Bangka,
  panduan Bangka untuk jalur AI.
- `index.html` — panel Notulen, blok Mode Darurat, sakelar Bangka di panel Anin.
- `src/styles.css` — gaya `.darurat-box/.darurat-grid/.darurat-btn`,
  `.anin-bangka-row`.

**Tidak disentuh:** `PAKET-35/36-LAPORAN.md`, `gh-pages`, deploy, nama aplikasi.

## Verifikasi

- `npm run build` — LOLOS (tsc + vite).
- `node scripts/headless-p34-c.mjs` — **21/21 cek lolos** (login, notulen dari
  teks + PJ + surat tindak lanjut, sakelar Bangka + jawaban KTP/pengantar +
  fallback + persistensi reload, 8 tombol darurat + satu ketuk + perintah
  Anin + draf offline, template lama utuh, 0 console error, 0 failed request
  — di luar noise tunnel VM).
- `npm run test:headless` (suite koordinator, regresi) — **396/401** pada
  run pertama di branch ini; base `ff8a6a4` (tanpa perubahan saya) **401/401**.
  Analisis 5 gagal di branch ini:
  - 2 adalah konsekuensi yang diharapkan dari penambahan fitur (BUKAN bug):
    `adoption pack … 7 templates` → kini 9 (2 template darurat baru), dan
    `six forms have blue header banners` → kini 7 (kartu Notulen baru).
    Ekspektasi kedua cek di `headless-test.mjs` (milik koordinator — tidak
    saya edit) perlu diperbarui 7→9 dan 6→7.
  - 3 cek Tanya ("answers a KK question", "explains Anin answered offline",
    "read-aloud …") gagal dengan status `Memproses…` (output kosong):
    handler Tanya masuk cabang AI async (`svc.status === "ready"`) dan
    jawaban belum kembali dalam tunggu tetap 600ms di tes. **Kode jalur
    Tanya tidak saya sentuh** (diff `main.ts` tidak menyentuh `initQa`,
    `svc`, atau Firebase — terverifikasi via `git diff`); ini balapan
    waktu antara selesainya init Firebase dan tunggu tetap tes di VM ini.
    Verifikasi ulang: suite dijalankan kedua kali di branch ini —
    **399/401, hanya 2 gagal yang diharapkan di atas**; ketiga cek Tanya
    lolos. Jadi kegagalan Tanya di run pertama adalah balapan waktu
    (bukan regresi dari perubahan saya).
- `npm run check:secrets` — BERSIH.
- Screenshot: 6 file (390px, terang+gelap), diperiksa visual — notulen,
  tombol darurat, dan jawaban Bangka tampil benar di kedua tema.

## Temuan di luar Paket 34-C (dilaporkan, tidak diperbaiki di sini)

- **Quirk pra-ada (Paket 35):** di headless Chrome VM ini (file://), bahasa
  tersimpan di `localStorage` (`desaai-lang-v1`) TIDAK terbaca saat boot modul
  — UI tetap Inggris sampai tombol bahasa diklik, meski `localStorage` berisi
  "id" (probe 60 detik + `reload()`/`goto()` sama saja; toggle bahasa
  bekerja normal). Di situs live (https, boot lengkap) `applyLang` jalan,
  jadi kemungkinan hanya quirk lingkungan headless file:// ini. Tidak
  disentuh karena di luar cakupan Paket 34-C; bila Bos mau, bisa jadi paket
  perbaikan tersendiri.

## Yang masih butuh Bos

1. **Verifikasi frasa Bangka** di tabel atas (khususnya yang CUKUP YAKIN:
   `ka, bi, lom, asak, kawa, bise, gey, terima kaseh, di mane`) — koreksi
   bila ada yang kurang tepat untuk Simpangkatis.
2. **Uji dikte notulen live** di HP/Chrome Bos (mikrofon + jaringan normal) —
   di VM ini transkripsi tidak bisa dibuktikan.
3. **Gas deploy** bila sudah setuju (koordinator yang merge + deploy).
