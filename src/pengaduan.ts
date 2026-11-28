// DesaAI — Pengaduan pelayanan surat (Kecamatan Simpangkatis).
// Reports can be anonymous. The office tracks each report from
// Baru (new) -> Diproses (in progress) -> Selesai (done).
// Stored locally (localStorage); when Firebase is ready a copy is
// mirrored to Firestore (best-effort, never blocks the UI).
// No login, no credentials in this module.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseServices } from "./firebase";
import { markFirestoreSync } from "./firebase";

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
  /** Nomor tiket lacak, mis. "ADU-2026-0001" (Paket 34, Ide 5). */
  ticket?: string;
  nama: string; // "" = anonymous
  jenis: string; // one of ADUAN_JENIS
  jenisSurat: string; // letter template id
  isi: string;
  kontak: string; // "" = not given
  status: AduanStatus;
  createdAt: number; // epoch ms
  /** Riwayat perubahan status (Paket 34, Ide 5 — linimasa lacak).
   * Entri pertama selalu { status: "baru", at: createdAt }. */
  riwayat?: Array<{ status: AduanStatus; at: number }>;
}

/** Nomor tiket berikutnya untuk tahun berjalan: ADU-YYYY-NNNN. */
export function nextTicket(items: Aduan[], year = new Date().getFullYear()): string {
  let max = 0;
  for (const a of items) {
    const m = /^ADU-(\d{4})-(\d+)$/.exec(a.ticket ?? "");
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `ADU-${year}-${String(max + 1).padStart(4, "0")}`;
}

/** Linimasa status untuk dilacak warga/petugas: Baru → Diproses → Selesai,
 * dengan tanggal tiap langkah. Data lama tanpa riwayat tetap menampilkan
 * langkah Baru dari createdAt. */
export function aduTimeline(a: Aduan): Array<{ status: AduanStatus; at: number | null }> {
  const steps: Array<{ status: AduanStatus; at: number | null }> = [
    { status: "baru", at: a.createdAt },
  ];
  for (const r of a.riwayat ?? []) {
    const last = steps[steps.length - 1];
    if (last && last.status === r.status) continue;
    steps.push({ status: r.status, at: r.at });
  }
  // Paket 46 — status saat ini selalu tampil, walau riwayat perubahan
  // statusnya tidak tercatat (data contoh lama): tanggalnya null — bukan
  // tanggal karangan — dan perender menampilkannya tanpa tanggal.
  const lastStep = steps[steps.length - 1];
  if (lastStep && lastStep.status !== a.status) {
    steps.push({ status: a.status, at: null });
  }
  return steps;
}

/** Tanggal contoh relatif terhadap hari ini (Paket 47): data contoh
 * tidak boleh membusuk. `days` negatif = hari lalu, positif = hari
 * depan; jam/menit mengikuti jam contoh aslinya. */
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

/** "Dicatat pada" tidak boleh berada di masa depan: pengaduan tidak
 * bisa diajukan setelah sekarang (Paket 47 — jam contoh 13:55 bisa
 * jatuh setelah jam buka aplikasi bila tes berjalan pagi hari UTC,
 * sehingga urutan daftar berubah dan pengaduan baru tidak lagi
 * tampil paling atas). */
function seedCreatedAt(now: Date, days: number, hour: number, minute: number): number {
  return Math.min(seedDate(now, days, hour, minute), now.getTime() - 60_000);
}

// 6 SAMPLE complaints (mixed statuses: 3 baru, 2 diproses, 1 selesai).
// Paket 47 — tanggalnya RELATIF terhadap hari penyemaian (dulu tetap
// 10–19 Nov 2026, sehingga begitu November lewat, semua contoh sudah
// menunggu >3 hari dan Radar Tenggat menampilkan semuanya "lewat
// tenggat"). Offset hari: demo-1 -1, demo-2 -2, demo-3 -5, demo-4 -8,
// demo-5 -10, demo-6 0 — campuran jujur: 2 pengaduan lama (masuk radar
// sebagai lewat tenggat) + sisanya belum masuk radar.
export function buildAduanSeed(now = new Date()): Aduan[] {
  return [
  {
    id: "adu-demo-1",
    // Paket 46 — tiket lacak diisi pada data contoh supaya warga bisa
    // mencoba Lacak Status Surat langsung (ADU-2026-0001..0006).
    ticket: "ADU-2026-0001",
    nama: "",
    jenis: "Keterlambatan",
    jenisSurat: "pengantar",
    isi: "Surat pengantar KTP sudah tiga hari belum selesai, padahal dijanjikan satu hari.",
    kontak: "0812-3456-8001",
    status: "baru",
    createdAt: seedCreatedAt(now, -1, 9, 5),
  },
  {
    id: "adu-demo-2",
    ticket: "ADU-2026-0002",
    nama: "Warga Katis",
    jenis: "Persyaratan tidak jelas",
    jenisSurat: "keterangan",
    isi: "Syarat surat keterangan domisili berbeda-beda tiap kali ditanyakan, mohon daftar syarat dipasang di papan pengumuman.",
    kontak: "",
    status: "baru",
    createdAt: seedCreatedAt(now, -2, 11, 30),
  },
  {
    id: "adu-demo-3",
    ticket: "ADU-2026-0003",
    nama: "",
    jenis: "Pelayanan kurang ramah",
    jenisSurat: "surat-dinas",
    isi: "Petugas di loket menjawab dengan nada tinggi saat ditanya prosedur.",
    kontak: "0812-3456-8002",
    status: "diproses",
    createdAt: seedCreatedAt(now, -5, 14, 12),
  },
  {
    id: "adu-demo-4",
    ticket: "ADU-2026-0004",
    nama: "Sinta",
    jenis: "Biaya tidak sesuai",
    jenisSurat: "sk",
    isi: "Diminta biaya administrasi padahal di papan informasi tertulis gratis.",
    kontak: "",
    status: "diproses",
    createdAt: seedCreatedAt(now, -8, 10, 45),
  },
  {
    id: "adu-demo-5",
    ticket: "ADU-2026-0005",
    nama: "",
    jenis: "Lainnya",
    jenisSurat: "undangan",
    isi: "Ruang tunggu sempit dan panas, mohon ditambah kipas angin.",
    kontak: "",
    status: "selesai",
    createdAt: seedCreatedAt(now, -10, 8, 20),
  },
  {
    id: "adu-demo-6",
    ticket: "ADU-2026-0006",
    nama: "Bapak RT 03",
    jenis: "Keterlambatan",
    jenisSurat: "keterangan",
    isi: "Undangan musyawarah diterima H-1 sehingga banyak warga tidak sempat hadir.",
    kontak: "0812-3456-8003",
    status: "baru",
    createdAt: seedCreatedAt(now, 0, 13, 55),
  },
  ];
}

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
  query = "",
): Aduan[] {
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const q = query.trim().toLowerCase();
  return sorted.filter(
    (a) =>
      (!status || a.status === status) &&
      (!jenis || a.jenis === jenis) &&
      (!q ||
        (a.ticket ?? "").toLowerCase().includes(q) ||
        a.nama.toLowerCase().includes(q) ||
        a.isi.toLowerCase().includes(q)),
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

/** Demo contoh yang sudah lebih dari 6 hari tidak segar lagi (Paket 47):
 * perbarui tanggalnya supaya radar + laporan bulanan tetap hidup di
 * perangkat yang sudah lama memasang data contoh. HANYA bila semua
 * rekaman masih data contoh — data petugas tidak pernah disentuh. */
const DEMO_STALE_DAYS = 6;

function demoSeedIsStale(items: Aduan[]): boolean {
  if (items.length === 0) return false;
  if (!items.every((a) => isAduanDemoRecord(a))) return false;
  const newest = Math.max(...items.map((a) => a.createdAt));
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - DEMO_STALE_DAYS,
  ).getTime();
  return newest < cutoff;
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
      items = buildAduanSeed();
      seeded = true;
      saveAduan(items);
      writeMeta(true);
    }
  } catch {
    items = buildAduanSeed();
    seeded = true;
  }
  // Paket 47 — data contoh lama (mis. November) disegarkan tanggalnya
  // supaya radar tidak menampilkan semuanya "lewat tenggat".
  if (demoSeedIsStale(items)) {
    items = buildAduanSeed();
    saveAduan(items);
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
    markFirestoreSync();
  } catch (e) {
    console.warn("DesaAI: Firestore pengaduan sync failed (local data kept).", e);
  }
}
