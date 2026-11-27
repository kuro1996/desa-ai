// DesaAI — built-in procedure guide for Indonesian village offices.
// This knowledge base is bundled with the app, so the guide itself works
// fully offline. AI answers are grounded in it (the matching entries are
// pasted into the prompt and listed as sources).
// NOTE: requirements change by region and over time — always confirm with
// the local office (Disdukcapil / kecamatan) before acting.

export interface KbEntry {
  id: string;
  titleId: string;
  titleEn: string;
  keywords: string[];
  syaratId: string[];
  langkahId: string[];
  catatanId: string;
}

export const KB: KbEntry[] = [
  {
    id: "ktp",
    titleId: "KTP Elektronik",
    titleEn: "Electronic ID Card (e-KTP)",
    keywords: ["ktp", "e-ktp", "ektp", "identitas", "identity", "id card", "17 tahun"],
    syaratId: [
      "Berusia 17 tahun atau sudah/pernah kawin",
      "Fotokopi Kartu Keluarga (KK)",
      "Surat pengantar dari RT/RW dan desa/kelurahan",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW, lalu ke desa/kelurahan",
      "Datang ke Kecamatan atau Disdukcapil dengan KK asli + fotokopi",
      "Rekam foto, iris mata, tanda tangan, dan sidik jari",
      "KTP diterbitkan (umumnya 1–14 hari kerja, tergantung daerah)",
    ],
    catatanId: "KTP elektronik berlaku seumur hidup selama tidak ada perubahan data.",
  },
  {
    id: "kk",
    titleId: "Kartu Keluarga (KK)",
    titleEn: "Family Card (KK)",
    keywords: ["kk", "kartu keluarga", "family card", "keluarga"],
    syaratId: [
      "Surat pengantar RT/RW",
      "KK lama (untuk perubahan/pembaruan) atau surat nikah/akta kelahiran (KK baru)",
      "KTP anggota keluarga yang sudah dewasa",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW",
      "Isi formulir permohonan KK di desa/kelurahan",
      "Serahkan ke Kecamatan/Disdukcapil untuk diterbitkan",
    ],
    catatanId: "KK baru wajib dibuat setelah menikah, pindah, atau ada kelahiran/kematian.",
  },
  {
    id: "domisili",
    titleId: "Surat Keterangan Domisili",
    titleEn: "Domicile Certificate",
    keywords: ["domisili", "domicile", "tempat tinggal", "tinggal", "alamat"],
    syaratId: [
      "KTP pemohon",
      "Kartu Keluarga (KK)",
      "Surat pengantar RT/RW",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW",
      "Ajukan ke desa/kelurahan dengan KTP + KK",
      "Surat diterbitkan dan ditandatangani kepala desa/lurah",
    ],
    catatanId: "Masa berlaku umumnya 6 bulan, dapat diperpanjang.",
  },
  {
    id: "sktm",
    titleId: "SKTM — Surat Keterangan Tidak Mampu",
    titleEn: "Certificate of Financial Hardship (SKTM)",
    keywords: ["sktm", "tidak mampu", "miskin", "poor", "bantuan", "beasiswa", "keringanan"],
    syaratId: [
      "KTP dan KK pemohon",
      "Surat pengantar RT/RW",
      "Surat pernyataan tidak mampu (bermeterai, bila diminta)",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW",
      "Ajukan ke desa/kelurahan dengan KTP + KK",
      "Petugas melakukan verifikasi/pengecekan lapangan bila diperlukan",
      "SKTM diterbitkan dan ditandatangani kepala desa/lurah",
    ],
    catatanId: "SKTM umumnya dipakai untuk keringanan biaya sekolah, berobat, atau bantuan sosial.",
  },
  {
    id: "akta-lahir",
    titleId: "Akta Kelahiran",
    titleEn: "Birth Certificate",
    keywords: ["akta kelahiran", "lahir", "birth", "bayi", "anak"],
    syaratId: [
      "Surat keterangan lahir dari bidan/RS/puskesmas",
      "KK dan KTP orang tua",
      "Buku nikah/akta perkawinan orang tua",
      "2 orang saksi (KTP saksi)",
    ],
    langkahId: [
      "Laporkan kelahiran ke RT/RW dan desa/kelurahan",
      "Isi formulir permohonan akta kelahiran",
      "Serahkan berkas ke Disdukcapil (melalui kecamatan/desa)",
      "Akta diterbitkan — laporkan maksimal 60 hari setelah kelahiran",
    ],
    catatanId: "Pelaporan lebih dari 60 hari memerlukan penetapan pengadilan.",
  },
  {
    id: "akta-mati",
    titleId: "Akta Kematian",
    titleEn: "Death Certificate",
    keywords: ["akta kematian", "meninggal", "kematian", "death", "wafat"],
    syaratId: [
      "Surat keterangan kematian dari RS/desa",
      "KK dan KTP almarhum/almarhumah",
      "KTP pelapor dan 2 orang saksi",
    ],
    langkahId: [
      "Laporkan kematian ke RT/RW dan desa/kelurahan",
      "Isi formulir permohonan akta kematian",
      "Serahkan berkas ke Disdukcapil",
    ],
    catatanId: "Laporkan maksimal 30 hari setelah kematian.",
  },
  {
    id: "pindah",
    titleId: "Surat Keterangan Pindah (Domisili)",
    titleEn: "Moving / Relocation Certificate",
    keywords: ["pindah", "pindah domisili", "pindah alamat", "moving", "relocation", "mutasi"],
    syaratId: [
      "KK asli dan KTP",
      "Surat pengantar RT/RW daerah asal",
      "Alamat tujuan yang jelas",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW daerah asal",
      "Urus SKP di desa/kelurahan asal, lalu ke Kecamatan/Disdukcapil",
      "Terbitkan SKPWN/SKPD dan KK baru di daerah tujuan",
      "Lapor ke RT/RW dan desa/kelurahan tujuan maksimal 14 hari setelah tiba",
    ],
    catatanId: "Pindah antar kabupaten/kota memerlukan SKP dari Disdukcapil daerah asal.",
  },
  {
    id: "sku",
    titleId: "SKU — Surat Keterangan Usaha",
    titleEn: "Business Certificate (SKU)",
    keywords: ["sku", "usaha", "business", "warung", "toko", "dagang", "umkm"],
    syaratId: [
      "KTP dan KK pemohon",
      "Surat pengantar RT/RW",
      "Foto tempat usaha (bila diminta)",
    ],
    langkahId: [
      "Minta surat pengantar RT/RW",
      "Ajukan ke desa/kelurahan dengan KTP + KK",
      "Petugas dapat melakukan pengecekan lokasi usaha",
      "SKU diterbitkan — umumnya berlaku 6 bulan",
    ],
    catatanId: "SKU dipakai untuk pengajuan KUR, bantuan UMKM, atau izin usaha mikro.",
  },
  {
    id: "perangkat-desa",
    titleId: "Perangkat Desa & Masa Bhakti",
    titleEn: "Village Officers & Term of Office",
    keywords: ["perangkat", "perangkat desa", "masa bhakti", "pengangkatan", "pemberhentian", "kepala desa", "sekdes", "sekretaris desa", "jabatan", "term"],
    syaratId: [
      "Warga Negara Indonesia",
      "Pendidikan paling rendah SMA/sederajat (sesuai peraturan yang berlaku)",
      "Berusia 20–42 tahun pada saat mendaftar (ketentuan dapat berubah — konfirmasi ke kecamatan)",
      "Memenuhi syarat administrasi lain yang ditetapkan desa/kecamatan",
    ],
    langkahId: [
      "Desa mengumumkan lowongan perangkat desa",
      "Calon menyerahkan berkas lamaran ke desa",
      "Seleksi administrasi dan ujian/penilaian oleh tim seleksi desa",
      "Kepala Desa menetapkan pengangkatan dengan SK; masa bhakti dicatat dan dipantau",
    ],
    catatanId: "Masa bhakti perangkat desa dicatat di modul Data Kepegawaian — sistem memberi notifikasi bila masa bhakti habis atau akan habis dalam 90 hari. Selalu konfirmasi syarat terbaru ke Kecamatan.",
  },
  {
    id: "sk-pengangkatan",
    titleId: "SK Pengangkatan Perangkat Desa",
    titleEn: "Village Officer Appointment Decree (SK)",
    keywords: ["sk pengangkatan", "surat keputusan", "sk", "diangkat", "pengangkatan", "appointment", "decree"],
    syaratId: [
      "Calon lolos seleksi perangkat desa",
      "Data diri lengkap: nama, NIK, jabatan, desa, masa bhakti",
      "Persetujuan/penetapan Kepala Desa",
    ],
    langkahId: [
      "Buka modul Kepegawaian, pilih perangkat, tekan \u201cBuat SK\u201d",
      "Lengkapi nomor SK, tanggal, dan dasar pertimbangan",
      "Minta AI membuat draf, lalu periksa isinya sebelum ditandatangani",
      "SK ditandatangani Kepala Desa dan diarsipkan",
    ],
    catatanId: "Draf AI wajib diperiksa petugas sebelum digunakan — jangan mengarang nomor SK, NIP, atau tanggal yang tidak diberikan.",
  },
];

/** Simple keyword matching — returns the best-matching entries (max 3). */
export function matchKb(question: string, limit = 3): KbEntry[] {
  const q = question.toLowerCase();
  const scored = KB.map((e) => {
    let score = 0;
    for (const kw of e.keywords) {
      if (q.includes(kw)) score += kw.length > 3 ? 2 : 1;
    }
    if (q.includes(e.titleId.toLowerCase().split(" ")[0])) score += 1;
    return { entry: e, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
  return scored;
}

/** Render one KB entry as grounding text for the AI prompt. */
export function kbEntryToText(e: KbEntry): string {
  return [
    `## ${e.titleId} (${e.titleEn})`,
    `Syarat: ${e.syaratId.join("; ")}`,
    `Langkah: ${e.langkahId.join("; ")}`,
    `Catatan: ${e.catatanId}`,
  ].join("\n");
}
