// DesaAI — bilingual UI strings (English default, Indonesian toggle).
// The app must support English at minimum per the hackathon rules;
// letters and procedure answers are always drafted in Indonesian.

export type Lang = "en" | "id";

export const STRINGS: Record<string, { en: string; id: string }> = {
  tagline: {
    en: "AI clerk for village & subdistrict offices",
    id: "Petugas AI untuk kantor desa & kecamatan",
  },
  demoTitle: {
    en: "Demo mode — Firebase not configured yet.",
    id: "Mode demo — Firebase belum dikonfigurasi.",
  },
  demoText: {
    en: "AI features need a Firebase project (free tier). Follow the setup steps in README.md, then paste your web config into src/firebase-config.js. The forms below still work — drafts are saved locally in this browser until Firebase is connected.",
    id: "Fitur AI membutuhkan proyek Firebase (tier gratis). Ikuti langkah setup di README.md, lalu tempel konfigurasi web Anda ke src/firebase-config.js. Formulir di bawah tetap berfungsi — draf tersimpan lokal di browser ini sampai Firebase terhubung.",
  },
  tabLetters: { en: "Draft Letters", id: "Draf Surat" },
  tabHome: { en: "Home", id: "Beranda" },
  themeDark: { en: "Dark mode", id: "Mode gelap" },
  themeLight: { en: "Light mode", id: "Mode terang" },
  // Home dashboard (bento) — Paket 5
  homeTitle: { en: "Office dashboard", id: "Dashboard kantor" },
  homeHint: {
    en: "Today's snapshot of the office: letters, satisfaction, complaints and terms of office — all from the data already in this browser.",
    id: "Gambaran kantor hari ini: surat, kepuasan, pengaduan, dan masa bhakti — semuanya dari data yang sudah ada di browser ini.",
  },
  homeSearch: { en: "Search everything", id: "Cari semua" },
  homeSearchPh: { en: "Search letters, officers, complaints…", id: "Cari surat, pegawai, pengaduan…" },
  homeSearchEmpty: { en: "No results — try another keyword.", id: "Tidak ada hasil — coba kata kunci lain." },
  homeSearchResults: { en: "results", id: "hasil" },
  homeSearchLetters: { en: "Letters & drafts", id: "Surat & draf" },
  homeSearchKeg: { en: "Personnel", id: "Kepegawaian" },
  homeSearchAduan: { en: "Complaints", id: "Pengaduan" },
  homeIkm: { en: "IKM score", id: "Skor IKM" },
  homeIkmLowest: { en: "Lowest element", id: "Unsur terendah" },
  homeLettersToday: { en: "Letters today", id: "Surat hari ini" },
  homeLettersTodayHint: { en: "drafts saved today", id: "draf tersimpan hari ini" },
  homeAduanBaru: { en: "New complaints", id: "Pengaduan baru" },
  homeAduanBaruHint: { en: "waiting for follow-up", id: "menunggu ditindaklanjuti" },
  homeAduanWaiting: { en: "days waiting", id: "hari menunggu" },
  homeAduanEmpty: { en: "All complaints resolved.", id: "Semua pengaduan sudah selesai." },
  homeMasaTitle: { en: "Terms of office — needs attention", id: "Masa bhakti — perlu perhatian" },
  homeMasaAkanHabis: { en: "Expiring ≤ 90 days", id: "Akan habis ≤ 90 hari" },
  homeMasaHabis: { en: "Expired", id: "Sudah habis" },
  homeMasaEmpty: { en: "No terms expired or expiring soon.", id: "Tidak ada masa bhakti yang habis atau akan habis." },
  homeMonthTitle: { en: "This month", id: "Bulan ini" },
  homeMonthLetters: { en: "Letters saved", id: "Surat tersimpan" },
  homeMonthIkm: { en: "Survey answers", id: "Jawaban survei" },
  homeMonthAduan: { en: "Complaints", id: "Pengaduan" },
  homeTrendTitle: { en: "IKM trend — score over time", id: "Tren IKM — skor dari waktu ke waktu" },
  homeTrendHint: { en: "Cumulative IKM score after each survey answer.", id: "Skor IKM kumulatif setelah tiap jawaban survei." },
  homeTrendEmpty: { en: "Not enough answers yet for a trend.", id: "Jawaban belum cukup untuk menampilkan tren." },
  homeReportTitle: { en: "Monthly report", id: "Laporan bulanan" },
  homeReportHint: {
    en: "Recap of this month's letters, survey and complaints — printable for the office file.",
    id: "Rekap surat, survei, dan pengaduan bulan berjalan — bisa dicetak untuk arsip kantor.",
  },
  homeReportPrint: { en: "Print report", id: "Cetak laporan" },
  homeReportPrinted: { en: "Report sent to print.", id: "Laporan dikirim ke printer." },
  homeReportExport: { en: "Export CSV", id: "Ekspor CSV" },
  homeReportExported: { en: "Monthly report CSV downloaded.", id: "Laporan CSV diunduh." },
  // Paket 18 — Grafik Tren Bulanan (6 bulan terakhir)
  homeMonthTrendTitle: { en: "Monthly trend — last 6 months", id: "Tren bulanan — 6 bulan terakhir" },
  homeMonthTrendHint: {
    en: "Letters, mail register and complaints per month, from local data only.",
    id: "Surat, agenda, dan pengaduan per bulan, dari data lokal saja.",
  },
  mtrendSurat: { en: "Letters saved", id: "Surat tersimpan" },
  mtrendMasuk: { en: "Register in", id: "Agenda masuk" },
  mtrendKeluar: { en: "Register out", id: "Agenda keluar" },
  mtrendAduan: { en: "Complaints", id: "Pengaduan" },
  // Paket 14 — Backup & Restore
  homeBackupTitle: { en: "Data & backup", id: "Data & cadangan" },
  homeBackupHint: {
    en: "Download all office data as one JSON file, or restore it from a backup. Everything stays in this browser — no data leaves the device.",
    id: "Unduh semua data kantor sebagai satu file JSON, atau pulihkan dari cadangan. Semua tetap di browser ini — tidak ada data yang keluar dari perangkat.",
  },
  homeBackupExport: { en: "Backup data", id: "Backup data" },
  homeBackupRestore: { en: "Restore data", id: "Restore data" },
  homeBackupExported: { en: "Backup downloaded.", id: "Backup diunduh." },
  homeBackupRestored: { en: "Data restored from backup.", id: "Data dipulihkan dari backup." },
  homeBackupCancelled: { en: "Restore cancelled — current data kept.", id: "Restore dibatalkan — data saat ini tetap." },
  homeBackupConfirmQ: {
    en: "Restore this backup? Current data will be replaced.",
    id: "Pulihkan backup ini? Data saat ini akan diganti.",
  },
  homeBackupConfirmYes: { en: "Yes, restore", id: "Ya, restore" },
  homeBackupConfirmNo: { en: "Cancel", id: "Batal" },
  homeBackupInvalid: {
    en: "Backup file is invalid — nothing was changed.",
    id: "File backup tidak valid — tidak ada yang diubah.",
  },
  homeBackupTooBig: {
    en: "Backup file is too large — nothing was changed.",
    id: "File backup terlalu besar — tidak ada yang diubah.",
  },
  homeBackupReadFail: {
    en: "Could not read the backup file — nothing was changed.",
    id: "File backup tidak bisa dibaca — tidak ada yang diubah.",
  },
  cmdBackup: { en: "Backup data", id: "Backup data" },
  // Paket 16 — "Perlu Ditindaklanjuti" (needs follow-up)
  homeFollowupTitle: { en: "Needs follow-up", id: "Perlu Ditindaklanjuti" },
  homeFollowupHint: {
    en: "Open complaints, mail-register items, and expiring staff decrees (SK), oldest first — tap an item to open it.",
    id: "Pengaduan, agenda, dan SK pegawai yang belum selesai, dari yang terlama — ketuk item untuk membukanya.",
  },
  homeFollowupEmpty: { en: "All followed up ✓", id: "Semua sudah ditindaklanjuti ✓" },
  homeFollowupAduan: { en: "complaints", id: "pengaduan" },
  homeFollowupAgenda: { en: "register items", id: "agenda" },
  homeFollowupNoDisposisi: { en: "not yet dispositioned", id: "belum didisposisi" },
  // Paket 20 — SK pegawai ikut di kartu "Perlu Ditindaklanjuti"
  homeFollowupSk: { en: "staff SK", id: "SK pegawai" },
  // Paket 17 — Pengaturan Kop Surat (letterhead settings)
  homeLetterheadTitle: { en: "Letterhead settings", id: "Pengaturan Kop Surat" },
  homeLetterheadHint: {
    en: "Office identity printed on the official-letter kop and signature block. Fill in what applies — empty fields print as \"—\", nothing is ever invented. Stored in this browser, included in backups.",
    id: "Identitas kantor yang tercetak di kop dan blok tanda tangan surat resmi. Isi yang sesuai — field kosong tercetak \"—\", tidak ada yang dikarang. Tersimpan di browser ini, ikut dalam backup.",
  },
  homeLetterheadSave: { en: "Save letterhead", id: "Simpan kop surat" },
  homeLetterheadSaved: { en: "Letterhead settings saved.", id: "Pengaturan kop surat disimpan." },
  lhInstansi1: { en: "Institution line 1", id: "Instansi baris 1" },
  lhInstansi2: { en: "Institution line 2", id: "Instansi baris 2" },
  lhAlamat: { en: "Office address", id: "Alamat kantor" },
  lhTelepon: { en: "Phone", id: "Telepon" },
  lhEmail: { en: "Email", id: "Email" },
  lhCamatNama: { en: "Camat name (signatory)", id: "Nama Camat (penandatangan)" },
  lhCamatNip: { en: "Camat NIP", id: "NIP Camat" },
  lhSekretarisNama: { en: "Secretary name (optional)", id: "Nama Sekretaris (opsional)" },
  printSignerSecretary: { en: "Secretary", id: "Sekretaris" },
  cmdLetterhead: { en: "Letterhead settings", id: "Pengaturan kop surat" },
  // Paket 10 — morning briefing (Briefing Pagi)
  briefingTitle: { en: "Morning briefing", id: "Briefing Pagi" },
  briefingFocus: { en: "Today's focus", id: "Fokus hari ini" },
  briefingCopy: { en: "Copy briefing", id: "Salin briefing" },
  briefingCopied: { en: "Copied — ready to paste in WhatsApp.", id: "Disalin — siap ditempel di WhatsApp." },
  briefingCopyFail: { en: "Copy failed — please copy the summary above manually.", id: "Salinan gagal — salin ringkasan di atas secara manual." },
  briefingEmpty: { en: "Nothing urgent today — all complaints resolved, no terms expiring.", id: "Tidak ada yang mendesak hari ini — semua pengaduan selesai, tidak ada masa bhakti yang mendesak." },
  briefingAduan: { en: "new complaints", id: "pengaduan baru" },
  briefingMasaHabis: { en: "terms expired", id: "masa bhakti habis" },
  briefingSurat: { en: "letters today", id: "surat hari ini" },
  briefingOldestAduan: { en: "Oldest complaint", id: "Pengaduan tertua" },
  briefingMasaHabisItem: { en: "Term expired", id: "Masa bhakti habis" },
  briefingMasaAkanItem: { en: "Term expiring soon", id: "Masa bhakti akan habis" },
  briefingIkmLowest: { en: "Lowest IKM element", id: "Unsur IKM terendah" },
  // Paket 11 — Buku Agenda Surat
  tabAgenda: { en: "Mail Register", id: "Agenda Surat" },
  agendaTitle: { en: "Mail register — incoming & outgoing letters", id: "Buku agenda surat — surat masuk & keluar" },
  agendaHint: {
    en: "Every letter that enters or leaves the office gets an agenda number. Stored in this browser.",
    id: "Setiap surat yang masuk atau keluar kantor tercatat dengan nomor agenda. Tersimpan di browser ini.",
  },
  agendaDemoNote: {
    en: "⚠️ SAMPLE DATA — not real data. The 4 entries below are examples to demonstrate the register.",
    id: "⚠️ DATA CONTOH — bukan data asli. 4 entri di bawah ini contoh untuk menunjukkan cara kerja agenda.",
  },
  agendaStatMasuk: { en: "Incoming", id: "Surat masuk" },
  agendaStatKeluar: { en: "Outgoing", id: "Surat keluar" },
  agendaStatBelum: { en: "Needs follow-up", id: "Perlu tindak lanjut" },
  agendaFormTitle: { en: "Record a letter", id: "Catat surat" },
  agendaArah: { en: "Direction", id: "Arah surat" },
  agendaArahMasuk: { en: "Incoming (surat masuk)", id: "Masuk (surat masuk)" },
  agendaArahKeluar: { en: "Outgoing (surat keluar)", id: "Keluar (surat keluar)" },
  agendaNomorSurat: { en: "Letter number (sender's / ours)", id: "Nomor surat (pengirim / kita)" },
  agendaPihak: { en: "Sender / recipient", id: "Pengirim / tujuan" },
  agendaPihakPh: { en: "e.g. Desa Katis", id: "Contoh: Desa Katis" },
  agendaTanggal: { en: "Letter date", id: "Tanggal surat" },
  agendaPerihal: { en: "Subject", id: "Perihal" },
  agendaPerihalPh: { en: "e.g. Permohonan rekomendasi bantuan sosial", id: "Contoh: Permohonan rekomendasi bantuan sosial" },
  agendaDisposisi: { en: "Disposition", id: "Disposisi" },
  agendaDisposisiNone: { en: "— No disposition —", id: "— Tanpa disposisi —" },
  agendaSubmit: { en: "Record letter", id: "Catat surat" },
  agendaAdded: { en: "Letter recorded.", id: "Surat tercatat." },
  agendaDeleted: { en: "Entry deleted.", id: "Entri dihapus." },
  agendaFormError: { en: "Please fill in sender/recipient and subject.", id: "Isi pengirim/tujuan dan perihal dulu." },
  agendaListTitle: { en: "Register", id: "Daftar agenda" },
  agendaFilterArah: { en: "All directions", id: "Semua arah" },
  agendaFilterStatus: { en: "All statuses", id: "Semua status" },
  agendaSearch: { en: "Search register", id: "Cari agenda" },
  agendaSearchPh: { en: "Subject, sender, or number…", id: "Perihal, pihak, atau nomor…" },
  agendaEmpty: { en: "No entries with this filter.", id: "Tidak ada entri dengan filter ini." },
  agendaExport: { en: "Export CSV", id: "Ekspor CSV" },
  agendaExported: { en: "Register exported.", id: "Agenda diekspor." },
  agendaConfirmDelete: { en: "Delete this agenda entry?", id: "Hapus entri agenda ini?" },
  agendaStatusChanged: { en: "Status updated.", id: "Status diperbarui." },
  // Paket 19 — Kalender Agenda
  agendaCalTitle: { en: "Agenda calendar", id: "Kalender agenda" },
  agendaCalToday: { en: "Today", id: "Hari ini" },
  agendaCalPrev: { en: "Previous month", id: "Bulan sebelumnya" },
  agendaCalNext: { en: "Next month", id: "Bulan berikutnya" },
  agendaCalEntries: { en: "entries", id: "entri" },
  agendaCalNoEntries: { en: "No register entries on this date.", id: "Tidak ada agenda pada tanggal ini." },
  briefingAgendaMasuk: { en: "incoming letters today", id: "surat masuk hari ini" },
  homeSearchAgenda: { en: "Mail register", id: "Agenda surat" },
  cmdNewAgenda: { en: "Record a letter", id: "Catat surat" },
  // Paket 7 — command palette, citizen mode, complaints chart
  paletteTitle: { en: "Jump to…", id: "Lompat ke…" },
  palettePh: { en: "Type a menu or action…", id: "Ketik menu atau aksi…" },
  paletteEmpty: { en: "No matching menu or action.", id: "Tidak ada menu atau aksi yang cocok." },
  paletteHint: { en: "↑↓ to choose • Enter to open • Esc to close", id: "↑↓ untuk memilih • Enter untuk membuka • Esc untuk menutup" },
  modeWarga: { en: "Citizen mode", id: "Mode Warga" },
  modePetugas: { en: "Officer mode", id: "Mode Petugas" },
  wargaCardTitle: { en: "Resident services", id: "Layanan warga" },
  wargaCardHint: { en: "For residents: three things you can do here, no login needed.", id: "Untuk warga: tiga hal yang bisa dilakukan di sini, tanpa login." },
  wargaGoIkm: { en: "Fill in the satisfaction survey", id: "Isi survei kepuasan" },
  wargaGoAduan: { en: "File a complaint", id: "Buat pengaduan" },
  wargaGoQa: { en: "Ask about procedures", id: "Tanya prosedur" },
  aduanChartTitle: { en: "Complaints by type", id: "Pengaduan per jenis" },
  aduanChartHint: { en: "All complaints in this browser, grouped by type.", id: "Semua pengaduan di browser ini, dikelompokkan per jenis." },
  aduanChartEmpty: { en: "No complaints yet.", id: "Belum ada pengaduan." },
  cmdNewLetter: { en: "New letter", id: "Surat baru" },
  cmdNewAduan: { en: "New complaint", id: "Pengaduan baru" },
  cmdFillIkm: { en: "Fill in IKM survey", id: "Isi survei IKM" },
  cmdPrintReport: { en: "Print monthly report", id: "Cetak laporan bulanan" },
  cmdTheme: { en: "Toggle dark mode", id: "Ganti mode gelap" },
  cmdLang: { en: "Switch language", id: "Ganti bahasa" },
  homeQuickTitle: { en: "Quick actions", id: "Aksi cepat" },
  homeGoLetters: { en: "Draft a letter", id: "Buat surat" },
  homeGoIkm: { en: "Open the survey", id: "Buka survei" },
  homeGoAduan: { en: "New complaint", id: "Pengaduan baru" },
  homeGoKeg: { en: "Personnel list", id: "Daftar pegawai" },
  tabSummarize: { en: "Summarize", id: "Ringkasan" },
  tabQa: { en: "Procedure Q&A", id: "Tanya Prosedur" },
  tabDrafts: { en: "Archive & Drafts", id: "Arsip & Draf" },
  lettersTitle: { en: "Draft an official letter", id: "Buat draf surat resmi" },
  lettersHint: {
    en: "Pick a template, fill in the fields, add a short instruction if you like. Short drafts run on-device (private, no internet needed); longer ones fall back to the cloud.",
    id: "Pilih template, isi kolomnya, tambah instruksi singkat bila perlu. Draf pendek diproses di perangkat (privat, tanpa internet); yang panjang beralih ke cloud.",
  },
  templateLabel: { en: "Letter type", id: "Jenis surat" },
  extraLabel: { en: "Extra instruction (optional, short)", id: "Instruksi tambahan (opsional, singkat)" },
  extraPh: {
    en: "e.g. formal tone, mention the musrenbang meeting on Friday",
    id: "cth: nada formal, sebut rapat musrenbang hari Jumat",
  },
  generate: { en: "Generate draft", id: "Buat draf" },
  autoNumber: { en: "Auto number", id: "Nomor otomatis" },
  // Paket 29 — lembar surat resmi hasil draf.
  letterSheetCaption: { en: "Draft result — official letter format", id: "Hasil draf — format surat resmi" },
  letterRawToggle: { en: "Draft text — editable", id: "Teks draf — bisa diedit" },
  autoNumberDone: { en: "Letter number filled in.", id: "Nomor surat terisi." },
  clear: { en: "Clear", id: "Bersihkan" },
  copy: { en: "Copy", id: "Salin" },
  download: { en: "Download .txt", id: "Unduh .txt" },
  saveDraft: { en: "Save draft", id: "Simpan draf" },
  // Paket 33 — kirim draf surat ke WhatsApp (wa.me, tanpa server).
  sendWhatsApp: { en: "Send via WhatsApp", id: "Kirim ke WhatsApp" },
  waOpened: {
    en: "WhatsApp opened — pick a recipient, then send.",
    id: "WhatsApp terbuka — pilih penerima lalu kirim.",
  },
  waCopiedLong: {
    en: "Letter too long for a share link — text copied, paste it in WhatsApp.",
    id: "Surat terlalu panjang untuk tautan — teks disalin, tempel di WhatsApp.",
  },
  waCopyFailed: {
    en: "Letter too long for a share link and copying failed — copy the draft text manually.",
    id: "Surat terlalu panjang untuk tautan dan penyalinan gagal — salin teks draf secara manual.",
  },
  sumTitle: { en: "Summarize a document", id: "Ringkas dokumen" },
  sumHint: {
    en: "Paste a long document (minutes, regulation, report). Long documents are always summarized in the cloud — on-device inference is limited to 9,216 input tokens.",
    id: "Tempel dokumen panjang (notulen, peraturan, laporan). Dokumen panjang selalu diringkas di cloud — inferensi di perangkat dibatasi 9.216 token input.",
  },
  sumInputLabel: { en: "Document text", id: "Teks dokumen" },
  sumPh: { en: "Paste the document text here…", id: "Tempel teks dokumen di sini…" },
  sumLengthLabel: { en: "Summary length", id: "Panjang ringkasan" },
  sumShort: { en: "Short — key points only", id: "Pendek — poin penting saja" },
  sumMedium: { en: "Medium — key points + details", id: "Sedang — poin penting + detail" },
  sumDetailed: { en: "Detailed — structured summary", id: "Detail — ringkasan terstruktur" },
  chars: { en: "characters", id: "karakter" },
  summarizeBtn: { en: "Summarize", id: "Ringkas" },
  qaTitle: { en: "Ask about village procedures", id: "Tanya tentang prosedur desa" },
  qaHint: {
    en: "Ask how to apply for KTP, KK, domisili, SKTM, birth certificates and more. Answers are grounded in the built-in procedure guide — and the guide itself works fully offline.",
    id: "Tanya cara mengurus KTP, KK, domisili, SKTM, akta kelahiran, dan lainnya. Jawaban berdasar panduan prosedur bawaan — dan panduannya sendiri berfungsi penuh offline.",
  },
  qaLabel: { en: "Your question", id: "Pertanyaan Anda" },
  qaPh: {
    en: "e.g. What do I need to apply for a KTP?",
    id: "cth: Apa saja syarat membuat KTP?",
  },
  askBtn: { en: "Ask", id: "Tanya" },
  kbTitle: { en: "Built-in procedure guide (works offline)", id: "Panduan prosedur bawaan (berfungsi offline)" },
  draftsTitle: { en: "Letter archive & my drafts", id: "Arsip surat & draf saya" },
  draftsHint: {
    en: "Saved drafts sync to Firestore when Firebase is connected; otherwise they stay in this browser (localStorage).",
    id: "Draf tersimpan tersinkron ke Firestore bila Firebase terhubung; bila tidak, draf tersimpan di browser ini (localStorage).",
  },
  draftsEmpty: {
    en: "No drafts yet. Generate a letter or summary and press “Save draft”.",
    id: "Belum ada draf. Buat surat atau ringkasan lalu tekan “Simpan draf”.",
  },
  // Print an official letter from the archive (Paket 15)
  printLetter: { en: "Print letter", id: "Cetak Surat" },
  printPreviewTitle: { en: "Print official letter", id: "Cetak surat resmi" },
  printPreviewHint: {
    en: "Check the details before printing — the letter prints exactly as shown below. The body is editable; no name, number, or date is invented.",
    id: "Periksa detail sebelum mencetak — surat tercetak persis seperti di bawah. Isi bisa diedit; tidak ada nama, nomor, atau tanggal yang dikarang.",
  },
  printFieldNomor: { en: "Letter number", id: "Nomor surat" },
  printFieldNomorPh: { en: "e.g. 140/001/DS/XI/2026", id: "cth: 140/001/DS/XI/2026" },
  printAutoNumber: { en: "Auto number", id: "Nomor otomatis" },
  printFieldTanggal: { en: "Date", id: "Tanggal" },
  printFieldTujuan: { en: "Addressed to", id: "Ditujukan kepada" },
  printFieldTujuanPh: { en: "e.g. Kepala Desa …", id: "cth: Kepala Desa …" },
  printFieldPerihal: { en: "Subject", id: "Perihal" },
  printFieldIsi: { en: "Letter body (editable)", id: "Isi surat (bisa diedit)" },
  printDo: { en: "Print", id: "Cetak" },
  printClose: { en: "Close", id: "Tutup" },
  printKopGov: {
    en: "Pemerintah Kabupaten Bangka Tengah",
    id: "Pemerintah Kabupaten Bangka Tengah",
  },
  printKopOffice: { en: "Kecamatan Simpangkatis", id: "Kecamatan Simpangkatis" },
  printSignerTitle: { en: "Camat Simpangkatis", id: "Camat Simpangkatis" },
  footer: {
    en: "DesaAI — built for #BuildHybridAI 2026. Hybrid inference: on-device Gemini Nano 4 when available, cloud Gemini fallback. AI drafts must be reviewed by a human officer before use.",
    id: "DesaAI — dibuat untuk #BuildHybridAI 2026. Inferensi hibrida: Gemini Nano 4 di perangkat bila tersedia, fallback cloud Gemini. Draf AI wajib diperiksa petugas sebelum digunakan.",
  },
  tabKepegawaian: { en: "Personnel Data", id: "Data Kepegawaian" },
  tabIkm: { en: "Satisfaction (IKM)", id: "Kepuasan (IKM)" },
  tabPengaduan: { en: "Complaints", id: "Pengaduan" },
  officeLine: {
    en: "Kecamatan Simpangkatis • Kabupaten Bangka Tengah",
    id: "Kecamatan Simpangkatis • Kabupaten Bangka Tengah",
  },
  kegTitle: { en: "Simpangkatis Subdistrict Administration", id: "Administrasi Kecamatan Simpangkatis" },
  kegHint: {
    en: "Personnel data for the subdistrict office and 10 village officers — track terms of office, get reminders before they expire, and manage staff records in one place.",
    id: "Data kepegawaian kecamatan dan perangkat 10 desa — pantau masa bhakti, dapatkan pengingat sebelum habis, dan kelola data pegawai dalam satu tempat.",
  },
  kegDemoNote: {
    en: "⚠️ SAMPLE DATA — not real data. The 23 records below (8 subdistrict-office staff + 15 village officers) are examples (demo NIKs) to show the admin flow and term-expiry notifications. You can add, edit, or delete records; data is stored locally in this browser.",
    id: "⚠️ DATA CONTOH — bukan data asli. 23 data di bawah ini (8 pegawai kecamatan + 15 perangkat desa) adalah contoh (NIK demo) untuk menunjukkan alur admin dan notifikasi masa bhakti. Anda bisa menambah, mengubah, atau menghapus data; data tersimpan lokal di browser ini.",
  },
  kegStatTotal: { en: "Total officers", id: "Total pegawai" },
  kegStatDesa: { en: "Villages", id: "Jumlah desa" },
  kegStatAktif: { en: "Active term", id: "Aktif masa bhakti" },
  kegStatAkanHabis: { en: "Expiring ≤ 90 days", id: "Akan habis ≤ 90 hari" },
  kegStatHabis: { en: "Term expired", id: "Masa bhakti habis" },
  kegStatKecamatan: { en: "Subdistrict staff", id: "Pegawai kecamatan" },
  kegStatPerangkat: { en: "Village officers", id: "Perangkat desa" },
  kegUnitTitle: { en: "Summary per unit", id: "Ringkasan per unit" },
  kegUnitKecamatan: { en: "Subdistrict Office", id: "Kantor Kecamatan" },
  kegUnitDesa: { en: "Village Officers", id: "Perangkat Desa" },
  kegFilterUnit: { en: "All units", id: "Semua unit" },
  kegUnitCol: { en: "Unit", id: "Unit" },
  kegUnitKecOpt: { en: "Subdistrict (Kecamatan)", id: "Kecamatan" },
  kegUnitDesaOpt: { en: "Village (Desa)", id: "Desa" },
  kegNotifTitle: { en: "Personnel notifications — terms of office", id: "Notifikasi kepegawaian — masa bhakti" },
  kegNotifEmpty: {
    en: "No terms expired or expiring within 90 days.",
    id: "Tidak ada masa bhakti yang habis atau akan habis dalam 90 hari.",
  },
  kegNotifHabis: { en: "term EXPIRED", id: "masa bhakti HABIS" },
  kegNotifAkanHabis: { en: "term ends in", id: "masa bhakti berakhir dalam" },
  kegNotifDaysAgo: { en: "days ago", id: "hari lalu" },
  kegNotifDays: { en: "days", id: "hari" },
  // Paket 20 — Pengingat Masa Berlaku SK (SK expiry reminders, 30-day window)
  kegSkTitle: { en: "SK Expiry Reminders", id: "Pengingat Masa Berlaku SK" },
  kegSkEmpty: {
    en: "All appointment decrees (SK) are still valid ✓",
    id: "Semua SK masih berlaku ✓",
  },
  kegSkHabis: { en: "SK expired", id: "SK sudah habis" },
  kegSkAkanHabis: { en: "SK expires in", id: "SK habis dalam" },
  // Paket 21 — Statistik Pegawai (staff breakdown: per position / village / SK)
  kegStat21Title: { en: "Staff Statistics", id: "Statistik Pegawai" },
  kegStat21Total: { en: "Total staff", id: "Total pegawai" },
  kegStat21Jabatan: { en: "By position", id: "Per jabatan" },
  kegStat21Desa: { en: "By village", id: "Per desa" },
  kegStat21Sk: { en: "SK validity", id: "Masa berlaku SK" },
  kegStat21SkBerlaku: { en: "SK still valid", id: "SK masih berlaku" },
  kegStat21SkHabis: { en: "SK expired", id: "SK sudah habis" },
  kegStat21SkTanpaTanggal: { en: "No SK end date", id: "Tanpa tanggal SK" },
  kegStat21Unknown: { en: "Unknown", id: "Tidak diketahui" },
  // Paket 22 — Pencarian Cepat Pegawai: empty-result message + the note
  // shown on the statistics card while a search/filter is active.
  kegNoResult: { en: "No staff match your search.", id: "Tidak ada pegawai yang cocok." },
  kegStat21Filtered: {
    en: "Statistics for the filtered results",
    id: "Statistik untuk hasil saringan",
  },
  kegFormTitle: { en: "Add officer", id: "Input pegawai" },
  kegAdd: { en: "Save officer", id: "Simpan data" },
  kegNeedName: {
    en: "Please fill in all required fields: name, birthplace/date, religion, position, unit, and term dates.",
    id: "Isi semua kolom wajib: nama, tempat/tanggal lahir, agama, jabatan, unit, dan tanggal masa bhakti.",
  },
  kegNikInvalid: {
    en: "NIK must be exactly 16 digits (numbers only).",
    id: "NIK harus tepat 16 digit (angka saja).",
  },
  kegDateInvalid: {
    en: "Term end date must be after the term start date.",
    id: "Tanggal selesai masa bhakti harus setelah tanggal mulai.",
  },
  kegBirthInvalid: {
    en: "Birth date cannot be in the future.",
    id: "Tanggal lahir tidak boleh di masa depan.",
  },
  kegFilterStatus: { en: "All statuses", id: "Semua status" },
  kegArchiveLetters: { en: "Letter archive", id: "Arsip surat" },
  kegArchiveSummaries: { en: "Saved summaries", id: "Ringkasan tersimpan" },
  kegChecklistDone: { en: "Done", id: "Selesai" },
  kegSaved: { en: "Officer saved.", id: "Data perangkat tersimpan." },
  kegDeleted: { en: "Officer deleted.", id: "Data perangkat dihapus." },
  kegSearchPh: { en: "Search name, position, village, or unit…", id: "Cari nama, jabatan, desa, atau unit…" },
  kegFilterDesa: { en: "All villages", id: "Semua desa" },
  kegFilterJabatan: { en: "All positions", id: "Semua jabatan" },
  kegFilterReset: { en: "Reset filters", id: "Reset filter" },
  // Paket 25 — Ekspor CSV Daftar Pegawai: button + status line that
  // reports the exported filename (or that there is nothing to export).
  kegExportCsv: { en: "Export CSV", id: "Ekspor CSV" },
  kegExported: { en: "Exported", id: "Diekspor" },
  kegExportEmpty: {
    en: "Nothing to export — no staff match the current filter.",
    id: "Tidak ada yang diekspor — tidak ada pegawai yang cocok dengan filter saat ini.",
  },
  kegShowing: { en: "Showing", id: "Menampilkan" },
  kegOf: { en: "of", id: "dari" },
  kegRecords: { en: "records", id: "data" },
  kegDesaTitle: { en: "Data per village", id: "Data per desa" },
  kegLembagaTitle: { en: "Village institutions", id: "Lembaga desa" },
  kegSummarize: { en: "Summarize personnel (AI)", id: "Ringkas kepegawaian (AI)" },
  kegSumOfflineNote: {
    en: "Offline recap (no AI call — Firebase not connected). Connect Firebase to get an AI-written summary.",
    id: "Rekap offline (tanpa panggilan AI — Firebase belum terhubung). Hubungkan Firebase untuk ringkasan AI.",
  },
  kegStatusAktif: { en: "Active", id: "Aktif" },
  kegStatusAkanHabis: { en: "Expiring soon", id: "Akan habis" },
  kegStatusHabis: { en: "Expired", id: "Habis" },
  kegSkBtn: { en: "Buat SK", id: "Buat SK" },
  kegDemoBadge: { en: "sample", id: "contoh" },
  rateThis: { en: "Rate this service", id: "Beri penilaian" },
  // IKM — PermenPAN-RB No. 14/2017, 9 elements, scale 1-4, score = mean x 25
  ikmTitle: { en: "Community Satisfaction Index (IKM) — letter services", id: "Indeks Kepuasan Masyarakat (IKM) — pelayanan surat" },
  ikmHint: {
    en: "Survey based on PermenPAN-RB No. 14/2017: 9 service elements, scale 1–4. IKM = average score × 25 (25–100). Share the survey with the community and track the results here.",
    id: "Survei berdasarkan PermenPAN-RB No. 14 Tahun 2017: 9 unsur pelayanan, skala 1–4. IKM = rata-rata skor × 25 (25–100). Sebarkan survei ke masyarakat dan pantau hasilnya di sini.",
  },
  ikmDemoNote: {
    en: "⚠️ SAMPLE DATA — not real data. The 12 survey answers below are examples to demonstrate the dashboard; real answers will replace them as the community responds.",
    id: "⚠️ DATA CONTOH — bukan data asli. 12 jawaban survei di bawah ini adalah contoh untuk mendemokan dashboard; jawaban asli akan menggantikannya seiring masyarakat mengisi.",
  },
  ikmScoreLabel: { en: "IKM score", id: "Skor IKM" },
  ikmRespondents: { en: "respondents", id: "responden" },
  ikmCatA: { en: "A — Excellent", id: "A — Sangat Baik" },
  ikmCatB: { en: "B — Good", id: "B — Baik" },
  ikmCatC: { en: "C — Fair", id: "C — Kurang Baik" },
  ikmCatD: { en: "D — Poor", id: "D — Tidak Baik" },
  ikmPerElement: { en: "Average per element", id: "Rata-rata per unsur" },
  ikmLowest: { en: "Lowest", id: "Terendah" },
  ikmHighest: { en: "Highest", id: "Tertinggi" },
  ikmFormTitle: { en: "Fill in the satisfaction survey", id: "Isi survei kepuasan" },
  ikmName: { en: "Your name (optional — may stay anonymous)", id: "Nama Anda (opsional — boleh anonim)" },
  ikmLetterType: { en: "Letter service used", id: "Jenis surat yang diurus" },
  ikmComment: { en: "Comments / suggestions (optional)", id: "Komentar / saran (opsional)" },
  ikmSubmit: { en: "Submit survey", id: "Kirim survei" },
  ikmNeedAll: { en: "Please answer all 9 elements and choose the letter service.", id: "Jawab semua 9 unsur dan pilih jenis surat yang diurus." },
  ikmSaved: { en: "Thank you! Your survey has been saved.", id: "Terima kasih! Survei Anda tersimpan." },
  ikmShareSurvey: { en: "Share survey", id: "Bagikan Survei" },
  ikmShareResults: { en: "Share results", id: "Bagikan Hasil" },
  ikmShared: { en: "Shared.", id: "Dibagikan." },
  ikmCopied: { en: "Link copied to clipboard — share it with the community.", id: "Tautan disalin ke clipboard — sebarkan ke masyarakat." },
  ikmCopyManual: { en: "Copy the text below manually.", id: "Salin teks di bawah ini secara manual." },
  ikmToPengaduan: { en: "Have a complaint? Submit it here →", id: "Punya keluhan? Sampaikan pengaduan →" },
  // Survey distribution: deep link + QR code
  ikmShareTitle: { en: "Share the survey", id: "Sebarkan survei" },
  ikmShareHint: {
    en: "Share this link or QR code with residents — they can open the survey right on their phone.",
    id: "Bagikan tautan atau kode QR ini ke warga — mereka bisa langsung membuka survei di HP.",
  },
  ikmSurveyLink: { en: "Survey link", id: "Tautan survei" },
  ikmCopyLink: { en: "Copy link", id: "Salin tautan" },
  ikmDownloadQr: { en: "Download QR (PNG)", id: "Unduh QR (PNG)" },
  ikmShareWa: { en: "WhatsApp", id: "WhatsApp" },
  ikmQrHint: {
    en: "Scan the QR code with a phone camera to open the survey. Print it and stick it at the service counter.",
    id: "Pindai kode QR dengan kamera HP untuk membuka survei. Cetak dan tempel di loket pelayanan.",
  },
  ikmLinkCopied: { en: "Survey link copied.", id: "Tautan survei disalin." },
  ikmQrDownloaded: { en: "QR code downloaded.", id: "Kode QR diunduh." },
  ikmQrFailed: {
    en: "QR code could not be generated — the link above still works.",
    id: "Kode QR gagal dibuat — tautan di atas tetap bisa dipakai.",
  },
  // Quick-stats strip (live counts from existing data)
  qsLetters: { en: "Letters saved", id: "Surat tersimpan" },
  qsIkm: { en: "IKM score", id: "Skor IKM" },
  qsAduan: { en: "Complaints resolved", id: "Pengaduan selesai" },
  ikmScale1: { en: "1 — Very dissatisfied", id: "1 — Sangat Tidak Puas" },
  ikmScale2: { en: "2 — Dissatisfied", id: "2 — Tidak Puas" },
  ikmScale3: { en: "3 — Satisfied", id: "3 — Puas" },
  ikmScale4: { en: "4 — Very satisfied", id: "4 — Sangat Puas" },
  ikmAnon: { en: "Anonymous", id: "Anonim" },
  // Pengaduan
  aduTitle: { en: "Complaints — letter services", id: "Pengaduan — pelayanan surat" },
  aduHint: {
    en: "Report problems with letter services. Complaints can be anonymous; the office tracks each one from New to Done.",
    id: "Laporkan kendala pelayanan surat. Pengaduan boleh anonim; kantor menindaklanjuti tiap laporan dari Baru sampai Selesai.",
  },
  aduDemoNote: {
    en: "⚠️ SAMPLE DATA — not real data. The 6 complaints below are examples to demonstrate the workflow.",
    id: "⚠️ DATA CONTOH — bukan data asli. 6 pengaduan di bawah ini adalah contoh untuk mendemokan alur.",
  },
  aduFormTitle: { en: "Submit a complaint", id: "Sampaikan pengaduan" },
  aduName: { en: "Your name (optional — may stay anonymous)", id: "Nama pelapor (opsional — boleh anonim)" },
  aduJenis: { en: "Complaint type", id: "Jenis pengaduan" },
  aduJenis1: { en: "Delay", id: "Keterlambatan" },
  aduJenis2: { en: "Unclear requirements", id: "Persyaratan tidak jelas" },
  aduJenis3: { en: "Unfriendly service", id: "Pelayanan kurang ramah" },
  aduJenis4: { en: "Incorrect fees", id: "Biaya tidak sesuai" },
  aduJenis5: { en: "Other", id: "Lainnya" },
  aduLetterType: { en: "Related letter service", id: "Jenis surat terkait" },
  aduIsi: { en: "Complaint details", id: "Isi pengaduan" },
  aduIsiPh: { en: "Describe the problem…", id: "Jelaskan kendalanya…" },
  aduKontak: { en: "Contact (optional — phone)", id: "Kontak (opsional — no. HP)" },
  aduSubmit: { en: "Submit complaint", id: "Kirim pengaduan" },
  aduNeedIsi: { en: "Please describe the complaint and choose its type.", id: "Isi pengaduan dan jenis pengaduan wajib diisi." },
  aduSaved: { en: "Complaint saved. Thank you for reporting.", id: "Pengaduan tersimpan. Terima kasih atas laporannya." },
  aduFilterStatus: { en: "All statuses", id: "Semua status" },
  aduStatusBaru: { en: "New", id: "Baru" },
  aduStatusDiproses: { en: "In progress", id: "Diproses" },
  aduStatusSelesai: { en: "Done", id: "Selesai" },
  aduListTitle: { en: "Complaint list", id: "Daftar pengaduan" },
  aduEmpty: { en: "No complaints with this status.", id: "Belum ada pengaduan dengan status ini." },
  aduStatusChanged: { en: "Status updated.", id: "Status diperbarui." },
  aduExport: { en: "Export complaints (CSV)", id: "Ekspor pengaduan (CSV)" },
  aduExported: { en: "Complaints exported.", id: "Pengaduan diekspor." },
  // Dynamic strings
  badgeDevice: { en: "On-device • private", id: "Di perangkat • privat" },
  badgeCloud: { en: "Cloud", id: "Cloud" },
  badgeUnknown: { en: "Source unknown", id: "Sumber tidak diketahui" },
  reasonShort: {
    en: "Short prompt — ran on-device (Gemini Nano 4). No data left the device.",
    id: "Prompt pendek — diproses di perangkat (Gemini Nano 4). Data tidak keluar dari perangkat.",
  },
  reasonLong: {
    en: "Long input exceeds the on-device limit — ran in the cloud.",
    id: "Input panjang melebihi batas perangkat — diproses di cloud.",
  },
  reasonFallback: {
    en: "On-device model unavailable in this browser — fell back to the cloud.",
    id: "Model perangkat tidak tersedia di browser ini — beralih ke cloud.",
  },
  reasonForcedCloud: {
    en: "Long document — summarized in the cloud.",
    id: "Dokumen panjang — diringkas di cloud.",
  },
  statusThinking: { en: "Thinking…", id: "Memproses…" },
  statusDownloading: { en: "Downloading on-device model…", id: "Mengunduh model perangkat…" },
  statusNeedConfig: {
    en: "Firebase is not configured yet — connect a project (see README.md) to enable AI.",
    id: "Firebase belum dikonfigurasi — hubungkan proyek (lihat README.md) untuk mengaktifkan AI.",
  },
  statusNeedInput: { en: "Please fill in at least one field first.", id: "Isi minimal satu kolom dulu." },
  statusNeedText: { en: "Please paste some text first.", id: "Tempel teks dulu." },
  statusNeedQuestion: { en: "Please type a question first.", id: "Tulis pertanyaan dulu." },
  statusCopied: { en: "Copied to clipboard.", id: "Disalin ke clipboard." },
  statusSaved: { en: "Draft saved.", id: "Draf tersimpan." },
  statusSavedLocal: { en: "Draft saved locally (Firebase not connected).", id: "Draf tersimpan lokal (Firebase belum terhubung)." },
  statusDeleted: { en: "Draft deleted.", id: "Draf dihapus." },
  statusError: { en: "Something went wrong: ", id: "Terjadi kesalahan: " },
  // Paket 32 (perbaikan 28 Nov 00:13) — JANGAN PERNAH menampilkan error
  // mentah / instruksi npx ke pengguna. Pesan ini ramah dan umum; detail
  // teknis hanya masuk console.error, bukan layar warga.
  statusAiError: {
    en: "The AI can't be reached right now — please try again later, or ask Anin (the guide button at the bottom right).",
    id: "AI sedang tidak bisa dihubungi — coba lagi nanti, atau tanyakan Anin (tombol pemandu di kanan bawah).",
  },
  // Paket 30 — draf offline: AI gagal, isi dibuat dari formulir.
  statusDraftOffline: {
    en: "AI call failed — draft built offline from the form. Please review before use.",
    id: "Panggilan AI gagal — draf dibuat offline dari formulir. Periksa sebelum dipakai.",
  },
  sourcesLabel: { en: "Sources: ", id: "Sumber: " },
  kbOfflineNote: {
    en: "Answered from the offline guide (no AI call needed).",
    id: "Dijawab dari panduan offline (tanpa panggilan AI).",
  },
  open: { en: "Open", id: "Buka" },
  delete: { en: "Delete", id: "Hapus" },
  print: { en: "Print", id: "Cetak" },
  detail: { en: "Detail", id: "Detail" },
  close: { en: "Close", id: "Tutup" },
  // Drafts search + data backup (Archive tab)
  draftsSearch: { en: "Search drafts", id: "Cari draf" },
  draftsSearchPh: { en: "Search drafts by title or text…", id: "Cari draf berdasarkan judul atau isi…" },
  draftsNoMatch: { en: "No drafts match your search.", id: "Tidak ada draf yang cocok dengan pencarian." },
  backupTitle: { en: "Data backup", id: "Cadangan data" },
  backupHint: {
    en: "Download all local data (letters, personnel, IKM, complaints, checklists) as one JSON file — keep it as a backup or move it to another device.",
    id: "Unduh semua data lokal (surat, kepegawaian, IKM, pengaduan, checklist) dalam satu file JSON — simpan sebagai cadangan atau pindahkan ke perangkat lain.",
  },
  backupExport: { en: "Download backup (JSON)", id: "Unduh cadangan (JSON)" },
  backupDone: { en: "Backup downloaded.", id: "Cadangan diunduh." },
  // IKM export + clearer per-element chart
  ikmExport: { en: "Download results (CSV)", id: "Unduh hasil (CSV)" },
  ikmExported: { en: "IKM results downloaded.", id: "Hasil IKM diunduh." },
  ikmScaleNote: {
    en: "Scale 1–4 (4 = best). Green ≥ 3.5, amber 2.5–3.5, red below 2.5.",
    id: "Skala 1–4 (4 = terbaik). Hijau ≥ 3,5, kuning 2,5–3,5, merah di bawah 2,5.",
  },
  // Pengaduan: type filter + detail dialog
  aduFilterJenis: { en: "All types", id: "Semua jenis" },
  aduDetailTitle: { en: "Complaint detail", id: "Detail pengaduan" },
  // Kepegawaian: detail dialog
  kegDetailTitle: { en: "Officer detail", id: "Detail pegawai" },
  savedAt: { en: "Saved ", id: "Disimpan " },
  deviceAvailable: { en: "On-device: ready", id: "Perangkat: siap" },
  deviceDownloading: { en: "On-device: downloading…", id: "Perangkat: mengunduh…" },
  deviceDownloadable: { en: "On-device: downloadable", id: "Perangkat: dapat diunduh" },
  deviceUnavailable: { en: "On-device: unavailable", id: "Perangkat: tidak tersedia" },
  deviceUnsupported: { en: "On-device: not supported here", id: "Perangkat: tidak didukung di sini" },
  firebaseReady: { en: "Firebase: connected", id: "Firebase: terhubung" },
  firebaseSynced: { en: "Synced", id: "Tersinkron" },
  firebaseNotSynced: { en: "Not synced yet", id: "Belum tersinkron" },
  firebaseDemo: { en: "Firebase: demo mode", id: "Firebase: mode demo" },
  firebaseError: { en: "Firebase: error", id: "Firebase: error" },
  netOnline: { en: "Online", id: "Online" },
  netOffline: { en: "Offline — saved locally", id: "Offline — tersimpan lokal" },
  // Paket 27 — Anin (pemandu DesaAI), Surat Cepat, Paket Adopsi Desa Lain.
  // "%d" / "%s" are filled in by main.ts (counts / template name).
  aninTitle: { en: "Anin — your DesaAI guide", id: "Anin — pemandu DesaAI" },
  aninHiPagi: {
    en: "Good morning! I'm Anin, your DesaAI guide. Shall we get today's letters done?",
    id: "Selamat pagi! Saya Anin, pemandu DesaAI. Yuk, bereskan surat hari ini.",
  },
  aninHiSiang: {
    en: "Good afternoon! I'm Anin, your DesaAI guide. What shall we work on first?",
    id: "Selamat siang! Saya Anin, pemandu DesaAI. Mau kerjakan apa dulu?",
  },
  aninHiSore: {
    en: "Good afternoon! I'm Anin, your DesaAI guide. Almost done for today?",
    id: "Selamat sore! Saya Anin, pemandu DesaAI. Sudah hampir selesai hari ini?",
  },
  aninHiMalam: {
    en: "Good evening! I'm Anin, your DesaAI guide. Still a letter to finish?",
    id: "Selamat malam! Saya Anin, pemandu DesaAI. Masih ada surat yang harus diselesaikan?",
  },
  aninTipAduan: {
    en: "%d new complaints are waiting — open the Complaints tab and I'll point you to the oldest one first.",
    id: "Ada %d pengaduan baru menunggu — buka tab Pengaduan, saya tunjuk yang paling lama dulu.",
  },
  aninTipMasa: {
    en: "%d terms of office need attention — check the Personnel tab before they expire.",
    id: "Ada %d masa bhakti yang perlu perhatian — cek tab Kepegawaian sebelum habis.",
  },
  aninTipSurat: {
    en: "No letters drafted today yet — write one sentence in Surat Cepat and I'll fill in the form for you.",
    id: "Belum ada surat hari ini — tulis satu kalimat di Surat Cepat, saya bantu isi formulirnya.",
  },
  aninRot1: {
    en: "Tip: download a backup (Data & backup card) every Friday — your data never leaves this browser.",
    id: "Tips: unduh backup (kartu Data & cadangan) tiap Jumat — data Anda tidak pernah keluar dari browser ini.",
  },
  aninRot2: {
    en: "Tip: share the IKM survey link or QR code at the counter — more answers, clearer picture of the service.",
    id: "Tips: bagikan tautan atau QR survei IKM di loket — makin banyak jawaban, makin jelas gambaran pelayanan.",
  },
  aninRot3: {
    en: "Tip: the Auto number button fills the letter number for you — one less thing to type.",
    id: "Tips: tombol Nomor otomatis mengisi nomor surat untuk Anda — satu hal yang tak perlu diketik.",
  },
  aninRot4: {
    en: "Tip: press Ctrl+K to jump to any menu — faster than scrolling through tabs.",
    id: "Tips: tekan Ctrl+K untuk lompat ke menu apa pun — lebih cepat daripada menggulir tab.",
  },
  aninRot5: {
    en: "Tip: the Mail Register search finds letters by subject, sender, or number — try it in the Agenda tab.",
    id: "Tips: pencarian Buku Agenda menemukan surat dari perihal, pihak, atau nomor — coba di tab Agenda.",
  },
  aninRot6: {
    en: "Tip: an archived letter can be printed with the official kop — open it in the Archive & Drafts tab.",
    id: "Tips: surat arsip bisa dicetak dengan kop resmi — buka di tab Arsip & Draf.",
  },
  aninRot7: {
    en: "Tip: DesaAI works fully offline — letters, agenda, and survey answers are saved in this browser even without internet.",
    id: "Tips: DesaAI berfungsi penuh offline — surat, agenda, dan jawaban survei tersimpan di browser ini walau tanpa internet.",
  },
  aninGoLetters: { en: "Draft a letter", id: "Buat surat" },
  aninGoAduan: { en: "See complaints", id: "Lihat pengaduan" },
  aninDraftsEmpty: {
    en: "Anin: no drafts yet — draft your first letter in the Draft Letters tab; Surat Cepat can fill in the form from one sentence.",
    id: "Anin: belum ada draf — buat surat pertama di tab Draf Surat; Surat Cepat bisa mengisi formulir dari satu kalimat.",
  },
  aninAgendaEmpty: {
    en: "Anin: nothing found — try another keyword, or clear the search to see the whole register.",
    id: "Anin: tidak ketemu — coba kata kunci lain, atau kosongkan pencarian untuk melihat semua agenda.",
  },
  aninGenerateEmpty: {
    en: "Anin: the form is still empty — write one sentence in Surat Cepat above, or fill in the subject first, then press Generate draft.",
    id: "Anin: formulirnya masih kosong — tulis satu kalimat di Surat Cepat di atas, atau isi perihal dulu, lalu tekan Buat draf.",
  },
  // Paket 32 — Anin chat: the in-app agent. "%d" / "%s" filled by main.ts.
  aninChatAsk: { en: "Ask Anin", id: "Tanya Anin" },
  aninChatWelcomeBody: {
    en: "I can answer questions about this app and help fill in letters — try a command like “Draft an invitation to the village meeting”.",
    id: "Saya bisa menjawab pertanyaan tentang aplikasi ini dan membantu mengisi surat — coba perintah seperti “Buatkan surat undangan musyawarah desa”.",
  },
  aninChatPh: {
    en: "Ask Anin about this app…",
    id: "Tanya Anin tentang aplikasi ini…",
  },
  aninChatSend: { en: "Send", id: "Kirim" },
  aninChatStatusReady: { en: "Ready to help", id: "Siap membantu" },
  aninChatStatusTyping: { en: "Anin is typing…", id: "Anin mengetik…" },
  aninChatStatusOffline: {
    en: "Answered from the offline guide",
    id: "Dijawab dari panduan offline",
  },
  aninChatStatusDevice: {
    en: "Answered by on-device AI",
    id: "Dijawab AI perangkat",
  },
  aninChatStatusCloud: { en: "Answered by cloud AI", id: "Dijawab AI cloud" },
  // Paket 32 (standar "DIMAKSIMALKAN" 28 Nov 00:20) — Anin tidak boleh
  // buntu: bila tidak paham, ia menyebut apa saja yang bisa dibantunya.
  aninChatNoUnderstand: {
    en: "Sorry, I don't understand that question yet — but I can help with: drafting a letter (“Draft an invitation to the village meeting”), procedure requirements (“What do I need for a KTP?”), Personnel Data, IKM, complaints, the Mail Register, and trend analysis (“What is the top complaint this month?”). Try one of those, or tap a suggestion below.",
    id: "Maaf, saya belum paham pertanyaan itu — tapi saya bisa membantu soal: membuat draf surat (“Buatkan surat undangan musyawarah desa”), syarat prosedur (“Syarat KTP apa saja?”), Data Kepegawaian, IKM, pengaduan, Buku Agenda, dan analisis tren (“Keluhan terbanyak bulan ini apa?”). Coba salah satu contoh itu, atau ketuk salah satu saran di bawah.",
  },
  // Paket 32.1 — jawaban "belum paham" bukan jalan buntu: bila ada topik
  // yang hampir cocok, Anin menyebutkannya di bawah jawaban ini.
  aninChatMaybeMeant: {
    en: "Did you mean one of these? %s — tap the suggestion chips below, or rephrase the question.",
    id: "Mungkin yang Anda maksud: %s — ketuk saran di bawah, atau ulangi pertanyaannya dengan kata lain.",
  },
  // Paket 32 — Anin mengambil alih Tanya Prosedur saat AI gagal (28 Nov 00:13).
  aninChatAiFailed: {
    en: "The cloud AI can't be reached, so I answered from the built-in procedure guide below — the guide works offline.",
    id: "AI cloud sedang tidak bisa dihubungi, jadi saya menjawab dari panduan prosedur bawaan di bawah ini — panduan ini bekerja offline.",
  },
  aninChatLetterDone: {
    en: "Done! I filled in the letter form (%d fields) — please check it in the Draft Letters tab before pressing “Generate draft”.",
    id: "Baik! Formulir surat sudah saya isi (%d kolom) — silakan periksa di tab Draf Surat sebelum menekan “Buat draf”.",
  },
  aninChatLetterNeed: {
    en: "Which letter? Tell me the type — invitation, SKTM, cover letter, or decree — plus the date, place, and names if you have them. For example: “Draft an invitation to the village meeting on Friday, 28 November 2026 at 09.00 at the village hall”.",
    id: "Surat apa yang mau dibuat? Sebutkan jenisnya — undangan, SKTM, pengantar, atau surat keputusan — plus tanggal, tempat, dan nama bila ada. Contoh: “Buatkan surat undangan musyawarah desa hari Jumat, 28 November 2026 jam 09.00 di Balai Desa”.",
  },
  aninChatNavDone: { en: "Sure — opening %s.", id: "Baik, saya bukakan %s." },
  aninChatThanks: {
    en: "You're welcome! Anything else I can help with?",
    id: "Sama-sama! Ada lagi yang bisa saya bantu?",
  },
  aninChipLetter: { en: "Draft an invitation letter", id: "Buatkan surat undangan" },
  aninChipKtp: { en: "What do I need for a KTP?", id: "Syarat KTP apa saja?" },
  aninChipSk: {
    en: "How do I make an appointment decree?",
    id: "Cara buat SK pengangkatan",
  },
  aninChipKeg: { en: "Open Personnel Data", id: "Buka Data Kepegawaian" },
  aninFaqSurat: {
    en: "Open the Draft Letters tab, choose a letter type, fill in the form, then press “Generate draft”. Always check the draft before using it. Or just tell me: “Draft an invitation…” and I'll fill in the form for you.",
    id: "Buka tab Draf Surat, pilih jenis surat, isi formulir, lalu tekan “Buat draf”. Selalu periksa drafnya sebelum dipakai. Atau perintahkan saya: “Buatkan surat undangan…” — saya isi formulirnya.",
  },
  aninFaqCepat: {
    en: "Surat Cepat (in the Draft Letters tab) fills in the form from one sentence — for example “Invitation to the village meeting on Friday, 28 November 2026 at 09.00 at the village hall”. It works offline.",
    id: "Surat Cepat (di tab Draf Surat) mengisi formulir dari satu kalimat — contoh: “Undangan musyawarah desa hari Jumat, 28 November 2026 jam 09.00 di Balai Desa”. Berfungsi offline.",
  },
  aninFaqSimpan: {
    en: "Press “Save draft” after generating a letter — it is stored in the Archive & Drafts tab (in this browser, and in Firestore when signed in).",
    id: "Tekan “Simpan draf” setelah draf dibuat — tersimpan di tab Arsip & Draf (di browser ini, dan di Firestore bila sudah masuk).",
  },
  aninFaqCetak: {
    en: "Press “Print” on a draft — the letter prints with the official kop. Choose “Save as PDF” in the print dialog to save it as PDF.",
    id: "Tekan “Cetak” pada draf — surat tercetak dengan kop resmi. Pilih “Save as PDF” di dialog cetak untuk menyimpan sebagai PDF.",
  },
  aninFaqWa: {
    en: "Press “Send via WhatsApp” on a draft — or on a saved letter in Archive & Drafts. WhatsApp opens with the letter text already filled in; just pick a recipient and send. A very long letter is copied to the clipboard instead, so paste it in WhatsApp.",
    id: "Tekan “Kirim ke WhatsApp” pada draf — atau pada surat tersimpan di Arsip & Draf. WhatsApp terbuka dengan isi surat sudah terisi; tinggal pilih penerima lalu kirim. Surat yang sangat panjang disalin ke clipboard, jadi tempel saja di WhatsApp.",
  },
  aninFaqWord: {
    en: "Honest note: the “Export Word” button in Personnel Data currently downloads a CSV file (not a .docx yet) — open it in a spreadsheet. A real .docx export is still on the to-do list.",
    id: "Jujur saja: tombol “Export Word” di Data Kepegawaian saat ini mengunduh berkas CSV (bukan .docx) — buka di spreadsheet. Ekspor .docx asli masih dalam daftar perbaikan.",
  },
  aninFaqIkm: {
    en: "IKM is the satisfaction survey: residents answer it in the Satisfaction (IKM) tab, and the score appears on the home dashboard. Share the survey link or QR code at the counter to collect more answers.",
    id: "IKM adalah survei kepuasan: warga mengisinya di tab Kepuasan (IKM), dan skornya tampil di beranda. Bagikan tautan atau QR survei di loket untuk mengumpulkan lebih banyak jawaban.",
  },
  aninFaqAduan: {
    en: "Open the Complaints tab and press “New complaint” — fill in the reporter's name, category, and the complaint. New complaints appear on the home dashboard until followed up.",
    id: "Buka tab Pengaduan lalu tekan “Pengaduan baru” — isi nama pelapor, kategori, dan isi pengaduan. Pengaduan baru tampil di beranda sampai ditindaklanjuti.",
  },
  // Paket 32.1 — alur PENYELESAIAN pengaduan (kasus tangkapan layar Bos
  // 28 Nov 08:55: "Kalau ada pengaduan bisa selesaikan" dijawab
  // "belum paham"). Jawaban ini berpijak pada alur nyata aplikasi:
  // status Baru → Diproses → Selesai, diubah petugas lewat menu status
  // di tab Pengaduan; Anin tidak menyelesaikan sendiri.
  aninFaqAduanSelesai: {
    en: "Yes — a complaint is followed up by the office staff with the flow New → In progress → Resolved. Open the Complaints tab to see the list and track each complaint's status — staff change the status in the status menu of each complaint. When filing, describe the problem clearly (what happened, when) so staff can follow up; name and contact may be left empty (anonymous). I can't resolve a complaint myself — the office staff does that — but I can show the trend, for example ask “What is the top complaint this month?”. How long it takes is not fixed in this app — ask the staff for an estimate.",
    id: "Bisa. Pengaduan ditindaklanjuti petugas dengan alur status Baru → Diproses → Selesai. Buka tab Pengaduan untuk melihat daftarnya dan memantau status tiap pengaduan — petugas mengubah status lewat menu status di tiap pengaduan. Saat membuat pengaduan, isi jenis dan isi pengaduan yang jelas (apa masalahnya, kapan terjadi) supaya petugas bisa menindaklanjuti; nama dan kontak boleh dikosongkan (anonim). Saya sendiri tidak bisa menyelesaikan pengaduan — yang menyelesaikan adalah petugas kantor — tapi saya bisa menunjukkan trennya, misalnya tanya “Keluhan terbanyak bulan ini?”. Soal berapa lama selesai, tidak ada batas waktu baku di aplikasi ini — tanyakan perkiraannya ke petugas.",
  },
  aninFaqWarga: {
    en: "Citizen mode (Mode Warga) is for residents: no login needed — they can fill in the IKM survey, file a complaint, or ask about procedures.",
    id: "Mode Warga untuk warga: tanpa login — warga bisa mengisi survei IKM, membuat pengaduan, atau bertanya prosedur.",
  },
  aninFaqOffline: {
    en: "Your data stays in this browser (and in your Firestore account when signed in) — letters and survey answers are saved even without internet, and nothing is sent anywhere without your action.",
    id: "Data Anda tersimpan di browser ini (dan di akun Firestore bila sudah masuk) — surat dan jawaban survei tersimpan walau tanpa internet, dan tidak ada yang dikirim ke mana pun tanpa tindakan Anda.",
  },
  aninFaqAgenda: {
    en: "The Mail Register tab lists all incoming and outgoing letters — search by subject, sender, or number, and export the list as CSV.",
    id: "Tab Buku Agenda mencatat semua surat masuk dan keluar — cari dari perihal, pihak, atau nomor, dan ekspor daftarnya sebagai CSV.",
  },
  aninFaqSk: {
    en: "For an appointment decree, open the Draft Letters tab and choose “SK Pengangkatan Perangkat Desa” — fill in the officer's name, position, village, and term. Or tell me: “Draft an appointment decree for Ahmad Fauzi as village head”.",
    id: "Untuk SK pengangkatan, buka tab Draf Surat lalu pilih “SK Pengangkatan Perangkat Desa” — isi nama perangkat, jabatan, desa, dan masa bhakti. Atau perintahkan saya: “Buatkan SK pengangkatan Ahmad Fauzi sebagai Kepala Desa”.",
  },
  aninFaqRingkasan: {
    en: "Open the Summarize tab, paste a long text, and press “Summarize” — Anin shortens it while keeping the main points. It works offline for short texts.",
    id: "Buka tab Ringkasan, tempel teks yang panjang, lalu tekan “Ringkas” — Anin memendekkannya tanpa menghilangkan poin utama. Berfungsi offline untuk teks pendek.",
  },
  aninFaqArsip: {
    en: "Open the Archive & Drafts tab to see saved letters — press “Open” to continue one, or “Delete” to remove it. Drafts are saved in this browser.",
    id: "Buka tab Arsip & Draf untuk melihat surat tersimpan — tekan “Buka” untuk melanjutkan, atau “Hapus” untuk membuangnya. Draf tersimpan di browser ini.",
  },
  aninFaqKeg: {
    en: "Open the Personnel Data tab to add village officers, record their term of office, and make an appointment decree (SK) — Anin warns you 90 days before a term ends.",
    id: "Buka tab Data Kepegawaian untuk menambah perangkat desa, mencatat masa bhakti, dan membuat SK pengangkatan — Anin mengingatkan 90 hari sebelum masa bhakti habis.",
  },
  aninFaqKop: {
    en: "Open the letterhead settings (home page, “Pengaturan Kop Surat”) to change the office name, address, and the Camat's name/NIP printed on letters. DesaAI never invents a Camat name — an empty field prints “—”.",
    id: "Buka pengaturan kop surat (beranda, “Pengaturan Kop Surat”) untuk mengubah nama instansi, alamat, dan nama/NIP Camat yang tercetak di surat. DesaAI tidak pernah mengarang nama Camat — kolom kosong tercetak “—”.",
  },
  aninFaqBahasa: {
    en: "Press the language button in the page head to switch between Indonesian and English.",
    id: "Tekan tombol bahasa di kepala halaman untuk beralih antara Bahasa Indonesia dan English.",
  },
  aninFaqTema: {
    en: "Press the sun/moon button in the page head to switch between light and dark mode — your choice is remembered.",
    id: "Tekan tombol matahari/bulan di kepala halaman untuk beralih mode terang dan gelap — pilihan Anda diingat.",
  },
  aninFaqBackup: {
    en: "Open the Data & backup card on the home page — “Download backup” saves all your data as a file, and “Restore” loads it back on any device.",
    id: "Buka kartu Data & cadangan di beranda — “Unduh backup” menyimpan semua data sebagai berkas, dan “Pulihkan” memuatnya kembali di perangkat mana pun.",
  },
  aninFaqAiGagal: {
    en: "If the AI fails, DesaAI still makes the draft from your form (offline draft) — check that the form is filled in. If the “AI can't be reached” message keeps appearing, the cloud AI is not active yet in this Firebase project.",
    id: "Bila AI gagal, DesaAI tetap membuat draf dari formulir (draf offline) — periksa formulirnya sudah terisi. Bila pesan “AI tidak bisa dihubungi” terus muncul, AI cloud belum aktif di proyek Firebase ini.",
  },
  aninFaqQr: {
    en: "In the Satisfaction (IKM) tab you can copy the survey link or show its QR code — print it at the counter so residents can scan it with their phones.",
    id: "Di tab Kepuasan (IKM) Anda bisa menyalin tautan survei atau menampilkan kode QR-nya — cetak di loket supaya warga bisa memindainya dengan HP.",
  },
  aninFaqNomor: {
    en: "In the letter form, press “Nomor otomatis” — Anin fills in the next letter number for that letter type automatically.",
    id: "Di formulir surat, tekan “Nomor otomatis” — Anin mengisi nomor surat berikutnya untuk jenis surat itu secara otomatis.",
  },
  aninFaqSuara: {
    en: "You can talk to Anin: press the microphone button in the chat and speak in Indonesian — Anin types what you said. Press “Bacakan” on any of my answers and I'll read it aloud.",
    id: "Anda bisa bicara dengan Anin: tekan tombol mikrofon di chat lalu ucapkan dalam Bahasa Indonesia — Anin mengetik apa yang Anda ucapkan. Tekan “Bacakan” pada jawaban saya, saya akan membacakannya.",
  },
  // Paket 32 — KB dimaksimalkan (28 Nov 00:20): beranda, Tanya Prosedur,
  // dan Paket Adopsi Desa Lain juga tercakup, tanpa celah.
  aninFaqBeranda: {
    en: "The Home tab shows the office at a glance: quick stats (letters, residents' satisfaction, complaints), Anin's tip of the day, the letterhead settings, data backup, and the adoption pack for other villages.",
    id: "Tab Beranda menampilkan kantor sekilas: statistik cepat (surat, kepuasan warga, pengaduan), tips Anin hari ini, pengaturan kop surat, cadangan data, dan paket adopsi untuk desa lain.",
  },
  aninFaqTanya: {
    en: "Open the “Ask about Procedures” tab and type your question — for example “What do I need for a new KK?”. Anin answers from the built-in procedure guide (KTP, KK, SKTM, and more), and the guide itself works fully offline. You can also press “Bacakan” to hear the answer, or “Lanjutkan dengan Anin” to keep asking in the chat.",
    id: "Buka tab “Tanya Prosedur” lalu ketik pertanyaan — contoh “Bagaimana cara mengurus KK baru?”. Anin menjawab dari panduan prosedur bawaan (KTP, KK, SKTM, dan lainnya), dan panduannya sendiri bekerja penuh offline. Anda juga bisa menekan “Bacakan” untuk mendengar jawabannya, atau “Lanjutkan dengan Anin” untuk bertanya lanjut di chat.",
  },
  aninFaqAdopsi: {
    en: "Yes — another village office can use this app: on the Home tab, press “Download adoption pack” to get a file with the letterhead, the letter templates, and a 5-step adoption checklist. No office data is included in the pack.",
    id: "Bisa — kantor desa lain bisa memakai aplikasi ini: di tab Beranda, tekan “Unduh paket adopsi” untuk mendapatkan berkas berisi kop surat, templat surat, dan checklist adopsi 5 langkah. Tidak ada data kantor yang ikut dalam paket itu.",
  },
  // Paket 32 — Anin bicara (voice): gratis, tanpa server.
  aninVoiceMic: { en: "Speak", id: "Bicara" },
  aninVoiceListening: { en: "Listening… speak now", id: "Mendengarkan… silakan bicara" },
  aninVoiceNoMic: {
    en: "Sorry — voice input is not supported by this browser. Please type your question instead.",
    id: "Maaf — pengenalan suara tidak didukung browser ini. Silakan ketik pertanyaannya.",
  },
  aninVoiceNoVoice: {
    en: "This device has no voice available, so I can't read it aloud here — try on your phone and I'll read the answer.",
    id: "Perangkat ini belum menyediakan suara, jadi saya belum bisa membacakan di sini — coba di HP, saya akan membacakan jawabannya.",
  },
  aninVoiceRead: { en: "Read aloud", id: "Bacakan" },
  aninVoiceMicError: {
    en: "The microphone couldn't be used (%s) — please type your question instead.",
    id: "Mikrofon tidak bisa dipakai (%s) — silakan ketik pertanyaannya.",
  },
  // Paket 32 — Anin mengambil alih Tanya Prosedur (28 Nov 00:13): wajah +
  // suara Anin di bagian Tanya; AI gagal = jawab dari panduan offline.
  aninQaAninTitle: {
    en: "Answered by Anin — your in-app guide",
    id: "Dijawab Anin — pemandu aplikasi",
  },
  aninQaAninHint: {
    en: "Ask about any village procedure — Anin answers from the official guide below. When the cloud AI is unavailable, she still answers from the guide (offline), and can read the answer aloud or keep helping you in the chat.",
    id: "Tanyakan prosedur apa pun — Anin menjawab dari panduan resmi di bawah. Saat AI cloud tidak bisa dihubungi, Anin tetap menjawab dari panduan (offline), dan bisa membacakan jawabannya atau membantu lanjut di chat.",
  },
  aninQaAiFailed: {
    en: "Anin: the cloud AI can't be reached right now — the answer above comes from the built-in procedure guide (offline). Once the cloud AI is active, I can answer in more detail.",
    id: "Anin: AI cloud sedang tidak bisa dihubungi — jawaban di atas dari panduan prosedur bawaan (offline). Bila AI cloud sudah aktif, saya bisa menjawab lebih lengkap.",
  },
  aninQaNoGuide: {
    en: "Sorry — I couldn't find a matching guide for that question. Try other keywords, for example “KTP”, “KK”, “SKTM”, or “domisili” — or ask Anin directly with the guide button at the bottom right.",
    id: "Maaf — saya belum menemukan panduan yang cocok untuk pertanyaan itu. Coba kata kunci lain, misalnya “KTP”, “KK”, “SKTM”, atau “domisili” — atau tanyakan langsung ke Anin lewat tombol pemandu di kanan bawah.",
  },
  aninQaAskAnin: { en: "Continue with Anin", id: "Lanjutkan dengan Anin" },
  // Paket 32 — Anin analis: jawaban berisi agregat saja, bukan data mentah.
  aninChatStatusAnalis: { en: "Analyzed on this device", id: "Dianalisis di perangkat ini" },
  aninAnalisIkm: {
    en: "Average IKM is %s from %d responses — category %s. Highest element: %s (%s). Lowest element: %s (%s).",
    id: "Rata-rata IKM %s dari %d jawaban — kategori %s. Unsur tertinggi: %s (%s). Unsur terendah: %s (%s).",
  },
  aninAnalisIkmNone: {
    en: "No IKM responses yet — share the survey link so residents can answer.",
    id: "Belum ada jawaban IKM — bagikan tautan survei supaya warga bisa menjawab.",
  },
  aninAnalisKeluhanMonth: {
    en: "In %s: %d complaints recorded (%d new, %d in progress, %d resolved). Most common: %s (%d complaints).",
    id: "Bulan %s: %d pengaduan tercatat (%d baru, %d diproses, %d selesai). Terbanyak: %s (%d pengaduan).",
  },
  aninAnalisKeluhanAll: {
    en: "No complaints this month yet — across all %d recorded complaints, the most common is: %s (%d complaints).",
    id: "Bulan ini belum ada pengaduan baru — dari keseluruhan %d pengaduan yang tercatat, terbanyak: %s (%d pengaduan).",
  },
  aninAnalisKeluhanNone: {
    en: "No complaints recorded yet.",
    id: "Belum ada pengaduan yang tercatat.",
  },
  aninAnalisPerbaikiHead: {
    en: "What most needs improving:",
    id: "Yang paling perlu diperbaiki:",
  },
  aninAnalisPerbaikiUnsur: {
    en: "• %s — score %s (lowest of the 9 IKM elements). Suggestion: %s",
    id: "• %s — skor %s (terendah dari 9 unsur IKM). Saran: %s",
  },
  aninAnalisPerbaikiJenis: {
    en: "• Complaints about %s (%d complaints). Suggestion: %s",
    id: "• Keluhan %s (%d pengaduan). Saran: %s",
  },
  aninAnalisNoData: {
    en: "No IKM or complaint data to analyze yet — fill in the IKM survey or record a complaint first.",
    id: "Belum ada data IKM atau pengaduan yang bisa dianalisis — isi survei IKM atau catat pengaduan dulu.",
  },
  aninSaranPersyaratan: {
    en: "Post the requirements list on the notice board and share it via Anin, so residents arrive with complete documents.",
    id: "Pasang daftar syarat di papan pengumuman dan bagikan lewat Anin, supaya warga datang dengan berkas lengkap.",
  },
  aninSaranProsedur: {
    en: "Write the steps on the notice board — Anin can also explain them when residents ask.",
    id: "Tulis langkah pengurusan di papan pengumuman — Anin juga bisa menjelaskannya bila warga bertanya.",
  },
  aninSaranWaktu: {
    en: "Speed up the slowest service — check the Mail Register for piled-up letters.",
    id: "Percepat layanan yang paling lama antre — cek Buku Agenda untuk surat yang menumpuk.",
  },
  aninSaranBiaya: {
    en: "Make sure the fee board matches what the counter asks — residents complain when they differ.",
    id: "Pastikan papan informasi biaya sesuai dengan yang diminta di loket — warga mengeluh bila berbeda.",
  },
  aninSaranProduk: {
    en: "Clarify the service result (letter form, validity) up front, so residents know what they receive.",
    id: "Perjelas hasil layanan (bentuk surat, masa berlaku) di awal, supaya warga tahu apa yang diterima.",
  },
  aninSaranKompetensi: {
    en: "Run a short training for staff on the newest procedures — Anin can be the training material.",
    id: "Adakan latihan singkat untuk petugas tentang prosedur terbaru — Anin bisa jadi bahan latihannya.",
  },
  aninSaranPerilaku: {
    en: "Remind staff to greet residents warmly — a kind greeting raises the behavior score.",
    id: "Ingatkan petugas untuk menyapa warga dengan ramah — sapaan yang baik menaikkan skor perilaku.",
  },
  aninSaranPenanganan: {
    en: "Follow up complaints still marked “New” in the Complaints tab — residents judge by response speed.",
    id: "Tindaklanjuti pengaduan yang masih “Baru” di tab Pengaduan — warga menilai dari kecepatan tanggapan.",
  },
  aninSaranSarana: {
    en: "Fix the facilities residents complain about — waiting room, chairs, and fans are mentioned most.",
    id: "Perbaiki sarana yang dikeluhkan warga — ruang tunggu, kursi, dan kipas angin adalah yang paling sering disebut.",
  },
  aninSaranLambat: {
    en: "Set a clear completion schedule for each letter and announce it to residents.",
    id: "Buat jadwal penyelesaian yang jelas untuk tiap surat dan umumkan ke warga.",
  },
  aninSaranSyarat: {
    en: "Post the requirements list at the counter and notice board so the requirements are the same every time.",
    id: "Tempel daftar syarat di loket dan papan pengumuman supaya syaratnya sama setiap kali ditanyakan.",
  },
  aninSaranRamah: {
    en: "Remind counter staff to answer in a friendly tone — Anin can help answer procedural questions.",
    id: "Ingatkan petugas loket untuk menjawab dengan nada ramah — Anin bisa membantu menjawab pertanyaan prosedural.",
  },
  aninSaranBiayaAduan: {
    en: "Match the fee charged to the information board — if it is free, write “Free” clearly.",
    id: "Samakan biaya yang diminta dengan papan informasi — bila gratis, tulis “Gratis” dengan jelas.",
  },
  aninSaranLainnya: {
    en: "Read the complaints one by one in the Complaints tab and group the most frequent ones.",
    id: "Baca isi pengaduan satu per satu di tab Pengaduan dan kelompokkan mana yang paling sering muncul.",
  },
  aninChipIkm: { en: "What is the average IKM?", id: "IKM rata-rata berapa?" },
  aninChipKeluhan: { en: "Most common complaints?", id: "Keluhan terbanyak bulan ini?" },
  // Paket 34, Ide 5 — lapor warga lewat Anin (alur chat terpandu).
  aninChipLapor: { en: "Report a problem", id: "Saya mau lapor" },
  laporAskJenis: {
    en: "Of course — let's report it step by step. First, what kind of problem is it? Reply with the number:\n%s",
    id: "Baik, kita laporkan langkah demi langkah. Pertama, masalahnya jenis apa? Balas dengan angkanya:\n%s",
  },
  laporAskIsi: {
    en: "Got it — %s. Now describe the problem briefly (what happened, when, where).",
    id: "Baik — %s. Sekarang ceritakan masalahnya secara singkat (apa yang terjadi, kapan, di mana).",
  },
  laporAskNama: {
    en: "Thank you. Lastly, your name and phone number (optional) so the office can follow up — or type “lewati” to stay anonymous.",
    id: "Terima kasih. Terakhir, nama dan nomor HP Anda (boleh kosong) supaya petugas bisa menindaklanjuti — atau ketik “lewati” bila ingin anonim.",
  },
  laporJenisInvalid: {
    en: "Please reply with a number 1–%d, or the type name, e.g. “Keterlambatan”. Type “batal” to stop.",
    id: "Balas dengan angka 1–%d, atau nama jenisnya, mis. “Keterlambatan”. Ketik “batal” untuk berhenti.",
  },
  laporNeedIsi: {
    en: "Please describe the problem first — one sentence is enough. Type “batal” to stop.",
    id: "Ceritakan dulu masalahnya — satu kalimat saja cukup. Ketik “batal” untuk berhenti.",
  },
  laporDone: {
    en: "Done — your report is saved with ticket %s (status: Baru). Keep the ticket number to track it in the Complaints tab. The office also prepared a complaint letter draft from your report.",
    id: "Selesai — laporan Anda tersimpan dengan nomor tiket %s (status: Baru). Simpan nomor tiketnya untuk melacak di tab Pengaduan. Petugas juga sudah dibuatkan draf surat pengaduan dari laporan Anda.",
  },
  laporCancelled: {
    en: "Okay, the report is cancelled — nothing was saved.",
    id: "Baik, laporan dibatalkan — tidak ada yang tersimpan.",
  },
  // Paket 34, Ide 4 — verifikasi surat via QR.
  qrButton: { en: "QR Verification", id: "QR Verifikasi" },
  qrTitle: { en: "Verification QR code", id: "Kode QR verifikasi" },
  qrHint: {
    en: "Scan this code to open the verification page. It only proves the letter matches the archive stored in this browser — on another device it may say “not found”.",
    id: "Pindai kode ini untuk membuka halaman verifikasi. Kode ini hanya membuktikan surat cocok dengan arsip di browser ini — di perangkat lain bisa muncul “tidak ditemukan”.",
  },
  qrDownload: { en: "Download QR (PNG)", id: "Unduh QR (PNG)" },
  qrCopy: { en: "Copy link", id: "Salin tautan" },
  qrCopied: { en: "Verification link copied.", id: "Tautan verifikasi disalin." },
  qrCopyFail: { en: "Could not copy the link.", id: "Tautan tidak bisa disalin." },
  verifySubtitle: {
    en: "Letter verification — Kecamatan Simpangkatis",
    id: "Verifikasi surat — Kecamatan Simpangkatis",
  },
  verifyChecking: {
    en: "Checking the archive…",
    id: "Memeriksa arsip…",
  },
  verifyVerified: {
    en: "✓ TERVERIFIKASI: cocok dengan arsip",
    id: "✓ TERVERIFIKASI: cocok dengan arsip",
  },
  verifyTampered: {
    en: "⚠ DITEMUKAN, tapi isinya tidak cocok dengan arsip — kemungkinan isi surat sudah diubah setelah kode QR dibuat.",
    id: "⚠ DITEMUKAN, tapi isinya tidak cocok dengan arsip — kemungkinan isi surat sudah diubah setelah kode QR dibuat.",
  },
  verifyNotFound: {
    en: "✕ TIDAK DITEMUKAN dalam arsip",
    id: "✕ TIDAK DITEMUKAN dalam arsip",
  },
  verifyNotFoundHint: {
    en: "No letter with this code exists in the archive loaded on this device. That does not by itself prove the letter is fake — it may come from another device or an archive that was deleted. Ask the office to check the original archive.",
    id: "Tidak ada surat dengan kode ini di arsip yang dimuat perangkat ini. Itu saja belum membuktikan suratnya palsu — mungkin berasal dari perangkat lain atau arsip yang sudah dihapus. Minta petugas memeriksa arsip aslinya.",
  },
  verifyOpenApp: { en: "Open DesaAI", id: "Buka DesaAI" },
  verifyId: { en: "Letter code", id: "Kode surat" },
  verifyDate: { en: "Archived on", id: "Diarsipkan" },
  // Paket 34, Ide 6 — Dashboard Pagi Camat.
  camatTitle: { en: "Dashboard Pagi Camat", id: "Dashboard Pagi Camat" },
  camatHint: {
    en: "This morning's summary for the Camat — from the data already in this app. Officers only.",
    id: "Ringkasan pagi untuk Camat — dari data yang sudah ada di aplikasi ini. Khusus petugas.",
  },
  camatNoData: {
    en: "Belum ada data — no agenda, survey answers, complaints, or drafts yet.",
    id: "Belum ada data — belum ada agenda, jawaban survei, pengaduan, atau draf.",
  },
  camatSurat: { en: "Letters (agenda)", id: "Surat (agenda)" },
  camatHariIni: { en: "Today", id: "Hari ini" },
  camatMingguIni: { en: "This week", id: "Minggu ini" },
  camatMasuk: { en: "Incoming", id: "Masuk" },
  camatKeluar: { en: "Outgoing", id: "Keluar" },
  camatIkm: { en: "Satisfaction (IKM)", id: "Kepuasan (IKM)" },
  camatIkmRata: { en: "Average", id: "Rata-rata" },
  camatIkmResponden: { en: "Respondents", id: "Responden" },
  camatAduan: { en: "Complaints", id: "Pengaduan" },
  camatDrafts: { en: "Letter drafts waiting", id: "Draf surat menunggu" },
  camatOpen: { en: "Open detail", id: "Buka detail" },
  // Paket 34, Ide 5 — lacak pengaduan (nomor tiket + linimasa).
  aduTicket: { en: "Ticket", id: "No. tiket" },
  aduSearch: { en: "Track a complaint", id: "Lacak pengaduan" },
  aduSearchPh: {
    en: "Ticket number or name, e.g. ADU-2026-0001…",
    id: "Nomor tiket atau nama, mis. ADU-2026-0001…",
  },
  aduTimelineTitle: { en: "Status timeline", id: "Linimasa status" },
  cepatTitle: { en: "Surat Cepat — one sentence is enough", id: "Surat Cepat — cukup satu kalimat" },
  cepatHint: {
    en: "Describe the letter in one sentence — Anin guesses the type and fills in the form. Always check the fields before generating the draft. Works offline.",
    id: "Jelaskan suratnya dalam satu kalimat — Anin menebak jenisnya dan mengisi formulir. Selalu periksa kolomnya sebelum membuat draf. Berfungsi offline.",
  },
  cepatLabel: { en: "What letter do you need?", id: "Surat apa yang dibutuhkan?" },
  cepatPh: {
    en: "e.g. Invitation to the village meeting on Friday, 20 November 2026 at 09.00 at the village hall…",
    id: "cth: Undangan musyawarah desa hari Jumat, 20 November 2026 jam 09.00 di Balai Desa…",
  },
  cepatFill: { en: "Fill in the form", id: "Isi formulir" },
  cepatFound: {
    en: "Anin found it: %s — %d fields filled in automatically. Please check them, then press Generate draft.",
    id: "Anin menemukan: %s — %d kolom terisi otomatis. Periksa dulu, lalu tekan Buat draf.",
  },
  cepatNotFound: {
    en: "Anin: I couldn't guess the letter type yet — pick a template below and fill in the fields, or add more detail (event, date, place).",
    id: "Anin: saya belum bisa menebak jenis suratnya — pilih template di bawah dan isi kolomnya, atau tambah detail (acara, tanggal, tempat).",
  },
  cepatEmpty: {
    en: "Anin: write one sentence first — for example, an invitation with the event, day, time, and place.",
    id: "Anin: tulis satu kalimat dulu — contohnya undangan beserta acara, hari, jam, dan tempat.",
  },
  adopsiTitle: { en: "Adoption Pack for Other Villages", id: "Paket Adopsi Desa Lain" },
  adopsiHint: {
    en: "DesaAI is free and open-source — any village office can use it. Five steps, no account, no server: download the pack, follow the checklist, and the app is ready.",
    id: "DesaAI gratis dan open-source — kantor desa mana pun bisa memakainya. Lima langkah, tanpa akun, tanpa server: unduh paketnya, ikuti checklist, aplikasi siap dipakai.",
  },
  adopsiStep1: {
    en: "1. Open the live app and set your letterhead (office name, address, Camat name).",
    id: "1. Buka aplikasi live dan atur kop surat (nama kantor, alamat, nama Camat).",
  },
  adopsiStep2: {
    en: "2. Replace the sample data with your own — sample entries are clearly marked and can be deleted.",
    id: "2. Ganti data contoh dengan data sendiri — entri contoh ditandai jelas dan bisa dihapus.",
  },
  adopsiStep3: {
    en: "3. Share the IKM survey link or QR code at the service counter.",
    id: "3. Bagikan tautan atau QR survei IKM di loket pelayanan.",
  },
  adopsiStep4: {
    en: "4. Record incoming and outgoing letters in the Mail Register every day.",
    id: "4. Catat surat masuk dan keluar di Buku Agenda setiap hari.",
  },
  adopsiStep5: {
    en: "5. Download a data backup every week — the backup file moves to a new device if needed.",
    id: "5. Unduh backup data setiap minggu — file backup bisa dipindah ke perangkat baru bila perlu.",
  },
  adopsiDownload: { en: "Download adoption pack (JSON)", id: "Unduh paket adopsi (JSON)" },
  adopsiDownloaded: { en: "Adoption pack downloaded.", id: "Paket adopsi diunduh." },
  adopsiNote: {
    en: "The pack contains your letterhead, the 7 letter templates, and this checklist — no office data is included.",
    id: "Paket berisi kop surat Anda, 7 template surat, dan checklist ini — tanpa data kantor.",
  },
  // Paket 28 — redesign model SIAP AKAD: sidebar biru, kartu statistik
  // cerah, grafik per desa/jabatan, banner form biru, ekspor tabel.
  sidebarUserRole: { en: "Subdistrict Admin", id: "Admin Kecamatan" },
  sidebarUserPlace: { en: "Simpangkatis", id: "Simpangkatis" },
  sidebarLogout: { en: "Exit", id: "Keluar" },
  qsPerangkat: { en: "Village officers", id: "Perangkat desa" },
  homeDesaChartTitle: { en: "Officers per village", id: "Distribusi Perangkat per Desa" },
  homeDesaChartHint: {
    en: "Village officers in this browser, grouped by village.",
    id: "Perangkat desa di browser ini, dikelompokkan per desa.",
  },
  homeDesaChartEmpty: { en: "No officer data yet.", id: "Belum ada data perangkat." },
  homeJabatanTitle: { en: "Composition by position", id: "Komposisi Jabatan" },
  homeJabatanHint: {
    en: "Village officers in this browser, grouped by position.",
    id: "Perangkat desa di browser ini, dikelompokkan per jabatan.",
  },
  homeJabatanEmpty: { en: "No officer data yet.", id: "Belum ada data perangkat." },
  notifBell: { en: "Notifications — open Personnel", id: "Notifikasi — buka Kepegawaian" },
  kegExportPdf: { en: "Export PDF", id: "Export PDF" },
  kegExportWord: { en: "Export Word", id: "Export Word" },
  kegPrinted: {
    en: "Personnel table sent to print — choose “Save as PDF” in the print dialog.",
    id: "Tabel perangkat dikirim ke printer — pilih “Save as PDF” di dialog cetak.",
  },
  lettersFormTitle: { en: "Fill in the letter form", id: "Isi formulir surat" },
  // Paket 35 — Pengaturan (tab baru) + Kartu Kontak di Beranda
  tabSettings: { en: "Settings", id: "Pengaturan" },
  settingsTitle: { en: "Settings", id: "Pengaturan" },
  settingsHint: {
    en: "Account, display, language, Anin, letterhead, data and privacy — saved in this browser and applied immediately.",
    id: "Akun, tampilan, bahasa, Anin, kop surat, data dan privasi — tersimpan di browser ini dan langsung berlaku.",
  },
  setAccount: { en: "User account", id: "Akun Pengguna" },
  setAccountRole: { en: "Role", id: "Peran" },
  setAccountUser: { en: "Username", id: "Username" },
  setAccountDemoNote: {
    en: "Demo account — not real security. Real login comes later, once the app is ready.",
    id: "Akun demo — bukan keamanan sungguhan. Login sungguhan menyusul setelah aplikasi mantap.",
  },
  setAppearance: { en: "Appearance", id: "Tampilan" },
  setTheme: { en: "Theme", id: "Tema" },
  setThemeLight: { en: "Light", id: "Terang" },
  setThemeDark: { en: "Dark", id: "Gelap" },
  setThemeAuto: { en: "Automatic", id: "Otomatis" },
  setTextSize: { en: "Text size", id: "Ukuran teks" },
  setTextNormal: { en: "Normal", id: "Normal" },
  setTextLarge: { en: "Large", id: "Besar" },
  setTextSizeHint: {
    en: "Large text is easier to read for senior officers.",
    id: "Teks besar lebih mudah dibaca petugas senior.",
  },
  setLanguage: { en: "Language", id: "Bahasa" },
  setLangId: { en: "Bahasa Indonesia", id: "Bahasa Indonesia" },
  setLangEn: { en: "English", id: "English" },
  setLanguageHint: {
    en: "The date in the page head follows the language.",
    id: "Tanggal di kepala halaman mengikuti bahasa.",
  },
  setAnin: { en: "Anin", id: "Anin" },
  setAninVoice: {
    en: "Read answers aloud (Anin voice)",
    id: "Bacakan jawaban dengan suara (suara Anin)",
  },
  setAninVoiceHint: {
    en: "When off, the read-aloud buttons show a note instead of speaking.",
    id: "Bila mati, tombol bacakan menampilkan catatan, bukan bersuara.",
  },
  aninVoiceOff: {
    en: "Anin voice is off — turn it on in Settings to hear answers.",
    id: "Suara Anin dimatikan — nyalakan di Pengaturan untuk mendengar jawaban.",
  },
  setMode: { en: "Mode", id: "Mode" },
  setModePetugas: { en: "Officer", id: "Petugas" },
  setModeWarga: { en: "Citizen", id: "Warga" },
  setLetterheadTitle: { en: "Letterhead", id: "Kop surat" },
  setLhPreview: { en: "Preview on the letter", id: "Pratinjau di surat" },
  setLhPreviewCamat: { en: "Subdistrict head", id: "Camat" },
  setData: { en: "Data & privacy", id: "Data & privasi" },
  setBackup: { en: "Download a backup (JSON)", id: "Unduh cadangan (JSON)" },
  setBackupHint: {
    en: "Download all office data as one JSON file, or restore it from a backup. Everything stays in this browser — no data leaves the device.",
    id: "Unduh seluruh data kantor sebagai satu file JSON, atau pulihkan dari cadangan. Semua tetap di browser ini — tidak ada data yang keluar dari perangkat.",
  },
  setOfflineOnly: { en: "Offline-only mode", id: "Mode offline saja" },
  setOfflineOnlyHint: {
    en: "Never call the cloud AI — answers come from the on-device model and the offline guide only.",
    id: "Jangan pernah memanggil AI cloud — jawaban hanya dari model perangkat dan panduan offline.",
  },
  setOfflineOnlyNote: {
    en: "Offline-only mode is on — AI features are unavailable.",
    id: "Mode offline saja aktif — fitur AI tidak tersedia.",
  },
  setWipe: { en: "Delete all local data", id: "Hapus semua data lokal" },
  setWipeHint: {
    en: "Deletes letters, drafts, personnel, surveys, complaints and settings from this browser. This cannot be undone — download a backup first.",
    id: "Menghapus surat, draf, kepegawaian, survei, pengaduan, dan pengaturan dari browser ini. Tidak bisa dibatalkan — unduh cadangan dulu.",
  },
  setWipeConfirm: {
    en: "Tap again to delete everything",
    id: "Ketuk lagi untuk menghapus semuanya",
  },
  setHelp: { en: "Help & about", id: "Bantuan & Tentang" },
  setVersion: { en: "Version", id: "Versi" },
  setContactLink: { en: "Office contact", id: "Kontak kantor" },
  setContactLinkHint: {
    en: "Address, phone, email and social media on the home dashboard.",
    id: "Alamat, telepon, email, dan media sosial di Beranda.",
  },
  setAboutNote: {
    en: "DesaAI is a free, offline-first AI clerk for village and subdistrict offices — built for the #BuildHybridAI 2026 hackathon. Drafts must always be checked by an officer before use.",
    id: "DesaAI adalah petugas AI gratis yang mengutamakan offline untuk kantor desa & kecamatan — dibuat untuk hackathon #BuildHybridAI 2026. Draf wajib diperiksa petugas sebelum digunakan.",
  },
  setSaved: { en: "Settings saved.", id: "Pengaturan disimpan." },
  // Paket 36 — Layar Masuk (Login) Demo.
  loginSubtitle: {
    en: "Administrasi Kecamatan Simpangkatis",
    id: "Administrasi Kecamatan Simpangkatis",
  },
  loginLine: {
    en: "Kecamatan Simpangkatis 2026",
    id: "Kecamatan Simpangkatis 2026",
  },
  loginUser: { en: "Username", id: "Username" },
  loginUserPh: { en: "Enter username", id: "Masukkan username" },
  loginPass: { en: "Password", id: "Password" },
  loginPassPh: { en: "Enter password", id: "Masukkan password" },
  loginSubmit: { en: "Masuk Sistem", id: "Masuk Sistem" },
  loginDemoNote: {
    en: "Demo mode — not real security.",
    id: "Mode demo — bukan keamanan sungguhan.",
  },
  loginDemoCreds: {
    en: "Demo account — username: demo, password: demo123",
    id: "Akun demo — username: demo, password: demo123",
  },
  loginError: {
    en: "Wrong username or password. Use the demo account shown below.",
    id: "Username atau password salah. Pakai akun demo di bawah.",
  },
  loginFooter: {
    en: "© 2026 Kecamatan Simpangkatis – Bangka Tengah",
    id: "© 2026 Kecamatan Simpangkatis – Bangka Tengah",
  },
  contactTitle: { en: "Contact us", id: "Hubungi Kami" },
  contactHint: {
    en: "Kecamatan Simpangkatis office — visit, call or write to us.",
    id: "Kantor Kecamatan Simpangkatis — kunjungi, telepon, atau kirim pesan.",
  },
  contactAddress: { en: "Address", id: "Alamat" },
  contactPhone: { en: "Phone", id: "Telepon" },
  contactEmail: { en: "Email", id: "Email" },
  contactFacebook: { en: "Facebook", id: "Facebook" },
  contactTwitter: { en: "Twitter / X", id: "Twitter / X" },
  contactInstagram: { en: "Instagram", id: "Instagram" },
};

export function t(key: string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
