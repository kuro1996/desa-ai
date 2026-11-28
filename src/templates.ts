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
      { key: "tembusan", labelId: "Tembusan (opsional)", labelEn: "Cc (optional)", placeholder: "cth: Bupati Bangka Tengah, satu per baris", type: "textarea" },
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
      { key: "agenda", labelId: "Agenda / isi pokok (opsional)", labelEn: "Agenda / main points (optional)", placeholder: "cth: 1. Pemilihan kepala desa serentak; 2. Forum Konsultasi Publik (FKP) 2026", type: "textarea" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Ketua RT 01 s.d. RT 05" },
      { key: "tembusan", labelId: "Tembusan (opsional)", labelEn: "Cc (optional)", placeholder: "cth: Camat Simpangkatis, satu per baris", type: "textarea" },
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
    id: "sktm",
    nameId: "Surat Keterangan Tidak Mampu (SKTM)",
    nameEn: "Certificate of Low Income (SKTM)",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/55/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal", labelEn: "Date", placeholder: "cth: 21 November 2026" },
      { key: "nama", labelId: "Nama pemohon", labelEn: "Applicant name", placeholder: "cth: Budi Santoso" },
      { key: "nik", labelId: "NIK", labelEn: "National ID (NIK)", placeholder: "cth: 1901010101010001" },
      { key: "alamat", labelId: "Alamat", labelEn: "Address", placeholder: "cth: Dusun Katis RT 02 RW 01, Desa Katis" },
      { key: "pekerjaan", labelId: "Pekerjaan", labelEn: "Occupation", placeholder: "cth: Buruh harian lepas" },
      { key: "penghasilan", labelId: "Penghasilan per bulan", labelEn: "Monthly income", placeholder: "cth: Rp800.000" },
      { key: "keperluan", labelId: "Keperluan", labelEn: "Purpose", placeholder: "cth: Keringanan biaya pendidikan anak" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal, judul SURAT KETERANGAN TIDAK MAMPU, isi yang menerangkan identitas pemohon (nama, NIK, alamat, pekerjaan, penghasilan per bulan) dan menyatakan bahwa yang bersangkutan benar-benar termasuk keluarga tidak mampu, keperluan surat, penutup, tanda tangan Kepala Desa beserta nama dan NIP (tulis [NAMA] dan [NIP] bila tidak diberikan).",
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
  // Paket 34 (Ide 9) — Mode Darurat: surat cepat untuk keadaan darurat
  // (bencana), satu ketuk jadi. Petugas melengkapi detail (lokasi, waktu,
  // korban/kerusakan) lalu generate seperti biasa. Template lama tidak diubah.
  {
    id: "darurat-laporan",
    nameId: "Surat Laporan Kejadian Darurat",
    nameEn: "Emergency Incident Report",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/60/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal surat", labelEn: "Letter date", placeholder: "cth: 28 November 2026" },
      { key: "jenisBencana", labelId: "Jenis bencana", labelEn: "Disaster type", placeholder: "cth: Banjir" },
      { key: "lokasi", labelId: "Lokasi kejadian", labelEn: "Incident location", placeholder: "cth: Dusun Katis RT 02 RW 01, Desa Simpangkatis" },
      { key: "tanggalKejadian", labelId: "Tanggal/waktu kejadian", labelEn: "Incident date/time", placeholder: "cth: 28 November 2026 pukul 03.00 WIB" },
      { key: "korban", labelId: "Korban", labelEn: "Victims", placeholder: "cth: 12 kepala keluarga mengungsi; tidak ada korban jiwa" },
      { key: "kerusakan", labelId: "Kerusakan", labelEn: "Damage", placeholder: "cth: 8 rumah terendam; 1 jembatan rusak" },
      { key: "kebutuhan", labelId: "Kebutuhan mendesak", labelEn: "Urgent needs", placeholder: "cth: Perahu karet, makanan siap saji, selimut", type: "textarea" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Camat Simpangkatis" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal/perihal Laporan Kejadian Darurat, alamat tujuan, salam pembuka, isi laporan (jenis bencana, lokasi dan waktu kejadian, korban, kerusakan, kebutuhan mendesak), penutup, tanda tangan Kepala Desa.",
  },
  {
    id: "darurat-bantuan",
    nameId: "Surat Permohonan Bantuan Darurat",
    nameEn: "Emergency Aid Request",
    fields: [
      { key: "nomor", labelId: "Nomor surat", labelEn: "Letter number", placeholder: "cth: 140/61/DS/XI/2026" },
      { key: "tanggal", labelId: "Tanggal surat", labelEn: "Letter date", placeholder: "cth: 28 November 2026" },
      { key: "jenisBencana", labelId: "Jenis bencana", labelEn: "Disaster type", placeholder: "cth: Banjir" },
      { key: "lokasi", labelId: "Lokasi kejadian", labelEn: "Incident location", placeholder: "cth: Dusun Katis RT 02 RW 01, Desa Simpangkatis" },
      { key: "tanggalKejadian", labelId: "Tanggal/waktu kejadian", labelEn: "Incident date/time", placeholder: "cth: 28 November 2026 pukul 03.00 WIB" },
      { key: "korban", labelId: "Korban", labelEn: "Victims", placeholder: "cth: 12 kepala keluarga mengungsi; tidak ada korban jiwa" },
      { key: "kerusakan", labelId: "Kerusakan", labelEn: "Damage", placeholder: "cth: 8 rumah terendam; 1 jembatan rusak" },
      { key: "bantuan", labelId: "Bantuan yang dimohon", labelEn: "Aid requested", placeholder: "cth: Sembako, air bersih, tenda pengungsian, obat-obatan", type: "textarea" },
      { key: "tujuan", labelId: "Ditujukan kepada", labelEn: "Addressed to", placeholder: "cth: Bupati Bangka Tengah melalui Camat Simpangkatis" },
    ],
    structureId:
      "Kop surat desa, nomor/tanggal/perihal Permohonan Bantuan Darurat, alamat tujuan, salam pembuka, isi permohonan (jenis bencana, lokasi dan waktu kejadian, korban, kerusakan, bantuan yang dimohon), penutup, tanda tangan Kepala Desa.",
  },
];

/** Build the prompt sent to the model for a letter draft. */
export function buildLetterPrompt(
  tpl: LetterTemplate,
  values: Record<string, string>,
  extra: string,
): string {
  const lines = Object.entries(values)
    // Paket 29 — Tembusan dirender aplikasi dari kolomnya sendiri, bukan
    // ditulis AI di tubuh surat.
    .filter(([k, v]) => k !== "tembusan" && v.trim().length > 0)
    .map(([k, v]) => {
      const field = tpl.fields.find((f) => f.key === k);
      return `- ${field ? field.labelId : k}: ${v.trim()}`;
    });
  return [
    `Tulis draf ${tpl.nameId} resmi pemerintah desa dalam Bahasa Indonesia formal.`,
    `Struktur yang harus diikuti: ${tpl.structureId}`,
    // Paket 29 — aplikasi sudah menampilkan kop, nomor/tanggal/perihal,
    // alamat tujuan, dan tanda tangan dari formulir; AI hanya menulis
    // tubuh surat supaya tidak tercetak dua kali di lembar hasil.
    "Tulis HANYA tubuh surat (salam pembuka, isi, dan penutup). JANGAN menulis kop surat, nomor, tanggal, perihal, alamat tujuan, Tembusan, atau tanda tangan.",
    "Data yang diberikan:",
    ...lines,
    extra.trim()
      ? `Instruksi tambahan dari pengguna: ${extra.trim()}`
      : "Instruksi tambahan: tidak ada.",
    "Aturan: jangan mengarang nama, nomor, tanggal, atau NIP yang tidak diberikan — tulis [NAMA], [NOMOR], atau [TANGGAL] bila datanya kosong. Keluarkan hanya isi surat, tanpa penjelasan tambahan.",
  ].join("\n");
}

/** Paket 30 — draf offline (tanpa AI): tubuh surat resmi dari kolom formulir.
 * Dipakai saat panggilan AI gagal (mis. AI Logic / App Check belum aktif di
 * proyek Firebase), supaya "Buat draf" tetap menghasilkan isi dan lembar
 * surat tampil. Hanya memakai data yang diisi — tidak mengarang nama,
 * nomor, tanggal, atau NIP. Kop, meta, dan tanda tangan dirender aplikasi
 * dari formulir/pengaturan kop, jadi tubuh ini hanya salam + isi + penutup. */
export function buildOfflineLetterBody(
  tpl: LetterTemplate,
  values: Record<string, string>,
  extra: string,
): string {
  const v = (k: string): string => (values[k] ?? "").trim();
  const paras: string[] = ["Dengan hormat,"];
  if (tpl.id === "undangan") {
    const acara = v("acara") || "acara yang dimaksud";
    const when: string[] = [];
    if (v("hari")) when.push(`pada ${v("hari")}`);
    if (v("waktu")) when.push(`pukul ${v("waktu")}`);
    if (v("tempat")) when.push(`bertempat di ${v("tempat")}`);
    const tujuan = v("tujuan") || "Bapak/Ibu/Saudara/i";
    paras.push(
      `Sehubungan dengan pelaksanaan ${acara}, dengan ini kami mengundang ${tujuan} untuk hadir${when.length ? ` ${when.join(" ")}` : " pada waktu dan tempat yang telah ditentukan"}.`,
    );
    if (v("agenda")) paras.push(`Adapun agenda yang akan dibahas sebagai berikut:\n${v("agenda")}`);
    if (extra.trim()) paras.push(extra.trim());
    paras.push(
      "Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami ucapkan terima kasih.",
    );
    return paras.join("\n\n");
  }
  // Paket 34 (Ide 9) — Mode Darurat: tubuh surat laporan / permohonan
  // bantuan darurat dari kolom formulir. Hanya memakai data yang diisi.
  if (tpl.id === "darurat-laporan" || tpl.id === "darurat-bantuan") {
    const jenis = v("jenisBencana") || "kejadian darurat";
    const kapan: string[] = [];
    if (v("tanggalKejadian")) kapan.push(`pada ${v("tanggalKejadian")}`);
    if (v("lokasi")) kapan.push(`di ${v("lokasi")}`);
    const tujuan = v("tujuan") || "Bapak/Ibu yang terhormat";
    if (tpl.id === "darurat-laporan") {
      paras.push(
        `Dengan ini kami melaporkan bahwa telah terjadi ${jenis}${kapan.length ? ` ${kapan.join(" ")}` : ""}.`,
      );
      if (v("korban")) paras.push(`Korban: ${v("korban")}.`);
      if (v("kerusakan")) paras.push(`Kerusakan: ${v("kerusakan")}.`);
      if (v("kebutuhan")) paras.push(`Kebutuhan mendesak: ${v("kebutuhan")}.`);
      paras.push(
        "Demikian laporan ini kami sampaikan. Atas perhatian dan bantuan Bapak/Ibu, kami ucapkan terima kasih.",
      );
    } else {
      paras.push(
        `Sehubungan dengan terjadinya ${jenis}${kapan.length ? ` ${kapan.join(" ")}` : ""}, dengan ini kami memohon bantuan darurat kepada ${tujuan}.`,
      );
      if (v("korban")) paras.push(`Korban: ${v("korban")}.`);
      if (v("kerusakan")) paras.push(`Kerusakan: ${v("kerusakan")}.`);
      if (v("bantuan")) paras.push(`Adapun bantuan yang kami mohon sebagai berikut: ${v("bantuan")}.`);
      paras.push(
        "Demikian permohonan ini kami sampaikan. Atas perhatian dan bantuan Bapak/Ibu, kami ucapkan terima kasih.",
      );
    }
    if (extra.trim()) paras.push(extra.trim());
    return paras.join("\n\n");
  }
  const subject = v("perihal") || v("tentang") || "";
  if (subject) paras.push(`Sehubungan dengan ${subject}, melalui surat ini kami sampaikan hal-hal sebagai berikut:`);
  const isi = v("isi") || v("keperluan") || v("dasar") || "";
  if (isi) paras.push(isi);
  if (tpl.id === "pengantar" && v("nama")) {
    paras.push(
      `Dengan ini kami menerangkan bahwa ${v("nama")} bermaksud ${v("keperluan") || "mengurus keperluan sebagaimana dimaksud"}${v("tujuan") ? ` kepada ${v("tujuan")}` : ""}.`,
    );
  }
  if ((tpl.id === "keterangan" || tpl.id === "sktm") && v("nama")) {
    const detail: string[] = [];
    if (v("nik")) detail.push(`NIK ${v("nik")}`);
    if (v("alamat")) detail.push(`beralamat di ${v("alamat")}`);
    if (v("pekerjaan")) detail.push(`pekerjaan ${v("pekerjaan")}`);
    if (v("penghasilan")) detail.push(`penghasilan Rp${v("penghasilan").replace(/^Rp/i, "")} per bulan`);
    paras.push(
      `Dengan ini kami menerangkan bahwa ${v("nama")}${detail.length ? `, ${detail.join(", ")}` : ""}, adalah benar ${tpl.id === "sktm" ? "termasuk keluarga tidak mampu" : "warga sebagaimana dimaksud"}${v("keperluan") ? ` untuk keperluan ${v("keperluan")}` : ""}.`,
    );
  }
  if (tpl.id === "sk-pengangkatan" && v("nama")) {
    paras.push(
      `Dengan ini kami mengangkat ${v("nama")}${v("jabatan") ? ` sebagai ${v("jabatan")}` : ""}${v("desa") ? ` di Desa ${v("desa")}` : ""}${v("masaMulai") || v("masaSelesai") ? `, dengan masa bhakti ${v("masaMulai") || "—"} sampai ${v("masaSelesai") || "—"}` : ""}.`,
    );
  }
  if (extra.trim()) paras.push(extra.trim());
  paras.push("Demikian surat ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.");
  return paras.join("\n\n");
}
