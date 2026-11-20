// DesaAI — official letter templates (Indonesian formal letters).
// The AI drafts the letter; these templates define the fields the clerk
// fills in and the structure the prompt asks for. Letters are always in
// formal Bahasa Indonesia — a human officer must review before use.

export interface TemplateField {
  key: string;
  labelId: string;
  labelEn: string;
  placeholder: string;
  type?: "text" | "date" | "textarea";
}

export interface LetterTemplate {
  id: string;
  nameId: string;
  nameEn: string;
  fields: TemplateField[];
  structureId: string;
}

export const TEMPLATES: LetterTemplate[] = [
  {
    id: "surat-dinas",
    nameId: "Surat Dinas",
    nameEn: "Official Letter",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/12/DS/V/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 15 November 2026" },
      { key: "perihal", labelId: "Perihal", labelEn: "Subject", placeholder: "cth: Undangan Musrenbang Desa" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Camat Simpangkatis" },
      { key: "isi", labelId: "Isi pokok", labelEn: "Main content", placeholder: "Poin-poin yang harus disampaikan…", type: "textarea" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal/perihal, alamat tujuan, salam pembuka, isi (maksud dan tujuan surat), penutup, tanda tangan Kepala Desa beserta nama dan NIP (tulis [NAMA] dan [NIP] bila tidak diberikan).",
  },
  {
    id: "sk",
    nameId: "Surat Keputusan (SK)",
    nameEn: "Decree (SK)",
    fields: [
      { key: "nomor", labelId: "Nomor SK", labelEn: "Decree number", placeholder: "cth: 188.4/05/DS/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 15 November 2026" },
      { key: "tentang", labelId: "Tentang", labelEn: "Concerning", placeholder: "cth: Pembentukan Panitia Musrenbang Desa" },
      { key: "isi", labelId: "Isi pokok keputusan", labelEn: "Main decision points", placeholder: "Siapa diangkat, tugas, masa berlaku…", type: "textarea" },
    ],
    structureId:
      "Kop surat, judul SURAT KEPUTUSAN KEPALA DESA, nomor dan tentang, Menimbang, Mengingat, Memutuskan (KESATU, KEDUA, KETIGA…), tempat/tanggal penetapan, tanda tangan Kepala Desa.",
  },
  {
    id: "undangan",
    nameId: "Surat Undangan",
    nameEn: "Invitation Letter",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/20/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 15 November 2026" },
      { key: "acara", labelId: "Acara", labelEn: "Event", placeholder: "cth: Musyawarah Desa (Musdes)" },
      { key: "hari", labelId: "Hari/tanggal acara", labelEn: "Event day/date", placeholder: "cth: Jumat, 20 November 2026" },
      { key: "waktu", labelId: "Waktu", labelEn: "Time", placeholder: "cth: 09.00 WIB" },
      { key: "tempat", labelId: "Tempat", labelEn: "Venue", placeholder: "cth: Balai Desa Simpangkatis" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Ketua RT 01 s.d. RT 05" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal, perihal Undangan, alamat tujuan, salam pembuka, isi undangan (acara, hari/tanggal, waktu, tempat, agenda), penutup, tanda tangan Kepala Desa.",
  },
  {
    id: "pengantar",
    nameId: "Surat Pengantar",
    nameEn: "Cover / Referral Letter",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/31/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 15 November 2026" },
      { key: "nama", labelId: "Nama pemohon", labelEn: "Applicant name", placeholder: "cth: Budi Santoso" },
      { key: "keperluan", labelId: "Keperluan", labelEn: "Purpose", placeholder: "cth: Pengurusan KTP Elektronik" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Camat Simpangkatis" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal/perihal, alamat tujuan, isi pengantar (menerangkan nama pemohon, NIK bila diberikan, dan keperluan), penutup, tanda tangan Kepala Desa.",
  },
  {
    id: "keterangan",
    nameId: "Surat Keterangan",
    nameEn: "Certificate Letter",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/44/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 15 November 2026" },
      { key: "nama", labelId: "Nama", labelEn: "Name", placeholder: "cth: Siti Aminah" },
      { key: "jenis", labelId: "Jenis keterangan", labelEn: "Certificate type", placeholder: "cth: Domisili / Tidak Mampu / Usaha" },
      { key: "isi", labelId: "Keterangan tambahan", labelEn: "Additional details", placeholder: "Alamat, pekerjaan, atau keterangan lain…", type: "textarea" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal, judul SURAT KETERANGAN, isi yang menerangkan identitas dan hal yang diterangkan, penutup, tanda tangan Kepala Desa beserta nama dan NIP (tulis [NAMA] dan [NIP] bila tidak diberikan).",
  },
  {
    id: "sk-pengangkatan",
    nameId: "SK Pengangkatan Perangkat Desa",
    nameEn: "Village Officer Appointment Decree (SK)",
    fields: [
      { key: "nomor", labelId: "Nomor SK", labelEn: "Decree number", placeholder: "cth: 188.4/12/DS/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 20 November 2026" },
      { key: "nama", labelId: "Nama perangkat", labelEn: "Officer name", placeholder: "cth: Ahmad Fauzi" },
      { key: "nik", labelId: "NIK", labelEn: "National ID (NIK)", placeholder: "cth: 1901010101010001" },
      { key: "jabatan", labelId: "Jabatan", labelEn: "Position", placeholder: "cth: Kepala Desa" },
      { key: "desa", labelId: "Desa", labelEn: "Village", placeholder: "cth: Simpangkatis" },
      { key: "masaMulai", labelId: "Masa bhakti mulai", labelEn: "Term start", placeholder: "cth: 1 Januari 2021" },
      { key: "masaSelesai", labelId: "Masa bhakti selesai", labelEn: "Term end", placeholder: "cth: 31 Desember 2027" },
      { key: "dasar", labelId: "Dasar pertimbangan", labelEn: "Basis / considerations", placeholder: "cth: Hasil musyawarah desa dan rekomendasi Camat…", type: "textarea" },
    ],
    structureId:
      "Kop surat, judul SURAT KEPUTUSAN KEPALA DESA, nomor dan tentang Pengangkatan Perangkat Desa, Menimbang, Mengingat (UU Desa dan peraturan turunannya), Memutuskan: KESATU mengangkat nama, NIK, jabatan, dan desa yang bersangkutan; KEDUA masa bhakti mulai sampai selesai; KETIGA tugas dan kewajiban; KEEMPAT keputusan berlaku sejak tanggal ditetapkan; tempat/tanggal penetapan, tanda tangan Kepala Desa.",
  },
];

/** Build the prompt sent to the model for a letter draft. */
export function buildLetterPrompt(
  tpl: LetterTemplate,
  values: Record<string, string>,
  extra: string,
): string {
  const lines = Object.entries(values)
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => {
      const field = tpl.fields.find((f) => f.key === k);
      return `- ${field ? field.labelId : k}: ${v.trim()}`;
    });
  return [
    `Tulis draf ${tpl.nameId} resmi pemerintah desa dalam Bahasa Indonesia formal.`,
    `Struktur yang harus diikuti: ${tpl.structureId}`,
    "Data yang diberikan:",
    ...lines,
    extra.trim()
      ? `Instruksi tambahan dari pengguna: ${extra.trim()}`
      : "Instruksi tambahan: tidak ada.",
    "Aturan: jangan mengarang nama, nomor, tanggal, atau NIP yang tidak diberikan — tulis [NAMA], [NOMOR], atau [TANGGAL] bila datanya kosong. Keluarkan hanya isi surat, tanpa penjelasan tambahan.",
  ].join("\n");
}
