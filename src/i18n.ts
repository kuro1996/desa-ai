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
  tabSummarize: { en: "Summarize", id: "Ringkasan" },
  tabQa: { en: "Procedure Q&A", id: "Tanya Prosedur" },
  tabDrafts: { en: "My Drafts", id: "Draf Saya" },
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
  clear: { en: "Clear", id: "Bersihkan" },
  copy: { en: "Copy", id: "Salin" },
  download: { en: "Download .txt", id: "Unduh .txt" },
  saveDraft: { en: "Save draft", id: "Simpan draf" },
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
  draftsTitle: { en: "My drafts", id: "Draf saya" },
  draftsHint: {
    en: "Saved drafts sync to Firestore when Firebase is connected; otherwise they stay in this browser (localStorage).",
    id: "Draf tersimpan tersinkron ke Firestore bila Firebase terhubung; bila tidak, draf tersimpan di browser ini (localStorage).",
  },
  draftsEmpty: {
    en: "No drafts yet. Generate a letter or summary and press “Save draft”.",
    id: "Belum ada draf. Buat surat atau ringkasan lalu tekan “Simpan draf”.",
  },
  footer: {
    en: "DesaAI — built for #BuildHybridAI 2026. Hybrid inference: on-device Gemini Nano 4 when available, cloud Gemini fallback. AI drafts must be reviewed by a human officer before use.",
    id: "DesaAI — dibuat untuk #BuildHybridAI 2026. Inferensi hibrida: Gemini Nano 4 di perangkat bila tersedia, fallback cloud Gemini. Draf AI wajib diperiksa petugas sebelum digunakan.",
  },
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
  statusAiError: {
    en: "AI call failed. If this is a fresh Firebase project, run `npx -y firebase-tools@latest init ailogic` and enable App Check, then try again.",
    id: "Panggilan AI gagal. Jika ini proyek Firebase baru, jalankan `npx -y firebase-tools@latest init ailogic` dan aktifkan App Check, lalu coba lagi.",
  },
  sourcesLabel: { en: "Sources: ", id: "Sumber: " },
  kbOfflineNote: {
    en: "Answered from the offline guide (no AI call needed).",
    id: "Dijawab dari panduan offline (tanpa panggilan AI).",
  },
  open: { en: "Open", id: "Buka" },
  delete: { en: "Delete", id: "Hapus" },
  savedAt: { en: "Saved ", id: "Disimpan " },
  deviceAvailable: { en: "On-device: ready", id: "Perangkat: siap" },
  deviceDownloading: { en: "On-device: downloading…", id: "Perangkat: mengunduh…" },
  deviceDownloadable: { en: "On-device: downloadable", id: "Perangkat: dapat diunduh" },
  deviceUnavailable: { en: "On-device: unavailable", id: "Perangkat: tidak tersedia" },
  deviceUnsupported: { en: "On-device: not supported here", id: "Perangkat: tidak didukung di sini" },
  firebaseReady: { en: "Firebase: connected", id: "Firebase: terhubung" },
  firebaseDemo: { en: "Firebase: demo mode", id: "Firebase: mode demo" },
  firebaseError: { en: "Firebase: error", id: "Firebase: error" },
};

export function t(key: string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
