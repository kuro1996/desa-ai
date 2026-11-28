// DesaAI — Surat Cepat (Paket 27): one-sentence letter request → template +
// prefilled form fields. 100% offline and rule-based (no AI call): keyword
// scoring picks the letter template, small regexes extract dates, times,
// places and recipients. The officer ALWAYS reviews the filled form before
// generating the draft — the parser never invents a name, number, or date:
// a field stays empty when the sentence does not state it clearly.
import { TEMPLATES } from "./templates";

export interface CepatResult {
  templateId: string;
  fields: Record<string, string>;
  filled: string[];
}

const MONTHS_ID = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];
const MONTHS_SHORT: Record<string, string> = {
  jan: "januari",
  feb: "februari",
  mar: "maret",
  apr: "april",
  mei: "mei",
  jun: "juni",
  jul: "juli",
  agu: "agustus",
  sep: "september",
  okt: "oktober",
  nov: "november",
  des: "desember",
};
const DAYS_ID = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
const SMALL_WORDS = new Set([
  "di",
  "ke",
  "dari",
  "dan",
  "atau",
  "sampai",
  "s.d.",
  "yang",
  "untuk",
  "dengan",
  "pada",
]);

/** "ketua rt 01" → "Ketua RT 01"; small words stay lowercase mid-phrase. */
export function cepatTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (lw === "rt" || lw === "rw") return lw.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");
}

/** "keringanan biaya pendidikan anak" → "Keringanan biaya pendidikan anak". */
export function cepatSentenceCase(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function formatCepatDate(day: string, month: string, year: string): string {
  const m = MONTHS_ID.includes(month.toLowerCase())
    ? month.toLowerCase()
    : (MONTHS_SHORT[month.toLowerCase().slice(0, 3)] ?? month.toLowerCase());
  return `${Number(day)} ${m.charAt(0).toUpperCase() + m.slice(1)} ${year}`;
}

/** All dates in the sentence, in order, as "20 November 2026". */
export function findCepatDates(text: string): string[] {
  const out: string[] = [];
  const monthAlt = [...MONTHS_ID, ...Object.keys(MONTHS_SHORT)].join("|");
  const re1 = new RegExp(`(\\d{1,2})\\s+(${monthAlt})\\s+(\\d{4})`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text)) !== null) out.push(formatCepatDate(m[1], m[2], m[3]));
  const re2 = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g;
  while ((m = re2.exec(text)) !== null) {
    const monthName = MONTHS_ID[Number(m[2]) - 1];
    if (monthName)
      out.push(`${Number(m[1])} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${m[3]}`);
  }
  return out;
}

export function findCepatDay(text: string): string {
  const m = text.match(new RegExp(`\\b(${DAYS_ID.join("|")})\\b`, "i"));
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : "";
}

/** "jam 09.00 WIB" / "pukul 9" / "09.00 WIB" → "09.00 WIB". */
export function findCepatTime(text: string): string {
  const m =
    text.match(/(?:jam|pukul)\s+(\d{1,2})(?:[.:](\d{2}))?\s*(wib|wita|wit)?/i) ??
    text.match(/(\d{1,2})[.:](\d{2})\s*(wib|wita|wit)/i);
  if (!m) return "";
  const hh = String(Number(m[1])).padStart(2, "0");
  const mm = m[2] ?? "00";
  const zone = (m[3] ?? "WIB").toUpperCase();
  return `${hh}.${mm} ${zone}`;
}

/** "di Balai Desa Simpangkatis untuk ..." → "Balai Desa Simpangkatis". */
export function findCepatPlace(text: string): string {
  const m = text.match(
    /\bdi\s+([A-Z][^,.;]{1,60}?)(?=\s*(untuk|kepada|pada\s|jam|pukul|hari|tanggal|,|;|\.|$))/,
  );
  if (m) return cepatTitleCase(m[1].trim());
  const nouns = ["balai desa", "aula", "kantor", "gedung", "masjid", "lapangan", "balai"];
  const m2 = text.match(
    new RegExp(
      `\\bdi\\s+((?:${nouns.join("|")})\\s+[^,.;]{1,40}?)(?=\\s*(untuk|kepada|pada\\s|jam|pukul|hari|tanggal|,|;|\\.|$))`,
      "i",
    ),
  );
  return m2 ? cepatTitleCase(m2[1].trim()) : "";
}

/** Text after a keyword up to a comma, period, or sentence end. */
function afterKeyword(text: string, pattern: RegExp): string {
  const m = text.match(pattern);
  if (!m || m[1] === undefined) return "";
  return m[1].trim().replace(/[.,;]+$/, "").trim();
}

/** "atas nama Ahmad Fauzi," / "nama Ahmad Fauzi" / "untuk Budi Santoso,". */
export function findPersonName(text: string): string {
  const m =
    text.match(/atas nama\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/) ??
    text.match(/\bnama\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/) ??
    text.match(/\buntuk\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/);
  if (m) return cepatTitleCase(m[1].trim());
  const m2 =
    text.match(/atas nama\s+([a-z]+(?:\s+[a-z]+){0,2})/i) ??
    text.match(/\bnama\s+([a-z]+(?:\s+[a-z]+){0,2})/i);
  return m2 ? cepatTitleCase(m2[1].trim()) : "";
}

/** Paket 30 — salah ketik yang umum ("Musyawrah", "Musyawara") dinormalkan
 * supaya Surat Cepat tetap menebak templatnya; hanya pencocokan yang memakai
 * bentuk baku, teks asli tetap tampil apa adanya di kolom. */
const CEPAT_TYPO: Array<[RegExp, string]> = [
  [/\bmusyawrah\b/gi, "musyawarah"],
  [/\bmusyawara\b/gi, "musyawarah"],
  [/\bmusawarah\b/gi, "musyawarah"],
  [/\bmusrenbag\b/gi, "musrenbang"],
  [/\bundagan\b/gi, "undangan"],
];

export function normalizeCepatText(text: string): string {
  let out = text;
  for (const [re, fix] of CEPAT_TYPO) out = out.replace(re, fix);
  return out;
}

// Paket 34 (Ide 9) — Mode Darurat: jenis bencana + deteksi template darurat.
// Urutan aturan penting: "darurat-laporan" DIDAHULUKAN atas
// "darurat-bantuan" supaya "surat darurat banjir" (tanpa kata "bantuan")
// jatuh ke Laporan Kejadian; "bantuan"/"permohonan bantuan" yang
// eksplisit mengangkat skor darurat-bantuan di atasnya.
export const DARURAT_JENIS: Array<{ id: string; label: string; patterns: RegExp[] }> = [
  { id: "banjir", label: "Banjir", patterns: [/\bbanjir\b/i] },
  { id: "kebakaran", label: "Kebakaran", patterns: [/\bkebakaran\b/i] },
  { id: "longsor", label: "Tanah Longsor", patterns: [/\blongsor\b/i, /\btanah longsor\b/i] },
  { id: "gempa", label: "Gempa Bumi", patterns: [/\bgempa\b/i] },
];

/** Jenis bencana yang disebut di teks, atau "" bila tidak ada. */
export function findDaruratJenis(text: string): string {
  for (const d of DARURAT_JENIS) {
    if (d.patterns.some((re) => re.test(text))) return d.label;
  }
  return "";
}

/** Hasil Surat Cepat untuk satu ketuk tombol Mode Darurat: kerangka
 * terisi (jenis bencana), petugas melengkapi detail lalu generate. */
export function daruratCepatResult(
  jenisLabel: string,
  kind: "laporan" | "bantuan",
): CepatResult {
  return {
    templateId: kind === "laporan" ? "darurat-laporan" : "darurat-bantuan",
    fields: { jenisBencana: jenisLabel },
    filled: ["jenisBencana"],
  };
}

/** Perintah Anin "surat darurat banjir" (tanpa kata kerja "buat") → hasil
 * Surat Cepat darurat, atau null bila tidak ada jenis bencana yang jelas
 * (Anin tidak menebak-nebak: jatuh ke jawaban "belum paham"). */
export function parseDarurat(text: string): CepatResult | null {
  if (!text || !text.trim()) return null;
  const norm = normalizeCepatText(text);
  if (!/\bdarurat\b/i.test(norm)) return null;
  const jenis = findDaruratJenis(norm);
  if (!jenis) return null;
  const templateId = /\b(bantuan|permohonan\b)/i.test(norm) ? "darurat-bantuan" : "darurat-laporan";
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  const raw = extractCepatFields(templateId, norm);
  const fields: Record<string, string> = {};
  for (const f of tpl.fields) if (raw[f.key]) fields[f.key] = raw[f.key];
  return { templateId, fields, filled: Object.keys(fields) };
}

function findUndanganAcara(text: string): string {
  text = normalizeCepatText(text);
  const m = text.match(
    /\bundangan\s+([^,.;]{1,80}?)(?=\s*(hari|tanggal|jam|pukul|di\s|untuk|kepada|pada\s|,|;|\.|$))/i,
  );
  if (m && m[1].trim()) {
    const raw = m[1].trim();
    if (/musyawarah/i.test(raw)) return "Musyawarah Desa";
    if (/musdes/i.test(raw)) return "Musyawarah Desa";
    if (/musrenbang/i.test(raw)) return "Musrenbang Desa";
    return cepatTitleCase(raw);
  }
  if (/\bmusyawarah\b/i.test(text)) return "Musyawarah Desa";
  if (/\bmusdes\b/i.test(text)) return "Musyawarah Desa";
  if (/\bmusrenbang\b/i.test(text)) return "Musrenbang Desa";
  const s = text.match(
    /\bsosialisasi\s+([^,.;]{1,60}?)(?=\s*(hari|tanggal|jam|pukul|di\s|untuk|kepada|,|;|\.|$))/i,
  );
  return s ? cepatTitleCase(`Sosialisasi ${s[1].trim()}`) : "";
}

/** The request sentence, minus the leading verb and any "perihal …" clause. */
function cleanCepatSentence(text: string): string {
  let s = text.trim();
  s = s.replace(/^(tolong\s+)?(buatkan|buat|tuliskan|tulis)\s+/i, "");
  s = s.replace(/\s+perihal\s+[^,.;]+/i, "").replace(/\s+tentang\s+[^,.;]+/i, "");
  s = s.replace(/[.,;]+$/, "").trim();
  return cepatSentenceCase(s).slice(0, 200);
}

interface CepatRule {
  id: string;
  patterns: Array<[RegExp, number]>;
}

// Rule order is the tie-break priority (first wins on equal scores).
const CEPAT_RULES: CepatRule[] = [
  // Paket 34 (Ide 9) — Mode Darurat, didahulukan: "darurat" + jenis
  // bencana harus menang atas "surat dinas" (kata "permohonan") dan SKTM
  // (kata "bantuan"). Lihat catatan urutan di atas DARURAT_JENIS.
  {
    id: "darurat-laporan",
    patterns: [
      [/\bdarurat\b/i, 4],
      [/\blaporan kejadian\b/i, 4],
      [/\blaporan\b/i, 2],
      [/\bkejadian\b/i, 2],
      [/\bbanjir\b/i, 3],
      [/\bkebakaran\b/i, 3],
      [/\blongsor\b/i, 3],
      [/\bgempa\b/i, 3],
    ],
  },
  {
    id: "darurat-bantuan",
    patterns: [
      [/\bdarurat\b/i, 4],
      [/\bpermohonan bantuan\b/i, 4],
      [/\bbantuan darurat\b/i, 4],
      [/\bbantuan\b/i, 2],
      [/\bbanjir\b/i, 3],
      [/\bkebakaran\b/i, 3],
      [/\blongsor\b/i, 3],
      [/\bgempa\b/i, 3],
    ],
  },
  {
    id: "sktm",
    patterns: [
      [/\btidak mampu\b/i, 4],
      [/\bsktm\b/i, 4],
      [/\bkeringanan\b/i, 2],
      [/\bbiaya pendidikan\b/i, 1],
    ],
  },
  {
    id: "sk-pengangkatan",
    patterns: [[/\bpengangkatan\b/i, 4], [/\bperangkat desa\b/i, 2], [/\bdiangkat\b/i, 2]],
  },
  {
    id: "pengantar",
    patterns: [
      [/\bpengantar\b/i, 3],
      [/\bpengurusan\b/i, 2],
      [/\bmengurus\b/i, 1],
      [/\bktp\b/i, 1],
    ],
  },
  {
    id: "keterangan",
    patterns: [[/\bketerangan\b/i, 3], [/\bdomisili\b/i, 2], [/\busaha\b/i, 1]],
  },
  {
    id: "undangan",
    patterns: [
      [/\bundangan\b/i, 3],
      [/\bmusyawarah\b/i, 3],
      [/\bmusdes\b/i, 2],
      [/\bmusrenbang\b/i, 2],
      [/\brapat\b/i, 2],
      [/\bsosialisasi\b/i, 2],
      [/\bundang\b/i, 2],
      [/\bpertemuan\b/i, 1],
    ],
  },
  {
    id: "sk",
    patterns: [
      [/\bsurat keputusan\b/i, 6],
      [/\bkeputusan\b/i, 2],
      [/\bmenetapkan\b/i, 2],
      [/\bmenimbang\b/i, 2],
      [/\bkesatu\b/i, 2],
    ],
  },
  {
    id: "surat-dinas",
    patterns: [
      [/\bsurat dinas\b/i, 6],
      [/\bsurat resmi\b/i, 2],
      [/\brekomendasi\b/i, 2],
      [/\bpermohonan\b/i, 2],
      [/\bbalasan\b/i, 2],
    ],
  },
];

/** Guess the letter template from one sentence, or null when unsure. */
export function detectCepatTemplate(text: string): string | null {
  text = normalizeCepatText(text);
  let best: string | null = null;
  let bestScore = 0;
  for (const rule of CEPAT_RULES) {
    let score = 0;
    for (const [re, w] of rule.patterns) if (re.test(text)) score += w;
    if (score > bestScore) {
      bestScore = score;
      best = rule.id;
    }
  }
  return bestScore >= 3 ? best : null;
}

export function extractCepatFields(templateId: string, text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (k: string, v: string): void => {
    if (v && v.trim()) out[k] = v.trim();
  };
  const dates = findCepatDates(text);
  const day = findCepatDay(text);
  switch (templateId) {
    // Paket 34 (Ide 9) — Mode Darurat: jenis bencana + detail kejadian.
    // Kolom yang tidak disebut di kalimat tetap kosong untuk diisi petugas.
    case "darurat-laporan":
    case "darurat-bantuan": {
      set("jenisBencana", findDaruratJenis(text));
      set("lokasi", findCepatPlace(text));
      if (dates[0]) set("tanggalKejadian", dates[0]);
      set("korban", cepatSentenceCase(afterKeyword(text, /\bkorban\s+([^,.;]+)/i)));
      set("kerusakan", cepatSentenceCase(afterKeyword(text, /\bkerusakan\s+([^,.;]+)/i)));
      if (templateId === "darurat-laporan") {
        set("kebutuhan", cepatSentenceCase(afterKeyword(text, /\bkebutuhan\s+([^,.;]+)/i)));
      } else {
        set("bantuan", cepatSentenceCase(afterKeyword(text, /\bbantuan\s+([^,.;]+)/i)));
      }
      break;
    }
    case "undangan": {
      set("acara", findUndanganAcara(text));
      set("hari", day && dates[0] ? `${day}, ${dates[0]}` : day || dates[0] || "");
      set("waktu", findCepatTime(text));
      set("tempat", findCepatPlace(text));
      set("tujuan", cepatTitleCase(afterKeyword(text, /\buntuk\s+([^,.;]+)/i)));
      break;
    }
    case "sk-pengangkatan": {
      set("nama", findPersonName(text));
      set("jabatan", cepatTitleCase(afterKeyword(text, /\bjabatan\s+([^,.;]+)/i)));
      const desa = text.match(/\bDesa\s+([A-Z][A-Za-z]+)/);
      set("desa", desa ? cepatTitleCase(desa[1]) : "");
      if (dates[0]) set("masaMulai", dates[0]);
      if (dates[1]) set("masaSelesai", dates[1]);
      break;
    }
    case "sktm": {
      set("nama", findPersonName(text));
      const nik = text.match(/\b(\d{16})\b/);
      set("nik", nik ? nik[1] : "");
      set("alamat", cepatSentenceCase(afterKeyword(text, /\balamat\s+([^,.;]+)/i)));
      set("pekerjaan", cepatSentenceCase(afterKeyword(text, /\bpekerjaan\s+([^,.;]+)/i)));
      const hasil = text.match(/\brp\s?([\d.]+)/i);
      set("penghasilan", hasil ? `Rp${hasil[1]}` : "");
      set("keperluan", cepatSentenceCase(afterKeyword(text, /\bkeperluan\s+([^,.;]+)/i)));
      break;
    }
    case "pengantar": {
      set("nama", findPersonName(text));
      const perlu =
        afterKeyword(text, /\bkeperluan\s+([^,.;]+)/i) ||
        afterKeyword(text, /\buntuk mengurus\s+([^,.;]+)/i);
      set("keperluan", perlu ? cepatSentenceCase(perlu) : "");
      set("tujuan", cepatTitleCase(afterKeyword(text, /\bkepada\s+([^,.;]+)/i)));
      break;
    }
    case "keterangan": {
      set("nama", findPersonName(text));
      const jenis = /domisili/i.test(text)
        ? "Domisili"
        : /usaha/i.test(text)
          ? "Usaha"
          : afterKeyword(text, /\bjenis\s+([^,.;]+)/i);
      set("jenis", jenis);
      break;
    }
    case "sk": {
      set("tentang", cepatSentenceCase(afterKeyword(text, /\btentang\s+([^,.;]+)/i)));
      break;
    }
    case "surat-dinas": {
      const perihal =
        afterKeyword(text, /\bperihal\s+([^,.;]+)/i) ||
        afterKeyword(text, /\btentang\s+([^,.;]+)/i);
      set("perihal", perihal ? cepatSentenceCase(perihal) : "");
      set(
        "tujuan",
        cepatTitleCase(
          afterKeyword(text, /\bkepada\s+([^,.;]+)/i) ||
            afterKeyword(text, /\buntuk\s+([^,.;]+)/i),
        ),
      );
      set("isi", cleanCepatSentence(text));
      break;
    }
  }
  return out;
}

/** Parse one sentence into a template + prefilled fields (template fields only). */
export function parseCepat(text: string): CepatResult | null {
  if (!text || !text.trim()) return null;
  text = normalizeCepatText(text);
  const templateId = detectCepatTemplate(text);
  if (!templateId) return null;
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  const raw = extractCepatFields(templateId, text);
  const fields: Record<string, string> = {};
  for (const f of tpl.fields) if (raw[f.key]) fields[f.key] = raw[f.key];
  return { templateId, fields, filled: Object.keys(fields) };
}
