// DesaAI — Paket 34 Ide 2: Anin pemeriksa surat.
// Pure logic only (no DOM, no AI, no server): checks a letter draft
// against the official format with local rules — kop filled or not,
// letter-number pattern, date format, subject filled, basic EYD
// (capital at sentence start, double spaces, confidently-wrong words).
// Every issue carries its own fix; nothing is changed until the officer
// presses "Terapkan" on that item (main.ts applies the fix).
import type { LetterheadSettings } from "./letterhead";
import type { LetterTemplate } from "./templates";

export type CheckField = "kop" | "nomor" | "tanggal" | "perihal" | "tujuan" | "isi";

export interface LetterFix {
  /** Apply to a form field (e.g. fix the date). */
  field?: { key: string; value: string };
  /** Transform the letter body text. */
  body?: (text: string) => string;
}

export interface LetterIssue {
  id: string;
  field: CheckField;
  severity: "error" | "warning";
  /** i18n key in main.ts; params fill its %s / %d slots in order. */
  messageKey: string;
  params: string[];
  fix?: LetterFix;
}

export interface LetterCheckResult {
  issues: LetterIssue[];
  errors: number;
  warnings: number;
  hasDraft: boolean;
}

const MONTHS_ID =
  "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember";
const DATE_ID = new RegExp(`^\\d{1,2}\\s+(?:${MONTHS_ID})\\s+\\d{4}$`, "i");
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** "140/012/DS/XI/2026" — starts with a number, has slashes, ends in a year. */
export function isPlausibleLetterNumber(nomor: string): boolean {
  return /^\d+(?:\.\d+)?\/\S+\/\S*\/\d{4}$/.test(nomor.trim());
}

// Words Anin is SURE are written wrong (one correct form each). Only
// these are flagged — anything uncertain is left alone, never guessed.
const COMMON_MISTAKES: Array<[RegExp, string]> = [
  [/\bdimana\b/gi, "di mana"],
  [/\bdiatas\b/gi, "di atas"],
  [/\bdibawah\b/gi, "di bawah"],
  [/\bdidalam\b/gi, "di dalam"],
  [/\bdiluar\b/gi, "di luar"],
  [/\bdiantara\b/gi, "di antara"],
  [/\bdisini\b/gi, "di sini"],
  [/\bdisana\b/gi, "di sana"],
  [/\bkesana\b/gi, "ke sana"],
  [/\bkesini\b/gi, "ke sini"],
  [/\bkemana\b/gi, "ke mana"],
  [/\bdarimana\b/gi, "dari mana"],
  [/\bterimakasih\b/gi, "terima kasih"],
  [/\btanggungjawab\b/gi, "tanggung jawab"],
  [/\bkerjasama\b/gi, "kerja sama"],
];

function capitalizeFix(text: string): string {
  // Capitalise the first letter of every sentence (start, or after
  // ". ", "! ", "? " + space). Other capitals are left untouched.
  return text.replace(
    /(^|[.!?]\s+)([a-zà-ÿ])/g,
    (_m, pre: string, ch: string) => pre + ch.toUpperCase(),
  );
}

function collapseSpacesFix(text: string): string {
  return text.replace(/ {2,}/g, " ");
}

function spellingFix(wrong: RegExp, right: string): (text: string) => string {
  return (text: string) =>
    text.replace(wrong, (m) =>
      /^[A-ZÀ-Þ]/.test(m)
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right,
    );
}

/** Subject-ish field for this template: perihal / tentang / acara. */
function subjectKey(tpl: LetterTemplate): string | null {
  if (tpl.fields.some((f) => f.key === "perihal")) return "perihal";
  if (tpl.fields.some((f) => f.key === "tentang")) return "tentang";
  if (tpl.fields.some((f) => f.key === "acara")) return "acara";
  return null;
}

/**
 * Check one draft. `values` are the letter-form fields, `body` the
 * editable draft text, `letterhead` the officer's kop settings.
 * hasDraft is false when the form and the body are both empty.
 */
export function checkLetter(
  tpl: LetterTemplate,
  values: Record<string, string>,
  body: string,
  letterhead: LetterheadSettings,
): LetterCheckResult {
  const issues: LetterIssue[] = [];
  const v = (k: string): string => (values[k] ?? "").trim();
  const hasDraft =
    Object.values(values).some((x) => x.trim().length > 0) ||
    body.trim().length > 0;
  if (!hasDraft) return { issues, errors: 0, warnings: 0, hasDraft: false };

  // 1. Kop surat — the two institution lines must be filled.
  const kopMissing: string[] = [];
  if (!letterhead.instansi1.trim()) kopMissing.push("baris instansi 1");
  if (!letterhead.instansi2.trim()) kopMissing.push("baris instansi 2");
  if (kopMissing.length > 0) {
    issues.push({
      id: "kop",
      field: "kop",
      severity: "error",
      messageKey: "p34CheckKop",
      params: [kopMissing.join(" dan ")],
    });
  }

  // 2. Nomor surat.
  const nomor = v("nomor");
  if (!nomor) {
    issues.push({
      id: "nomor-kosong",
      field: "nomor",
      severity: "error",
      messageKey: "p34CheckNomorEmpty",
      params: [],
    });
  } else if (!isPlausibleLetterNumber(nomor)) {
    issues.push({
      id: "nomor-pola",
      field: "nomor",
      severity: "warning",
      messageKey: "p34CheckNomorPattern",
      params: [nomor],
    });
  }

  // 3. Tanggal.
  const tanggal = v("tanggal");
  if (!tanggal) {
    issues.push({
      id: "tanggal-kosong",
      field: "tanggal",
      severity: "error",
      messageKey: "p34CheckTanggalEmpty",
      params: [],
    });
  } else if (!DATE_ID.test(tanggal) && !DATE_ISO.test(tanggal)) {
    issues.push({
      id: "tanggal-format",
      field: "tanggal",
      severity: "warning",
      messageKey: "p34CheckTanggalFormat",
      params: [tanggal],
    });
  }

  // 4. Perihal / tentang / acara.
  const sKey = subjectKey(tpl);
  if (sKey && !v(sKey)) {
    issues.push({
      id: "perihal-kosong",
      field: "perihal",
      severity: "error",
      messageKey: "p34CheckPerihalEmpty",
      params: [],
    });
  }

  // 5. Tujuan (warning only — some letters genuinely have none).
  if (tpl.fields.some((f) => f.key === "tujuan") && !v("tujuan")) {
    issues.push({
      id: "tujuan-kosong",
      field: "tujuan",
      severity: "warning",
      messageKey: "p34CheckTujuanEmpty",
      params: [],
    });
  }

  // 6. EYD dasar pada isi surat.
  const text = body.trim();
  if (!text) {
    issues.push({
      id: "isi-kosong",
      field: "isi",
      severity: "error",
      messageKey: "p34CheckBodyEmpty",
      params: [],
    });
  } else {
    // 6a. Kalimat diawali huruf kecil.
    const lowerStarts: string[] = [];
    for (const m of text.matchAll(/(^|[.!?]\s+)([a-zà-ÿ][^\n.!?]{0,40})/g)) {
      lowerStarts.push(m[2].trim());
    }
    if (lowerStarts.length > 0) {
      issues.push({
        id: "huruf-kecil",
        field: "isi",
        severity: "warning",
        messageKey: "p34CheckLowerStart",
        params: [lowerStarts[0], String(lowerStarts.length)],
        fix: { body: capitalizeFix },
      });
    }
    // 6b. Spasi ganda.
    const doubleSpaces = (text.match(/ {2,}/g) ?? []).length;
    if (doubleSpaces > 0) {
      issues.push({
        id: "spasi-ganda",
        field: "isi",
        severity: "warning",
        messageKey: "p34CheckDoubleSpace",
        params: [String(doubleSpaces)],
        fix: { body: collapseSpacesFix },
      });
    }
    // 6c. Kata yang sering salah tulis (hanya yang yakin).
    for (const [re, right] of COMMON_MISTAKES) {
      const found = text.match(re);
      if (found) {
        const wrong = found[0].toLowerCase();
        issues.push({
          id: `ejaan-${wrong}`,
          field: "isi",
          severity: "warning",
          messageKey: "p34CheckSpelling",
          params: [wrong, right],
          fix: { body: spellingFix(re, right) },
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  return { issues, errors, warnings: issues.length - errors, hasDraft: true };
}
