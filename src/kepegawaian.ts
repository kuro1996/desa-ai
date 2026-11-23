// DesaAI — modul Kepegawaian (diadaptasi dari SIAP AKAD, contoh milik Bos).
// SIAP AKAD = "Sistem Update Data Perangkat dan Lembaga Desa", Kecamatan
// Simpangkatis 2026. Modul ini HANYA memakai struktur + 15 data contohnya
// sebagai DATA DEMO di dalam DesaAI — bukan data kepegawaian asli/live.
// Data tersimpan lokal (localStorage) sebagai sumber utama; bila Firebase
// ready, salinan ikut disimpan ke Firestore (best-effort, tidak pernah
// memblokir UI). Tidak ada login dan tidak ada kredensial di modul ini.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseServices } from "./firebase";
import { markFirestoreSync } from "./firebase";

export interface Perangkat {
  id: string;
  nama: string;
  nik: string;
  tempatLahir: string;
  tglLahir: string; // YYYY-MM-DD
  agama: string;
  jabatan: string;
  desa: string; // village name, or "Kecamatan Simpangkatis" for subdistrict staff
  unit: "kecamatan" | "desa"; // "kecamatan" = subdistrict-office staff, "desa" = village officer
  noHp: string;
  masaMulai: string; // YYYY-MM-DD
  masaSelesai: string; // YYYY-MM-DD
  alamat: string;
}

export const KECAMATAN_LABEL = "Kecamatan Simpangkatis";

export const DESA_LIST = [
  "Simpangkatis",
  "Katis",
  "Terak",
  "Teru",
  "Pasir Garam",
  "Beruas",
  "Puput",
  "Celuak",
  "Pinang Sebatang",
  "Sungkap",
];

export const JABATAN_LIST = [
  "Kepala Desa",
  "Sekretaris Desa",
  "Kepala Dusun",
  "Kepala Urusan",
  "Kepala Seksi",
  "Kepala Bidang",
  "Staf Desa",
  "BPD",
  "LPM",
  "Lainnya",
];

// Reference positions for the subdistrict (kecamatan) office itself.
export const JABATAN_KECAMATAN = [
  "Camat",
  "Sekretaris Kecamatan",
  "Kepala Seksi Pemerintahan",
  "Kepala Seksi Pemberdayaan Masyarakat Desa",
  "Kepala Seksi Pelayanan",
  "Kepala Seksi Ketentraman dan Ketertiban",
  "Kepala Subbagian Umum dan Kepegawaian",
  "Kepala Subbagian Keuangan",
  "Staf Kecamatan",
];

export const AGAMA_LIST = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
];

export interface Lembaga {
  id: string;
  name: string;
  fullId: string;
  descId: string;
  descEn: string;
}

export const LEMBAGA: Lembaga[] = [
  {
    id: "bpd",
    name: "BPD",
    fullId: "Badan Permusyawaratan Desa",
    descId: "Lembaga legislatif desa yang berfungsi sebagai pemegang kekuasaan pemerintahan desa.",
    descEn: "The village legislative body.",
  },
  {
    id: "lpm",
    name: "LPM",
    fullId: "Lembaga Pemberdayaan Masyarakat",
    descId: "Lembaga yang berfungsi dalam pemberdayaan masyarakat desa.",
    descEn: "Community empowerment institution.",
  },
  {
    id: "pkk",
    name: "PKK",
    fullId: "Pemberdayaan dan Kesejahteraan Keluarga",
    descId: "Organisasi kemasyarakatan yang bergerak di bidang kesejahteraan keluarga.",
    descEn: "Family welfare empowerment organisation.",
  },
  {
    id: "posyandu",
    name: "Posyandu",
    fullId: "Pos Pelayanan Terpadu",
    descId: "Layanan kesehatan ibu dan anak di tingkat desa.",
    descEn: "Integrated maternal and child health post.",
  },
  {
    id: "linmas",
    name: "Linmas",
    fullId: "Perlindungan Masyarakat",
    descId: "Lembaga yang bertugas menjaga keamanan dan ketertiban desa.",
    descEn: "Community protection unit.",
  },
  {
    id: "karang-taruna",
    name: "Karang Taruna",
    fullId: "Organisasi Kepemudaan",
    descId: "Organisasi kepemudaan yang bergerak di bidang sosial dan kewirausahaan.",
    descEn: "Youth organisation for social and entrepreneurial activities.",
  },
];

// 15 data CONTOH dari SIAP AKAD (NIK berurutan = data demo, bukan data asli).
export const DEMO_SEED: Perangkat[] = [
  { id: "demo-1", nama: "Ahmad Fauzi", nik: "1901010101010001", tempatLahir: "Pangkalpinang", tglLahir: "1980-05-15", agama: "Islam", jabatan: "Kepala Desa", desa: "Simpangkatis", unit: "desa", noHp: "0812-3456-7890", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Merdeka No. 1, Simpangkatis" },
  { id: "demo-2", nama: "Budi Santoso", nik: "1901010101010002", tempatLahir: "Sungailiat", tglLahir: "1975-08-20", agama: "Islam", jabatan: "Sekretaris Desa", desa: "Simpangkatis", unit: "desa", noHp: "0812-3456-7891", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Sudirman No. 5, Simpangkatis" },
  { id: "demo-3", nama: "Citra Dewi", nik: "1901010101010003", tempatLahir: "Toboali", tglLahir: "1985-03-10", agama: "Kristen", jabatan: "Kepala Urusan", desa: "Katis", unit: "desa", noHp: "0812-3456-7892", masaMulai: "2022-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Kartini No. 3, Katis" },
  { id: "demo-4", nama: "Dedi Kurniawan", nik: "1901010101010004", tempatLahir: "Mentok", tglLahir: "1978-11-25", agama: "Islam", jabatan: "Kepala Desa", desa: "Katis", unit: "desa", noHp: "0812-3456-7893", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Ahmad Yani No. 7, Katis" },
  { id: "demo-5", nama: "Eka Sari", nik: "1901010101010005", tempatLahir: "Koba", tglLahir: "1982-07-08", agama: "Islam", jabatan: "Kepala Seksi", desa: "Terak", unit: "desa", noHp: "0812-3456-7894", masaMulai: "2021-01-01", masaSelesai: "2026-12-31", alamat: "Jl. Diponegoro No. 2, Terak" },
  { id: "demo-6", nama: "Fajar Pratama", nik: "1901010101010006", tempatLahir: "Belinyu", tglLahir: "1988-01-30", agama: "Buddha", jabatan: "Staf Desa", desa: "Terak", unit: "desa", noHp: "0812-3456-7895", masaMulai: "2023-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Imam Bonjol No. 4, Terak" },
  { id: "demo-7", nama: "Gita Maharani", nik: "1901010101010007", tempatLahir: "Pangkalpinang", tglLahir: "1990-09-12", agama: "Islam", jabatan: "Kepala Desa", desa: "Teru", unit: "desa", noHp: "0812-3456-7896", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Gatot Subroto No. 8, Teru" },
  { id: "demo-8", nama: "Hadi Wijaya", nik: "1901010101010008", tempatLahir: "Sungailiat", tglLahir: "1972-04-18", agama: "Islam", jabatan: "Kepala Dusun", desa: "Pasir Garam", unit: "desa", noHp: "0812-3456-7897", masaMulai: "2021-01-01", masaSelesai: "2026-06-30", alamat: "Jl. Sisingamangaraja No. 6, Pasir Garam" },
  { id: "demo-9", nama: "Indah Permata", nik: "1901010101010009", tempatLahir: "Toboali", tglLahir: "1986-12-05", agama: "Katolik", jabatan: "BPD", desa: "Beruas", unit: "desa", noHp: "0812-3456-7898", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Thamrin No. 9, Beruas" },
  { id: "demo-10", nama: "Joko Susilo", nik: "1901010101010010", tempatLahir: "Mentok", tglLahir: "1979-06-22", agama: "Islam", jabatan: "Kepala Desa", desa: "Puput", unit: "desa", noHp: "0812-3456-7899", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. HOS Cokroaminoto No. 11, Puput" },
  { id: "demo-11", nama: "Kartika Sari", nik: "1901010101010011", tempatLahir: "Koba", tglLahir: "1984-02-14", agama: "Islam", jabatan: "Sekretaris Desa", desa: "Celuak", unit: "desa", noHp: "0812-3456-7900", masaMulai: "2022-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Veteran No. 13, Celuak" },
  { id: "demo-12", nama: "Lukman Hakim", nik: "1901010101010012", tempatLahir: "Belinyu", tglLahir: "1981-10-28", agama: "Islam", jabatan: "Kepala Desa", desa: "Pinang Sebatang", unit: "desa", noHp: "0812-3456-7901", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Pahlawan No. 15, Pinang Sebatang" },
  { id: "demo-13", nama: "Maya Anggraini", nik: "1901010101010013", tempatLahir: "Pangkalpinang", tglLahir: "1987-08-03", agama: "Kristen", jabatan: "LPM", desa: "Sungkap", unit: "desa", noHp: "0812-3456-7902", masaMulai: "2021-01-01", masaSelesai: "2026-12-31", alamat: "Jl. Veteran No. 17, Sungkap" },
  { id: "demo-14", nama: "Nanda Putra", nik: "1901010101010014", tempatLahir: "Sungailiat", tglLahir: "1983-11-17", agama: "Islam", jabatan: "Kepala Urusan", desa: "Simpangkatis", unit: "desa", noHp: "0812-3456-7903", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Merdeka No. 2, Simpangkatis" },
  { id: "demo-15", nama: "Oscar Prabowo", nik: "1901010101010015", tempatLahir: "Toboali", tglLahir: "1976-03-09", agama: "Islam", jabatan: "Kepala Dusun", desa: "Katis", unit: "desa", noHp: "0812-3456-7904", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Kartini No. 8, Katis" },
];

// 8 data CONTOH pegawai kantor kecamatan (nama generik — BUKAN orang asli;
// tidak ada satu pun nama pejabat kecamatan yang sebenarnya di sini).
// Term dates are spread so the dashboard shows all three statuses:
// 4 aktif, 2 akan habis (<=90 hari dari 2026-11-20), 2 sudah habis.
export const DEMO_KECAMATAN: Perangkat[] = [
  { id: "demo-kec-1", nama: "Budi Prasetyo", nik: "1901010101010101", tempatLahir: "Pangkalpinang", tglLahir: "1978-02-11", agama: "Islam", jabatan: "Camat", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7910", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Raya Simpangkatis No. 1, Simpangkatis" },
  { id: "demo-kec-2", nama: "Siti Rahmawati", nik: "1901010101010102", tempatLahir: "Sungailiat", tglLahir: "1981-06-19", agama: "Islam", jabatan: "Sekretaris Kecamatan", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7911", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Raya Simpangkatis No. 2, Simpangkatis" },
  { id: "demo-kec-3", nama: "Andi Wijaya", nik: "1901010101010103", tempatLahir: "Koba", tglLahir: "1985-09-27", agama: "Islam", jabatan: "Kepala Seksi Pemerintahan", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7912", masaMulai: "2022-01-01", masaSelesai: "2026-12-31", alamat: "Jl. Raya Simpangkatis No. 3, Simpangkatis" },
  { id: "demo-kec-4", nama: "Dewi Lestari", nik: "1901010101010104", tempatLahir: "Toboali", tglLahir: "1988-04-08", agama: "Kristen", jabatan: "Kepala Seksi Pemberdayaan Masyarakat Desa", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7913", masaMulai: "2021-01-01", masaSelesai: "2027-01-15", alamat: "Jl. Raya Simpangkatis No. 4, Simpangkatis" },
  { id: "demo-kec-5", nama: "Rizky Ramadhan", nik: "1901010101010105", tempatLahir: "Mentok", tglLahir: "1979-12-02", agama: "Islam", jabatan: "Kepala Seksi Pelayanan", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7914", masaMulai: "2021-01-01", masaSelesai: "2026-06-30", alamat: "Jl. Raya Simpangkatis No. 5, Simpangkatis" },
  { id: "demo-kec-6", nama: "Agus Setiawan", nik: "1901010101010106", tempatLahir: "Belinyu", tglLahir: "1983-07-14", agama: "Islam", jabatan: "Kepala Seksi Ketentraman dan Ketertiban", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7915", masaMulai: "2023-01-01", masaSelesai: "2026-10-15", alamat: "Jl. Raya Simpangkatis No. 6, Simpangkatis" },
  { id: "demo-kec-7", nama: "Nur Hidayah", nik: "1901010101010107", tempatLahir: "Pangkalpinang", tglLahir: "1990-01-25", agama: "Islam", jabatan: "Kepala Subbagian Umum dan Kepegawaian", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7916", masaMulai: "2022-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Raya Simpangkatis No. 7, Simpangkatis" },
  { id: "demo-kec-8", nama: "Eko Saputra", nik: "1901010101010108", tempatLahir: "Sungailiat", tglLahir: "1986-11-30", agama: "Islam", jabatan: "Kepala Subbagian Keuangan", desa: KECAMATAN_LABEL, unit: "kecamatan", noHp: "0812-3456-7917", masaMulai: "2021-01-01", masaSelesai: "2027-12-31", alamat: "Jl. Raya Simpangkatis No. 8, Simpangkatis" },
];

export const SOON_DAYS = 90;

const ITEMS_KEY = "desaai-perangkat-v1";
const META_KEY = "desaai-perangkat-meta-v1";

let memoryItems: Perangkat[] | null = null;
let memoryDemo = true;

function readMeta(): { seeded: boolean } {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { seeded: false };
    const parsed = JSON.parse(raw) as { seeded?: boolean };
    return { seeded: parsed.seeded === true };
  } catch {
    return { seeded: false };
  }
}

function writeMeta(seeded: boolean): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ seeded }));
  } catch {
    // Storage unavailable — in-memory state still works.
  }
}

/** Load items; on first run seeds the 15 SIAP AKAD demo records + 8 subdistrict demo records. */
export function loadPerangkat(): Perangkat[] {
  if (memoryItems) return [...memoryItems];
  let items: Perangkat[] = [];
  let seeded = false;
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Perangkat[];
      if (Array.isArray(parsed)) {
        // Older saves predate the unit dimension — default them to "desa".
        items = parsed.map((p) => ({ ...p, unit: p.unit ?? "desa" }));
      }
    }
    const meta = readMeta();
    seeded = meta.seeded;
    if (items.length === 0 && !seeded) {
      items = [
        ...DEMO_SEED.map((p) => ({ ...p })),
        ...DEMO_KECAMATAN.map((p) => ({ ...p })),
      ];
      seeded = true;
      savePerangkat(items);
      writeMeta(true);
    }
  } catch {
    items = [
      ...DEMO_SEED.map((p) => ({ ...p })),
      ...DEMO_KECAMATAN.map((p) => ({ ...p })),
    ];
    seeded = true;
  }
  memoryItems = items;
  memoryDemo = seeded && items.every((p) => p.id.startsWith("demo-"));
  return [...items];
}

export function savePerangkat(items: Perangkat[]): void {
  memoryItems = [...items];
  memoryDemo = items.length > 0 && items.every((p) => p.id.startsWith("demo-"));
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    writeMeta(true);
  } catch {
    // Storage unavailable — in-memory state still works.
  }
}

/** True when the current list is still exactly the demo seed. */
export function isDemoData(): boolean {
  if (!memoryItems) loadPerangkat();
  return memoryDemo;
}

export function isDemoRecord(p: Perangkat): boolean {
  return p.id.startsWith("demo-");
}

// ---------- masa bhakti ----------

export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from today until masaSelesai (negative = already expired). */
export function daysUntilEnd(p: Perangkat, now = new Date()): number {
  const end = new Date(`${p.masaSelesai}T00:00:00`);
  const today = startOfToday(now);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export type MasaStatus = "aktif" | "akan-habis" | "habis";

export function masaStatus(p: Perangkat, now = new Date()): MasaStatus {
  const d = daysUntilEnd(p, now);
  if (d < 0) return "habis";
  if (d <= SOON_DAYS) return "akan-habis";
  return "aktif";
}

export interface UnitStats {
  total: number;
  aktif: number;
  akanHabis: number;
  habis: number;
}

export interface KegStats {
  total: number;
  desaCount: number;
  aktif: number;
  akanHabis: number;
  habis: number;
  kecamatan: UnitStats;
  desa: UnitStats;
}

function emptyUnitStats(): UnitStats {
  return { total: 0, aktif: 0, akanHabis: 0, habis: 0 };
}

export function computeStats(items: Perangkat[], now = new Date()): KegStats {
  const kecamatan = emptyUnitStats();
  const desa = emptyUnitStats();
  for (const p of items) {
    const s = masaStatus(p, now);
    const bucket = p.unit === "kecamatan" ? kecamatan : desa;
    bucket.total += 1;
    if (s === "aktif") bucket.aktif += 1;
    else if (s === "akan-habis") bucket.akanHabis += 1;
    else bucket.habis += 1;
  }
  return {
    total: items.length,
    desaCount: DESA_LIST.length,
    aktif: kecamatan.aktif + desa.aktif,
    akanHabis: kecamatan.akanHabis + desa.akanHabis,
    habis: kecamatan.habis + desa.habis,
    kecamatan,
    desa,
  };
}

export interface NotifItem {
  perangkat: Perangkat;
  kind: "habis" | "akan-habis";
  days: number; // negative when expired (days since expiry = -days)
}

/** Notifications: expired first (most overdue first), then expiring soon. */
export function computeNotifications(items: Perangkat[], now = new Date()): NotifItem[] {
  const list: NotifItem[] = [];
  for (const p of items) {
    const d = daysUntilEnd(p, now);
    if (d < 0) list.push({ perangkat: p, kind: "habis", days: d });
    else if (d <= SOON_DAYS) list.push({ perangkat: p, kind: "akan-habis", days: d });
  }
  list.sort((a, b) => a.days - b.days);
  return list;
}

// ---------- Paket 20 — Pengingat Masa Berlaku SK ----------
// Tighter 30-day window for the SK-expiry reminder (the 90-day window
// above stays as the general masa-bhakti notification). The SK's validity
// is the appointment term already stored per record (masaSelesai) — no
// date is ever invented here; a record without masaSelesai is skipped.
export const SK_SOON_DAYS = 30;

/** SK reminders: expired first (most overdue first), then expiring within 30 days (nearest first). */
export function computeSkReminders(items: Perangkat[], now = new Date()): NotifItem[] {
  const list: NotifItem[] = [];
  for (const p of items) {
    if (!p.masaSelesai) continue;
    const d = daysUntilEnd(p, now);
    if (Number.isNaN(d)) continue;
    if (d < 0) list.push({ perangkat: p, kind: "habis", days: d });
    else if (d <= SK_SOON_DAYS) list.push({ perangkat: p, kind: "akan-habis", days: d });
  }
  list.sort((a, b) => a.days - b.days);
  return list;
}

export function filterPerangkat(
  items: Perangkat[],
  search: string,
  desa: string,
  jabatan: string,
  status: MasaStatus | "" = "",
  unit: "kecamatan" | "desa" | "" = "",
): Perangkat[] {
  const q = search.trim().toLowerCase();
  return items.filter((p) => {
    const matchSearch =
      !q ||
      p.nama.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q) ||
      p.desa.toLowerCase().includes(q) ||
      (p.unit === "kecamatan" ? "kecamatan".includes(q) : "desa".includes(q));
    const matchDesa = !desa || p.desa === desa;
    const matchJabatan = !jabatan || p.jabatan === jabatan;
    const matchStatus = !status || masaStatus(p) === status;
    const matchUnit = !unit || p.unit === unit;
    return matchSearch && matchDesa && matchJabatan && matchStatus && matchUnit;
  });
}

export function formatDateId(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/** Plain-text Indonesian recap used for the AI summary prompt (and the offline fallback). */
export function buildKepegawaianSummary(items: Perangkat[], now = new Date()): string {
  const s = computeStats(items, now);
  const notifs = computeNotifications(items, now);
  const lines: string[] = [
    `Rekap kepegawaian Kantor Kecamatan Simpangkatis (data contoh, ${s.total} pegawai: ${s.kecamatan.total} pegawai kecamatan + ${s.desa.total} perangkat desa di ${s.desaCount} desa).`,
    `Kantor kecamatan — aktif: ${s.kecamatan.aktif}; akan habis dalam ${SOON_DAYS} hari: ${s.kecamatan.akanHabis}; sudah habis: ${s.kecamatan.habis}.`,
    `Perangkat desa — aktif: ${s.desa.aktif}; akan habis dalam ${SOON_DAYS} hari: ${s.desa.akanHabis}; sudah habis: ${s.desa.habis}.`,
  ];
  if (notifs.length === 0) {
    lines.push("Tidak ada masa bhakti yang habis atau akan habis dalam waktu dekat.");
  } else {
    lines.push("Perhatian masa bhakti:");
    for (const n of notifs) {
      const unit = n.perangkat.unit === "kecamatan" ? "Kantor Kecamatan" : n.perangkat.desa;
      if (n.kind === "habis") {
        lines.push(`- ${n.perangkat.nama} (${n.perangkat.jabatan}, ${unit}): masa bhakti HABIS ${-n.days} hari lalu (berakhir ${formatDateId(n.perangkat.masaSelesai)}).`);
      } else {
        lines.push(`- ${n.perangkat.nama} (${n.perangkat.jabatan}, ${unit}): masa bhakti berakhir dalam ${n.days} hari (${formatDateId(n.perangkat.masaSelesai)}).`);
      }
    }
  }
  const perDesa = DESA_LIST.map((d) => {
    const n = items.filter((p) => p.desa === d).length;
    return `${d}: ${n}`;
  }).join("; ");
  lines.push(`Per desa — ${perDesa}.`);
  return lines.join("\n");
}

// ---------- Firestore (best-effort mirror, never blocks UI) ----------

export async function syncPerangkatToFirestore(
  svc: FirebaseServices,
  items: Perangkat[],
): Promise<void> {
  if (svc.status !== "ready" || !svc.db || !svc.uid) return;
  try {
    await setDoc(doc(svc.db, "users", svc.uid, "kepegawaian", "rekap"), {
      items,
      updatedAt: serverTimestamp(),
      demo: isDemoData(),
    });
    markFirestoreSync();
  } catch (e) {
    console.warn("DesaAI: Firestore kepegawaian sync failed (local data kept).", e);
  }
}
