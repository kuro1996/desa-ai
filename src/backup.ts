// DesaAI — Backup & Restore (Paket 14).
// One JSON file holding every office collection: letters (the drafts
// library, local + Firestore copies), personnel, IKM answers, complaints
// and the mail register. 100% local: export downloads a file, restore
// reads a file the user picks — no data ever leaves the device on its
// own. Restore validates the file strictly first and never touches
// live data when validation fails.
import { listDrafts, listLocalDrafts, type Draft } from "./drafts";
import type { FirebaseServices } from "./firebase";
import { loadAgenda, type AgendaEntry } from "./agenda";
import { loadIkm, type IkmResponse } from "./ikm";
import { loadAduan, type Aduan } from "./pengaduan";
import { loadPerangkat, type Perangkat } from "./kepegawaian";
import type { Lang } from "./i18n";

export const BACKUP_APP_ID = "desaai";
export const BACKUP_FORMAT_VERSION = 1;
/** Backups of this app are far below 1 MB; anything larger is not ours. */
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024;

export interface BackupCounts {
  surat: number;
  pegawai: number;
  ikm: number;
  pengaduan: number;
  agenda: number;
}

export interface DesaaiBackup {
  app: typeof BACKUP_APP_ID;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string; // ISO date string
  counts: BackupCounts;
  collections: {
    surat: Draft[];
    pegawai: Perangkat[];
    ikm: IkmResponse[];
    pengaduan: Aduan[];
    agenda: AgendaEntry[];
  };
}

const COLLECTION_KEYS: Array<keyof BackupCounts> = [
  "surat",
  "pegawai",
  "ikm",
  "pengaduan",
  "agenda",
];

const COUNT_LABELS: Record<Lang, Record<keyof BackupCounts, string>> = {
  en: {
    surat: "Letters",
    pegawai: "Personnel",
    ikm: "IKM",
    pengaduan: "Complaints",
    agenda: "Register",
  },
  id: {
    surat: "Surat",
    pegawai: "Pegawai",
    ikm: "IKM",
    pengaduan: "Pengaduan",
    agenda: "Agenda",
  },
};

/** "Surat 12 · Pegawai 23 · IKM 14 · Pengaduan 6 · Agenda 4". */
export function backupCountsLine(counts: BackupCounts, lang: Lang): string {
  const labels = COUNT_LABELS[lang] ?? COUNT_LABELS.id;
  return COLLECTION_KEYS.map((k) => `${labels[k]} ${counts[k]}`).join(" · ");
}

/** Gather every collection into one backup object (demo data included
 * exactly as it is — the "Data Contoh" label travels with the records
 * themselves, via their demo ids). */
export async function collectBackup(
  svc: FirebaseServices | null,
): Promise<DesaaiBackup> {
  // The letters archive is the drafts library: local drafts plus the
  // Firestore copies, so a backup taken while online is not empty.
  const surat = svc ? await listDrafts(svc) : listLocalDrafts();
  const pegawai = loadPerangkat();
  const ikm = loadIkm();
  const pengaduan = loadAduan();
  const agenda = loadAgenda();
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {
      surat: surat.length,
      pegawai: pegawai.length,
      ikm: ikm.length,
      pengaduan: pengaduan.length,
      agenda: agenda.length,
    },
    collections: { surat, pegawai, ikm, pengaduan, agenda },
  };
}

export function backupToJson(backup: DesaaiBackup): string {
  return JSON.stringify(backup, null, 2);
}

/** `desaai-backup-YYYY-MM-DD.json` (local date). */
export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `desaai-backup-${y}-${m}-${d}.json`;
}

// ---------- validation (strict: a bad file must never reach live data) ----------

export type BackupValidation =
  | { ok: true; backup: DesaaiBackup }
  | { ok: false; errors: string[] };

const MSG: Record<Lang, Record<string, string>> = {
  en: {
    notObject: "File is not a DesaAI backup (expected a JSON object).",
    wrongApp: 'Not a DesaAI backup (app must be "desaai").',
    wrongVersion: "Unknown backup format version — this file was made by a newer/older DesaAI.",
    badDate: "Backup date (exportedAt) is missing or not a valid date.",
    badCounts: "Backup counts are missing or invalid.",
    countMismatch: "Backup counts do not match the data inside the file.",
    badCollections: "Backup collections are missing or invalid.",
    notArray: "is not a list.",
    badField: "has an invalid or missing field",
    badScore: "scores must be 9 numbers from 1 to 4.",
    badDateField: "must be a YYYY-MM-DD date.",
    badNomorAgenda: "must look like 001/AGS/2026.",
    tooMany: "and more errors — file rejected.",
  },
  id: {
    notObject: "File bukan backup DesaAI (diharapkan objek JSON).",
    wrongApp: 'Bukan backup DesaAI (app harus "desaai").',
    wrongVersion: "Versi format backup tidak dikenali — file ini dibuat DesaAI yang lebih baru/lama.",
    badDate: "Tanggal backup (exportedAt) hilang atau bukan tanggal yang valid.",
    badCounts: "Jumlah isi backup hilang atau tidak valid.",
    countMismatch: "Jumlah isi backup tidak cocok dengan data di dalam file.",
    badCollections: "Koleksi backup hilang atau tidak valid.",
    notArray: "bukan daftar.",
    badField: "field tidak valid atau hilang",
    badScore: "scores harus 9 angka 1 sampai 4.",
    badDateField: "harus tanggal YYYY-MM-DD.",
    badNomorAgenda: "harus seperti 001/AGS/2026.",
    tooMany: "dan kesalahan lain — file ditolak.",
  },
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNonEmptyStr = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;
const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isNonNegInt = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0;
const isDateStr = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function checkRecord(
  rec: unknown,
  path: string,
  fields: Array<{
    key: string;
    ok: (v: unknown) => boolean;
    msg?: string;
  }>,
  errors: string[],
  msg: (typeof MSG)["id"],
): void {
  if (!isObj(rec)) {
    errors.push(`${path}: ${msg.badField}`);
    return;
  }
  for (const f of fields) {
    if (!f.ok(rec[f.key])) {
      errors.push(`${path}.${f.key} ${f.msg ?? msg.badField}`);
    }
  }
}

function validateDraft(r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]): void {
  checkRecord(
    r,
    path,
    [
      { key: "id", ok: isNonEmptyStr },
      {
        key: "kind",
        ok: (v) => v === "letter" || v === "summary" || v === "qa",
      },
      { key: "title", ok: isStr },
      { key: "content", ok: isStr },
      { key: "createdAt", ok: isFiniteNum },
      {
        key: "source",
        ok: (v) => v === "local" || v === "firestore",
      },
    ],
    errors,
    msg,
  );
}

function validatePerangkat(r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]): void {
  checkRecord(
    r,
    path,
    [
      { key: "id", ok: isNonEmptyStr },
      { key: "nama", ok: isStr },
      { key: "nik", ok: isStr },
      { key: "tempatLahir", ok: isStr },
      { key: "tglLahir", ok: isDateStr, msg: msg.badDateField },
      { key: "agama", ok: isStr },
      { key: "jabatan", ok: isStr },
      { key: "desa", ok: isStr },
      { key: "unit", ok: (v) => v === "kecamatan" || v === "desa" },
      { key: "noHp", ok: isStr },
      { key: "masaMulai", ok: isDateStr, msg: msg.badDateField },
      { key: "masaSelesai", ok: isDateStr, msg: msg.badDateField },
      { key: "alamat", ok: isStr },
    ],
    errors,
    msg,
  );
}

function validateIkm(r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]): void {
  checkRecord(
    r,
    path,
    [
      { key: "id", ok: isNonEmptyStr },
      { key: "nama", ok: isStr },
      { key: "jenisSurat", ok: isStr },
      {
        key: "scores",
        ok: (v) =>
          Array.isArray(v) &&
          v.length === 9 &&
          v.every((s) => Number.isInteger(s) && s >= 1 && s <= 4),
        msg: msg.badScore,
      },
      { key: "komentar", ok: isStr },
      { key: "createdAt", ok: isFiniteNum },
    ],
    errors,
    msg,
  );
}

function validateAduan(r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]): void {
  checkRecord(
    r,
    path,
    [
      { key: "id", ok: isNonEmptyStr },
      { key: "nama", ok: isStr },
      { key: "jenis", ok: isStr },
      { key: "jenisSurat", ok: isStr },
      { key: "isi", ok: isStr },
      { key: "kontak", ok: isStr },
      {
        key: "status",
        ok: (v) => v === "baru" || v === "diproses" || v === "selesai",
      },
      { key: "createdAt", ok: isFiniteNum },
    ],
    errors,
    msg,
  );
}

function validateAgenda(r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]): void {
  checkRecord(
    r,
    path,
    [
      { key: "id", ok: isNonEmptyStr },
      {
        key: "nomorAgenda",
        ok: (v) => isStr(v) && /^\d{3}\/AGS\/\d{4}$/.test(v),
        msg: msg.badNomorAgenda,
      },
      { key: "arah", ok: (v) => v === "masuk" || v === "keluar" },
      { key: "nomorSurat", ok: isStr },
      { key: "pihak", ok: isStr },
      { key: "perihal", ok: isStr },
      { key: "tanggal", ok: isFiniteNum },
      { key: "disposisi", ok: isStr },
      {
        key: "status",
        ok: (v) => v === "baru" || v === "diproses" || v === "selesai",
      },
      { key: "createdAt", ok: isFiniteNum },
    ],
    errors,
    msg,
  );
}

const VALIDATORS: Record<
  keyof BackupCounts,
  (r: unknown, path: string, errors: string[], msg: (typeof MSG)["id"]) => void
> = {
  surat: validateDraft,
  pegawai: validatePerangkat,
  ikm: validateIkm,
  pengaduan: validateAduan,
  agenda: validateAgenda,
};

/** Parse + strictly validate a backup file's contents. Returns the typed
 * backup on success; on failure a list of human-readable errors and the
 * caller must NOT touch live data. */
export function validateBackup(value: unknown, lang: Lang = "id"): BackupValidation {
  const msg = MSG[lang] ?? MSG.id;
  const errors: string[] = [];
  const fail = (): BackupValidation => ({
    ok: false,
    errors:
      errors.length > 8
        ? [...errors.slice(0, 8), `${msg.tooMany} (${errors.length - 8})`]
        : errors,
  });
  if (!isObj(value)) return { ok: false, errors: [msg.notObject] };
  if (value.app !== BACKUP_APP_ID) return { ok: false, errors: [msg.wrongApp] };
  if (value.formatVersion !== BACKUP_FORMAT_VERSION) {
    return { ok: false, errors: [msg.wrongVersion] };
  }
  if (!isStr(value.exportedAt) || Number.isNaN(Date.parse(value.exportedAt))) {
    errors.push(msg.badDate);
  }
  const countsRaw = value.counts;
  if (
    !isObj(countsRaw) ||
    !COLLECTION_KEYS.every((k) => isNonNegInt(countsRaw[k]))
  ) {
    errors.push(msg.badCounts);
  }
  if (!isObj(value.collections)) {
    errors.push(msg.badCollections);
    return fail();
  }
  const counts = isObj(countsRaw) ? countsRaw : undefined;
  for (const key of COLLECTION_KEYS) {
    const arr = (value.collections as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) {
      errors.push(`collections.${key} ${msg.notArray}`);
      continue;
    }
    if (counts && counts[key] !== arr.length) errors.push(msg.countMismatch);
    arr.forEach((rec, i) => {
      if (errors.length > 40) return; // cap the noise, still a failure
      VALIDATORS[key](rec, `collections.${key}[${i}]`, errors, msg);
    });
  }
  if (errors.length > 0) return fail();
  return { ok: true, backup: value as unknown as DesaaiBackup };
}
