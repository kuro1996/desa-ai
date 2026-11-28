// DesaAI — Buku Agenda Surat (Kecamatan Simpangkatis).
// The office mail register: incoming letters (surat masuk) and outgoing
// letters (surat keluar), each with an automatic agenda number
// (NNN/AGS/YYYY), sender/recipient, subject, date, disposition and a
// Baru -> Diproses -> Selesai follow-up status.
// Stored locally (localStorage) — same local-first rule as My Drafts.
// No login, no credentials in this module.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseServices } from "./firebase";
import { markFirestoreSync } from "./firebase";

export type AgendaArah = "masuk" | "keluar";
export type AgendaStatus = "baru" | "diproses" | "selesai";

export const AGENDA_DISPOSISI = [
  "Camat",
  "Sekretaris",
  "Kasi Pemerintahan",
  "Kasi Kesra",
  "Arsip",
];

export interface AgendaEntry {
  id: string;
  nomorAgenda: string; // e.g. "003/AGS/2026"
  arah: AgendaArah;
  nomorSurat: string; // sender's / our letter number (may be "")
  pihak: string; // pengirim (masuk) / tujuan (keluar)
  perihal: string;
  tanggal: number; // epoch ms (letter date)
  disposisi: string; // "" = none
  status: AgendaStatus;
  createdAt: number; // epoch ms (recorded at)
}

/** Tanggal contoh relatif terhadap hari ini (Paket 47) — sama seperti
 * pengaduan: data contoh tidak boleh membusuk. `days` negatif = hari
 * lalu, positif = hari depan. */
function seedDate(now: Date, days: number, hour: number, minute: number): number {
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + days,
    hour,
    minute,
    0,
    0,
  );
  return d.getTime();
}

/** "Dicatat pada" tidak boleh di masa depan (Paket 47): tanggal surat
 * boleh jatuh besok/lusa (undangan acara mendatang), tapi pencatatan
 * di buku agenda terjadi hari ini. */
function seedRecordedAt(now: Date, t: number, deltaMs: number): number {
  return Math.min(t + deltaMs, now.getTime() - 60_000);
}

// 4 SAMPLE agenda entries (2 masuk, 2 keluar; 2 belum selesai).
// Paket 47 — tanggal RELATIF terhadap hari penyemaian (dulu tetap
// 18–21 Nov 2026). Offset hari: ags-1 -1 (masuk, baru → lewat 1 hari),
// ags-2 +1 (masuk, diproses → besok), ags-3 +2 (keluar, selesai),
// ags-4 -3 (keluar, selesai). Radar mendapat campuran: 1 lewat + 1
// mendekati dari agenda, ditambah 2 pengaduan lama.
export function buildAgendaSeed(now = new Date()): AgendaEntry[] {
  const t1 = seedDate(now, -1, 8, 0);
  const t2 = seedDate(now, 1, 10, 0);
  const t3 = seedDate(now, 2, 9, 0);
  const t4 = seedDate(now, -3, 13, 0);
  return [
  {
    id: "ags-demo-1",
    nomorAgenda: "001/AGS/2026",
    arah: "masuk",
    nomorSurat: "470/12/DS-KTS/XI/2026",
    pihak: "Desa Katis",
    perihal: "Permohonan rekomendasi bantuan sosial",
    tanggal: t1,
    disposisi: "Camat",
    status: "baru",
    createdAt: seedRecordedAt(now, t1, 5 * 60_000),
  },
  {
    id: "ags-demo-2",
    nomorAgenda: "002/AGS/2026",
    arah: "masuk",
    nomorSurat: "421/88/Dindik/XI/2026",
    pihak: "Dinas Pendidikan Kab. Bangka Tengah",
    perihal: "Undangan sosialisasi BOS 2026",
    tanggal: t2,
    disposisi: "Sekretaris",
    status: "diproses",
    createdAt: seedRecordedAt(now, t2, 15 * 60_000),
  },
  {
    id: "ags-demo-3",
    nomorAgenda: "003/AGS/2026",
    arah: "keluar",
    nomorSurat: "470/45/Kec-Simp/XI/2026",
    pihak: "Desa Terak",
    perihal: "Balasan permohonan data penduduk",
    tanggal: t3,
    disposisi: "Arsip",
    status: "selesai",
    createdAt: seedRecordedAt(now, t3, 10 * 60_000),
  },
  {
    id: "ags-demo-4",
    nomorAgenda: "004/AGS/2026",
    arah: "keluar",
    nomorSurat: "005/Kec-Simp/XI/2026",
    pihak: "Bupati Bangka Tengah",
    perihal: "Laporan bulanan Kecamatan Oktober 2026",
    tanggal: t4,
    disposisi: "Arsip",
    status: "selesai",
    createdAt: seedRecordedAt(now, t4, 20 * 60_000),
  },
  ];
}

export interface AgendaStats {
  total: number;
  masuk: number;
  keluar: number;
  belum: number; // baru + diproses (still needs follow-up)
}

export function computeAgendaStats(items: AgendaEntry[]): AgendaStats {
  let masuk = 0;
  let keluar = 0;
  let belum = 0;
  for (const e of items) {
    if (e.arah === "masuk") masuk += 1;
    else keluar += 1;
    if (e.status !== "selesai") belum += 1;
  }
  return { total: items.length, masuk, keluar, belum };
}

export function filterAgenda(
  items: AgendaEntry[],
  arah: AgendaArah | "",
  status: AgendaStatus | "",
  query = "",
): AgendaEntry[] {
  const q = query.trim().toLowerCase();
  const sorted = [...items].sort((a, b) => b.tanggal - a.tanggal);
  return sorted.filter(
    (e) =>
      (!arah || e.arah === arah) &&
      (!status || e.status === status) &&
      (!q ||
        e.perihal.toLowerCase().includes(q) ||
        e.pihak.toLowerCase().includes(q) ||
        e.nomorAgenda.toLowerCase().includes(q) ||
        e.nomorSurat.toLowerCase().includes(q)),
  );
}

/** Next agenda number for a year: max sequence + 1, zero-padded to 3. */
export function nextNomorAgenda(items: AgendaEntry[], year: number): string {
  let max = 0;
  for (const e of items) {
    const m = /^(\d+)\/AGS\/(\d{4})$/.exec(e.nomorAgenda);
    if (m && Number(m[2]) === year) max = Math.max(max, Number(m[1]));
  }
  return `${String(max + 1).padStart(3, "0")}/AGS/${year}`;
}

export interface NewAgendaInput {
  arah: AgendaArah;
  nomorSurat: string;
  pihak: string;
  perihal: string;
  tanggal: number;
  disposisi: string;
}

export function createAgendaEntry(
  items: AgendaEntry[],
  input: NewAgendaInput,
): AgendaEntry {
  const year = new Date(input.tanggal).getFullYear();
  return {
    id: `ags-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nomorAgenda: nextNomorAgenda(items, year),
    arah: input.arah,
    nomorSurat: input.nomorSurat.trim(),
    pihak: input.pihak.trim(),
    perihal: input.perihal.trim(),
    tanggal: input.tanggal,
    disposisi: input.disposisi,
    status: input.arah === "masuk" ? "baru" : "selesai",
    createdAt: Date.now(),
  };
}

// ---------- storage (localStorage first, same pattern as pengaduan) ----------

const ITEMS_KEY = "desaai-agenda-v1";
const META_KEY = "desaai-agenda-meta-v1";

let memoryItems: AgendaEntry[] | null = null;
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

/** Demo contoh yang sudah lebih dari 6 hari tidak segar lagi (Paket 47)
 * — lihat penjelasan di pengaduan.ts. HANYA bila semua rekaman masih
 * data contoh; tanggal terbaru yang diperiksa adalah tanggal surat. */
const DEMO_STALE_DAYS = 6;

function demoSeedIsStale(items: AgendaEntry[]): boolean {
  if (items.length === 0) return false;
  if (!items.every((e) => isAgendaDemoRecord(e))) return false;
  const newest = Math.max(...items.map((e) => e.tanggal));
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - DEMO_STALE_DAYS,
  ).getTime();
  return newest < cutoff;
}

/** Load agenda entries; on first run seeds the 4 demo entries. */
export function loadAgenda(): AgendaEntry[] {
  if (memoryItems) return [...memoryItems];
  let items: AgendaEntry[] = [];
  let seeded = false;
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AgendaEntry[];
      if (Array.isArray(parsed)) items = parsed;
    }
    seeded = readMeta().seeded;
    if (items.length === 0 && !seeded) {
      items = buildAgendaSeed();
      seeded = true;
      saveAgenda(items);
      writeMeta(true);
    }
  } catch {
    items = buildAgendaSeed();
    seeded = true;
  }
  // Paket 47 — data contoh lama disegarkan tanggalnya.
  if (demoSeedIsStale(items)) {
    items = buildAgendaSeed();
    saveAgenda(items);
  }
  memoryItems = items;
  memoryDemo = seeded && items.every((e) => e.id.startsWith("ags-demo-"));
  return [...items];
}

export function saveAgenda(items: AgendaEntry[]): void {
  memoryItems = [...items];
  memoryDemo = items.length > 0 && items.every((e) => e.id.startsWith("ags-demo-"));
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    writeMeta(true);
  } catch {
    // Storage unavailable — in-memory state still works.
  }
}

/** True when the current list is still exactly the demo seed. */
export function isAgendaDemoData(): boolean {
  if (!memoryItems) loadAgenda();
  return memoryDemo;
}

export function isAgendaDemoRecord(e: AgendaEntry): boolean {
  return e.id.startsWith("ags-demo-");
}

// Paket 12 — mirror the local register to Firestore (best-effort, never
// blocks the UI). Same pattern as syncIkmToFirestore: local data is the
// source of truth, the cloud copy just follows when the network is back.
export async function syncAgendaToFirestore(
  svc: FirebaseServices,
  items: AgendaEntry[],
): Promise<void> {
  if (svc.status !== "ready" || !svc.db || !svc.uid) return;
  try {
    await setDoc(doc(svc.db, "users", svc.uid, "agenda", "rekap"), {
      items,
      updatedAt: serverTimestamp(),
      demo: isAgendaDemoData(),
    });
    markFirestoreSync();
  } catch (e) {
    console.warn("DesaAI: Firestore agenda sync failed (local data kept).", e);
  }
}
