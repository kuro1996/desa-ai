// DesaAI — Pengaduan pelayanan surat (Kecamatan Simpangkatis).
// Reports can be anonymous. The office tracks each report from
// Baru (new) -> Diproses (in progress) -> Selesai (done).
// Stored locally (localStorage); when Firebase is ready a copy is
// mirrored to Firestore (best-effort, never blocks the UI).
// No login, no credentials in this module.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseServices } from "./firebase";

export type AduanStatus = "baru" | "diproses" | "selesai";

export const ADUAN_JENIS = [
  "Keterlambatan",
  "Persyaratan tidak jelas",
  "Pelayanan kurang ramah",
  "Biaya tidak sesuai",
  "Lainnya",
];

export interface Aduan {
  id: string;
  nama: string; // "" = anonymous
  jenis: string; // one of ADUAN_JENIS
  jenisSurat: string; // letter template id
  isi: string;
  kontak: string; // "" = not given
  status: AduanStatus;
  createdAt: number; // epoch ms
}

// 6 SAMPLE complaints (mixed statuses: 3 baru, 2 diproses, 1 selesai).
export const ADUAN_SEED: Aduan[] = [
  {
    id: "adu-demo-1",
    nama: "",
    jenis: "Keterlambatan",
    jenisSurat: "pengantar",
    isi: "Surat pengantar KTP sudah tiga hari belum selesai, padahal dijanjikan satu hari.",
    kontak: "0812-3456-8001",
    status: "baru",
    createdAt: Date.UTC(2026, 10, 17, 9, 5),
  },
  {
    id: "adu-demo-2",
    nama: "Warga Katis",
    jenis: "Persyaratan tidak jelas",
    jenisSurat: "keterangan",
    isi: "Syarat surat keterangan domisili berbeda-beda tiap kali ditanyakan, mohon daftar syarat dipasang di papan pengumuman.",
    kontak: "",
    status: "baru",
    createdAt: Date.UTC(2026, 10, 18, 11, 30),
  },
  {
    id: "adu-demo-3",
    nama: "",
    jenis: "Pelayanan kurang ramah",
    jenisSurat: "surat-dinas",
    isi: "Petugas di loket menjawab dengan nada tinggi saat ditanya prosedur.",
    kontak: "0812-3456-8002",
    status: "diproses",
    createdAt: Date.UTC(2026, 10, 15, 14, 12),
  },
  {
    id: "adu-demo-4",
    nama: "Sinta",
    jenis: "Biaya tidak sesuai",
    jenisSurat: "sk",
    isi: "Diminta biaya administrasi padahal di papan informasi tertulis gratis.",
    kontak: "",
    status: "diproses",
    createdAt: Date.UTC(2026, 10, 14, 10, 45),
  },
  {
    id: "adu-demo-5",
    nama: "",
    jenis: "Lainnya",
    jenisSurat: "undangan",
    isi: "Ruang tunggu sempit dan panas, mohon ditambah kipas angin.",
    kontak: "",
    status: "selesai",
    createdAt: Date.UTC(2026, 10, 10, 8, 20),
  },
  {
    id: "adu-demo-6",
    nama: "Bapak RT 03",
    jenis: "Keterlambatan",
    jenisSurat: "keterangan",
    isi: "Undangan musyawarah diterima H-1 sehingga banyak warga tidak sempat hadir.",
    kontak: "0812-3456-8003",
    status: "baru",
    createdAt: Date.UTC(2026, 10, 19, 13, 55),
  },
];

export interface AduanStats {
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
}

export function computeAduanStats(items: Aduan[]): AduanStats {
  let baru = 0;
  let diproses = 0;
  let selesai = 0;
  for (const a of items) {
    if (a.status === "baru") baru += 1;
    else if (a.status === "diproses") diproses += 1;
    else selesai += 1;
  }
  return { total: items.length, baru, diproses, selesai };
}

export function filterAduan(
  items: Aduan[],
  status: AduanStatus | "",
  jenis = "",
): Aduan[] {
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  return sorted.filter(
    (a) => (!status || a.status === status) && (!jenis || a.jenis === jenis),
  );
}

// ---------- storage (localStorage first, Firestore mirror best-effort) ----------

const ITEMS_KEY = "desaai-pengaduan-v1";
const META_KEY = "desaai-pengaduan-meta-v1";

let memoryItems: Aduan[] | null = null;
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

/** Load complaints; on first run seeds the 6 demo complaints. */
export function loadAduan(): Aduan[] {
  if (memoryItems) return [...memoryItems];
  let items: Aduan[] = [];
  let seeded = false;
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Aduan[];
      if (Array.isArray(parsed)) items = parsed;
    }
    seeded = readMeta().seeded;
    if (items.length === 0 && !seeded) {
      items = ADUAN_SEED.map((a) => ({ ...a }));
      seeded = true;
      saveAduan(items);
      writeMeta(true);
    }
  } catch {
    items = ADUAN_SEED.map((a) => ({ ...a }));
    seeded = true;
  }
  memoryItems = items;
  memoryDemo = seeded && items.every((a) => a.id.startsWith("adu-demo-"));
  return [...items];
}

export function saveAduan(items: Aduan[]): void {
  memoryItems = [...items];
  memoryDemo = items.length > 0 && items.every((a) => a.id.startsWith("adu-demo-"));
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    writeMeta(true);
  } catch {
    // Storage unavailable — in-memory state still works.
  }
}

/** True when the current list is still exactly the demo seed. */
export function isAduanDemoData(): boolean {
  if (!memoryItems) loadAduan();
  return memoryDemo;
}

export function isAduanDemoRecord(a: Aduan): boolean {
  return a.id.startsWith("adu-demo-");
}

// ---------- Firestore (best-effort mirror, never blocks UI) ----------

export async function syncAduanToFirestore(
  svc: FirebaseServices,
  items: Aduan[],
): Promise<void> {
  if (svc.status !== "ready" || !svc.db || !svc.uid) return;
  try {
    await setDoc(doc(svc.db, "users", svc.uid, "pengaduan", "rekap"), {
      items,
      updatedAt: serverTimestamp(),
      demo: isAduanDemoData(),
    });
  } catch (e) {
    console.warn("DesaAI: Firestore pengaduan sync failed (local data kept).", e);
  }
}
