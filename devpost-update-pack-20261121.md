# Devpost Update Pack — DesaAI (project 1305863)
Disiapkan 2026-11-21 (Paket 6). **Bos yang edit + submit sendiri** di
https://devpost.com/software/desaai — batas edit **1 Des 2026 05:00 WIB**.
Live: https://kuro1996.github.io/desa-ai/ — Repo: https://github.com/kuro1996/desa-ai

## 1. Deskripsi proyek — versi baru (tempel ke kolom Description)

**DesaAI — offline-first AI clerk for Indonesian village & subdistrict offices.**

Village offices run on paper, WhatsApp, and memory. DesaAI is a single-page
web app that drafts formal official letters, summarizes long documents, and
answers procedure questions — with **Firebase AI Logic hybrid inference**:
short, private prompts run **on-device (Gemini Nano 4)** when available, and
long or complex prompts fall back to **cloud Gemini**. Every answer shows a
visible routing badge ("On-device • private" vs "Cloud") and the reason it
routed that way, so staff always know where their data went.

**What it does (8 tabs):**
- **Draft Letters** — 7 templates (Surat Dinas, SK, Undangan, Pengantar,
  Surat Keterangan, **SKTM — Surat Keterangan Tidak Mampu**, SK Pengangkatan
  Perangkat Desa), automatic per-template letter numbering, editable drafts,
  print-ready formal layout, letter archive.
- **Summarize** — paste minutes, regulations, or reports; get a concise
  summary (long inputs route to cloud automatically).
- **Procedure Q&A** — KTP, KK, domisili, SKTM, birth/death certificates,
  moving, business certificates — grounded in a built-in knowledge base
  that works fully offline, with tickable document checklists.
- **Personnel / Kepegawaian (SIAP AKAD)** — staff of the Simpangkatis
  subdistrict office and village officers of its 10 villages; automatic
  term-of-office status (Aktif / Akan habis / Habis), expiry notifications,
  per-village cards, 6 village institutions, "Buat SK" prefills the
  appointment decree from any record.
- **IKM — community satisfaction survey** (PermenPAN-RB 14/2017, 9 elements,
  score = mean × 25, categories A–D) with a shareable link + locally
  generated QR code for the service counter, CSV export, and a cumulative
  trend chart.
- **Pengaduan (Complaints)** — anonymous reporting, Baru → Diproses →
  Selesai tracking, status/type filters, detail dialog, CSV export.
- **Home dashboard** — bento grid: live IKM, letters today, **oldest
  unresolved complaints with waiting time**, expiring terms, monthly
  totals, IKM trend, and a **printable monthly report** (now with a
  "Perlu perhatian" action section).
- **My Drafts** — local library + JSON backup of all data.

**Built for real offices:** bilingual UI (English/Indonesian), dark mode,
deep links per tab (`#ikm` for the survey), global search, mobile-first,
no external fonts or CDNs (only Firebase). Sample data is clearly labelled
"Data Contoh — bukan data asli" in every module. AI drafts must be reviewed
by a human officer before use.

**Tech:** Vite + TypeScript, Firebase AI Logic (Gemini Nano 4 on-device +
Gemini cloud fallback), Firestore mirror (best-effort), localStorage-first
so the office keeps working offline. 130 automated headless-Chrome checks
green on every build.

## 2. Yang baru sejak submit (untuk kolom "What's new" / pembaruan deskripsi)

- **Rebuild (20 Nov):** digabung dengan SIAP AKAD — administrasi
  kepegawaian 10 desa + administrasi surat + status pegawai otomatis.
- **Paket 2–3:** link + QR survei IKM, logo Simpangkatis, ikon tiap menu.
- **Paket 4:** hero foto kantor, polish elegan, upgrade fitur.
- **Paket 5:** beranda bento, mode gelap, pencarian global, laporan bulanan
  (cetak), tren IKM.
- **Paket 6 (21 Nov):** daftar pengaduan belum selesai di Beranda (dengan
  lama menunggu), ekspor CSV pengaduan, template SKTM baru, seksi "Perlu
  perhatian" di laporan bulanan cetak, theme-color mobile. Tes headless
  125 → 130 cek, semua hijau.
- **Paket 7 (21 Nov sore):** command palette (Ctrl+K) — lompat ke menu/aksi
  apa pun dari keyboard; **Mode Warga** — tampilan sederhana untuk warga
  (hanya Survei IKM, Pengaduan, Tanya Prosedur; menu petugas disembunyikan);
  grafik batang pengaduan per jenis di Beranda; **database Firestore
  (default) dibuat di Jakarta (asia-southeast2) dengan aturan terkunci
  per pengguna** — cermin Firestore kini aktif. Tes headless 130 → 137
  cek, semua hijau.
- **Paket 8 (21 Nov sore):** sinkronisasi Firestore otomatis saat aplikasi
  dibuka (IKM + pengaduan + kepegawaian) — data lokal yang tersimpan saat
  Auth belum aktif terunggah sendiri saat reload. **Auth Anonymous
  dinyalakan 21 Nov 17:57 WIB** (sebelumnya belum pernah disetup — itulah
  penyebab survei pertama Bos tidak masuk database). Tes headless 137 cek,
  semua hijau.
- **Paket 9 (21 Nov sore):** indikator status sinkronisasi di header —
  chip Firebase menampilkan jam sinkron terakhir ("Firebase: terhubung ·
  Tersinkron 18:26") atau "Belum tersinkron". **Tulisan pertama Bos
  TERVERIFIKASI masuk Firestore 21 Nov 18:27 WIB** (users/{uid}/ikm/rekap:
  14 item — 12 demo + 2 jawaban Bos; updatedAt 18:26:08 WIB). Tes
  headless 138 cek, semua hijau.

## 3. Checklist sebelum Bos tekan submit

- [ ] Tempel deskripsi baru (bagian 1) ke Devpost.
- [ ] Pastikan link live https://kuro1996.github.io/desa-ai/ masih diisi.
- [ ] (Opsional) Tambah screenshot baru: Beranda bento + daftar pengaduan.
- [ ] Submit sebelum **1 Des 2026 05:00 WIB**.

## 4. Catatan jujur (jangan ditulis di Devpost, untuk Bos saja)

- Cloud generation masih belum terbukti dari VM (endpoint Google tidak
  terjangkau dari VM) — butuh tes tombol Generate dari HP Bos.
- Jawaban survei IKM tersimpan di localStorage responden (mirror Firestore
  best-effort) — tidak auto-sync ke dashboard kantor. **Update 21 Nov sore:
  database Firestore (default) sudah dibuat di Jakarta + aturan terkunci
  per pengguna diterbitkan, jadi cermin Firestore kini BISA jalan — perlu
  tes tulis dari HP Bos (kirim satu pengaduan/survei, cek muncul di
  console Firestore).**
- Sprint 2 quota Firebase: jendela s.d. **24 Nov 15:00 WIB**.
