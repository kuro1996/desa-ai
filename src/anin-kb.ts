// DesaAI — Anin knowledge base (Paket 32): how to use EVERY feature of
// this app + troubleshooting. Bundled with the app, so Anin can answer
// fully offline. Each entry points at an i18n answer key (all user-facing
// strings live in i18n.ts); the procedure guide itself (KTP, KK, SKTM…)
// stays in kb.ts and is used by Tanya Prosedur.
// NOTE: the "Export Word" entry is deliberately honest — the button
// downloads CSV today, not .docx (known gap, Paket 28/30).

export interface AninKbEntry {
  id: string;
  titleId: string;
  titleEn: string;
  keywords: string[];
  /** i18n key whose id/en text is the answer. */
  answerKey: string;
}

export const ANIN_KB: AninKbEntry[] = [
  {
    id: "surat",
    titleId: "Membuat draf surat",
    titleEn: "Drafting a letter",
    keywords: ["cara buat surat", "cara membuat surat", "cara menulis surat", "cara bikin surat", "draf surat", "membuat surat", "tulis surat", "buat surat"],
    answerKey: "aninFaqSurat",
  },
  {
    id: "surat-cepat",
    titleId: "Surat Cepat",
    titleEn: "Surat Cepat (quick letter)",
    keywords: ["surat cepat", "satu kalimat", "isi formulir otomatis"],
    answerKey: "aninFaqCepat",
  },
  {
    id: "simpan-draf",
    titleId: "Menyimpan draf",
    titleEn: "Saving a draft",
    keywords: ["simpan draf", "menyimpan draf", "draf disimpan", "di mana draf", "dimana draf", "save draft"],
    answerKey: "aninFaqSimpan",
  },
  {
    id: "cetak",
    titleId: "Mencetak surat",
    titleEn: "Printing a letter",
    keywords: ["cetak", "print", "mencetak", "cetak surat", "save as pdf", "simpan pdf"],
    answerKey: "aninFaqCetak",
  },
  {
    id: "kirim-wa",
    titleId: "Kirim surat ke WhatsApp",
    titleEn: "Sending a letter via WhatsApp",
    keywords: ["kirim whatsapp", "kirim ke whatsapp", "kirim wa", "whatsapp", "wa", "bagikan surat", "share surat", "kirim surat"],
    answerKey: "aninFaqWa",
  },
  {
    id: "export-word",
    titleId: "Export Word",
    titleEn: "Export Word",
    keywords: ["export word", "ekspor word", "word", "unduh docx", "download docx"],
    answerKey: "aninFaqWord",
  },
  {
    id: "ikm",
    titleId: "Survei IKM",
    titleEn: "IKM satisfaction survey",
    keywords: ["ikm", "survei kepuasan", "kepuasan warga", "kepuasan pelayanan", "cara isi ikm", "isi survei"],
    answerKey: "aninFaqIkm",
  },
  {
    id: "pengaduan",
    titleId: "Membuat pengaduan",
    titleEn: "Filing a complaint",
    keywords: ["cara pengaduan", "cara aduan", "buat pengaduan", "lapor pengaduan", "lapor aduan", "mengadu", "pengaduan baru"],
    answerKey: "aninFaqAduan",
  },
  // Paket 32.1 — pertanyaan "Kalau ada pengaduan bisa selesaikan" (dan
  // variannya) sebelumnya tidak cocok dengan entri apa pun dan dijawab
  // "belum paham". Entri ini menjawab alur PENYELESAIAN pengaduan.
  {
    id: "pengaduan-selesai",
    titleId: "Menyelesaikan pengaduan",
    titleEn: "Resolving a complaint",
    keywords: ["selesaikan pengaduan", "menyelesaikan pengaduan", "pengaduan selesai", "pengaduan bisa", "status pengaduan", "lacak pengaduan", "pengaduan saya", "pengaduan gimana", "ada pengaduan", "cara menyelesaikan pengaduan", "pengaduan ditindaklanjuti", "tindak lanjut pengaduan", "laporan pengaduan"],
    answerKey: "aninFaqAduanSelesai",
  },
  {
    id: "mode-warga",
    titleId: "Mode Warga",
    titleEn: "Citizen mode",
    keywords: ["mode warga", "untuk warga", "warga bisa", "tanpa login"],
    answerKey: "aninFaqWarga",
  },
  {
    id: "offline",
    titleId: "Offline & keamanan data",
    titleEn: "Offline use & data safety",
    keywords: ["offline", "data aman", "aman data", "privasi", "data disimpan", "tanpa internet"],
    answerKey: "aninFaqOffline",
  },
  {
    id: "agenda",
    titleId: "Buku Agenda",
    titleEn: "Mail Register",
    keywords: ["agenda", "buku agenda", "cari surat", "arsip surat", "surat masuk", "surat keluar"],
    answerKey: "aninFaqAgenda",
  },
  {
    id: "sk",
    titleId: "SK Pengangkatan",
    titleEn: "Appointment decree (SK)",
    keywords: ["sk pengangkatan", "cara sk", "buat sk", "surat keputusan pengangkatan"],
    answerKey: "aninFaqSk",
  },
  {
    id: "ringkasan",
    titleId: "Meringkas teks",
    titleEn: "Summarizing text",
    keywords: ["ringkas", "rangkum", "summarize", "meringkas", "ringkasan", "teks panjang"],
    answerKey: "aninFaqRingkasan",
  },
  {
    id: "arsip",
    titleId: "Arsip & Draf",
    titleEn: "Archive & Drafts",
    keywords: ["arsip", "draf lama", "buka draf", "hapus draf", "draf tersimpan", "arsip dan draf"],
    answerKey: "aninFaqArsip",
  },
  {
    id: "kepegawaian",
    titleId: "Data Kepegawaian",
    titleEn: "Personnel Data",
    keywords: ["tambah perangkat", "perangkat desa", "masa bhakti", "data pegawai", "tambah pegawai", "kepegawaian"],
    answerKey: "aninFaqKeg",
  },
  {
    id: "kop",
    titleId: "Pengaturan kop surat",
    titleEn: "Letterhead settings",
    keywords: ["kop surat", "kepala surat", "nama camat", "ganti camat", "kop", "nip camat", "pengaturan kop"],
    answerKey: "aninFaqKop",
  },
  {
    id: "bahasa",
    titleId: "Ganti bahasa",
    titleEn: "Switching language",
    keywords: ["ganti bahasa", "bahasa indonesia", "bahasa inggris", "ubah bahasa", "switch language"],
    answerKey: "aninFaqBahasa",
  },
  {
    id: "tema",
    titleId: "Mode gelap / terang",
    titleEn: "Dark / light mode",
    keywords: ["mode gelap", "tema gelap", "mode terang", "ganti tema", "dark mode", "tema"],
    answerKey: "aninFaqTema",
  },
  {
    id: "backup",
    titleId: "Backup data",
    titleEn: "Backing up data",
    keywords: ["backup", "cadangan", "pulihkan", "unduh data", "restore backup", "salin data"],
    answerKey: "aninFaqBackup",
  },
  {
    id: "ai-gagal",
    titleId: "AI gagal / draf kosong",
    titleEn: "AI failed / empty draft",
    keywords: ["draf kosong", "ai gagal", "ai tidak jalan", "tidak bisa buat draf", "gagal membuat draf", "panggilan ai gagal", "ai error"],
    answerKey: "aninFaqAiGagal",
  },
  {
    id: "qr",
    titleId: "Kode QR survei",
    titleEn: "Survey QR code",
    keywords: ["qr", "kode qr", "bagikan survei", "tautan survei", "link survei"],
    answerKey: "aninFaqQr",
  },
  {
    id: "nomor",
    titleId: "Nomor surat otomatis",
    titleEn: "Automatic letter numbering",
    keywords: ["nomor otomatis", "nomor surat", "auto number"],
    answerKey: "aninFaqNomor",
  },
  {
    id: "suara",
    titleId: "Bicara dengan Anin",
    titleEn: "Talking to Anin",
    keywords: ["suara anin", "bicara", "mikrofon", "bacakan", "voice", "ngomong", "dengarkan"],
    answerKey: "aninFaqSuara",
  },
  // Paket 32 — KB dimaksimalkan (28 Nov 00:20): beranda, Tanya Prosedur,
  // dan Paket Adopsi Desa Lain juga tercakup, tanpa celah.
  {
    id: "beranda",
    titleId: "Beranda",
    titleEn: "Home dashboard",
    keywords: ["beranda", "dashboard", "halaman utama", "statistik cepat", "apa yang ada di beranda", "home"],
    answerKey: "aninFaqBeranda",
  },
  {
    id: "tanya-prosedur",
    titleId: "Tanya Prosedur",
    titleEn: "Ask about procedures",
    keywords: ["tanya prosedur", "tanya jawab", "cara bertanya", "bertanya prosedur", "panduan prosedur", "cara tanya prosedur"],
    answerKey: "aninFaqTanya",
  },
  {
    id: "adopsi",
    titleId: "Pakai di desa lain",
    titleEn: "Use in another village",
    keywords: ["desa lain", "pakai di desa lain", "adopsi", "desa lain pakai", "paket adopsi", "kantor desa lain"],
    answerKey: "aninFaqAdopsi",
  },
];

/** Best-matching app entry for a question, or null. Keyword scoring like kb.ts. */
export function matchAninKb(question: string): AninKbEntry | null {
  const q = question.toLowerCase();
  let best: AninKbEntry | null = null;
  let bestScore = 0;
  for (const e of ANIN_KB) {
    let score = 0;
    for (const kw of e.keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 3 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return bestScore >= 3 ? best : null;
}
