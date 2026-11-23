// DesaAI — Pengaturan Kop Surat (Paket 17).
// The office identity printed on the official-letter kop (Paket 15) and
// its signature block. Every field is optional and filled in BY THE
// OFFICER — the app never invents a Camat name, NIP, address or phone
// number: an empty field prints as "—" in the signature block, and the
// kop contact line is omitted entirely when nothing is filled in. The
// two institution lines ship pre-filled with the values the app already
// used (they are office facts, not invented data) and stay editable.
// Stored locally (localStorage), 100% offline, and included in the
// Paket 14 backup as an optional sixth collection.
export interface LetterheadSettings {
  instansi1: string;
  instansi2: string;
  alamat: string;
  telepon: string;
  email: string;
  camatNama: string;
  camatNip: string;
  sekretarisNama: string;
}

export const LETTERHEAD_FIELDS: Array<keyof LetterheadSettings> = [
  "instansi1",
  "instansi2",
  "alamat",
  "telepon",
  "email",
  "camatNama",
  "camatNip",
  "sekretarisNama",
];

/** The institution lines are the values Paket 15 already printed. */
export const DEFAULT_LETTERHEAD: LetterheadSettings = {
  instansi1: "Pemerintah Kabupaten Bangka Tengah",
  instansi2: "Kecamatan Simpangkatis",
  alamat: "",
  telepon: "",
  email: "",
  camatNama: "",
  camatNip: "",
  sekretarisNama: "",
};

const LETTERHEAD_KEY = "desaai-letterhead-v1";

/** Load the officer's settings, merged over the defaults. Unknown or
 * non-string stored values are dropped — never trusted blindly. */
export function loadLetterhead(): LetterheadSettings {
  const out: LetterheadSettings = { ...DEFAULT_LETTERHEAD };
  try {
    const raw = localStorage.getItem(LETTERHEAD_KEY);
    if (!raw) return out;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return out;
    for (const key of LETTERHEAD_FIELDS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === "string") out[key] = v;
    }
  } catch {
    // Corrupt storage — fall back to defaults, keep the app working.
  }
  return out;
}

export function saveLetterhead(settings: LetterheadSettings): void {
  const clean: LetterheadSettings = { ...DEFAULT_LETTERHEAD };
  for (const key of LETTERHEAD_FIELDS) {
    const v = settings[key];
    if (typeof v === "string") clean[key] = v;
  }
  try {
    localStorage.setItem(LETTERHEAD_KEY, JSON.stringify(clean));
  } catch {
    // Storage unavailable — the in-memory values still apply this session.
  }
}

/** Strict shape check for backup restore: an object whose known fields,
 * when present, are all strings. Unknown extra fields are ignored. */
export function isValidLetterheadSettings(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const rec = value as Record<string, unknown>;
  return LETTERHEAD_FIELDS.every(
    (k) => rec[k] === undefined || typeof rec[k] === "string",
  );
}

/** "Jl. … · Telp. … · …@…" — empty when nothing is filled in, so the
 * kop contact line can be omitted instead of printing a placeholder. */
export function letterheadContactLine(s: LetterheadSettings): string {
  const parts: string[] = [];
  if (s.alamat.trim()) parts.push(s.alamat.trim());
  if (s.telepon.trim()) parts.push(`Telp. ${s.telepon.trim()}`);
  if (s.email.trim()) parts.push(s.email.trim());
  return parts.join(" · ");
}
