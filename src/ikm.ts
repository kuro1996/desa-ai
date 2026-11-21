// DesaAI — Indeks Kepuasan Masyarakat (IKM) for letter services.
// Standard: PermenPAN-RB No. 14 Tahun 2017 — 9 service elements,
// scale 1 (Sangat Tidak Puas) to 4 (Sangat Puas).
// IKM score = mean per element x 25 (scale 25-100).
// Categories: A 88.31-100 Sangat Baik; B 76.61-88.30 Baik;
// C 65.00-76.60 Kurang Baik; D 25.00-64.99 Tidak Baik.
// Responses are stored locally (localStorage); when Firebase is ready a
// copy is mirrored to Firestore (best-effort, never blocks the UI).
// No login, no credentials in this module.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseServices } from "./firebase";
import { markFirestoreSync } from "./firebase";

export interface IkmElement {
  id: string;
  labelId: string;
  labelEn: string;
}

export const IKM_ELEMENTS: IkmElement[] = [
  { id: "persyaratan", labelId: "Persyaratan", labelEn: "Requirements" },
  { id: "prosedur", labelId: "Prosedur", labelEn: "Procedures" },
  { id: "waktu", labelId: "Waktu Pelayanan", labelEn: "Service time" },
  { id: "biaya", labelId: "Biaya/Tarif", labelEn: "Fees / tariffs" },
  {
    id: "produk",
    labelId: "Produk Spesifikasi Jenis Pelayanan",
    labelEn: "Service product specifications",
  },
  { id: "kompetensi", labelId: "Kompetensi Pelaksana", labelEn: "Staff competence" },
  { id: "perilaku", labelId: "Perilaku Pelaksana", labelEn: "Staff behavior" },
  {
    id: "pengaduan",
    labelId: "Penanganan Pengaduan, Saran dan Masukan",
    labelEn: "Complaint handling",
  },
  { id: "sarana", labelId: "Sarana dan Prasarana", labelEn: "Facilities & infrastructure" },
];

export interface IkmResponse {
  id: string;
  nama: string; // "" = anonymous
  jenisSurat: string; // letter template id
  scores: number[]; // 9 values, 1-4, in IKM_ELEMENTS order
  komentar: string;
  createdAt: number; // epoch ms
}

// 12 SAMPLE responses (scores are a mix of 3 and 4 only — never all 4).
// Mean = 390 / (12 x 9) = 3.611 -> IKM 90.28, category A.
export const IKM_SEED: IkmResponse[] = [
  { id: "ikm-demo-1", nama: "Sari Wulandari", jenisSurat: "pengantar", scores: [4, 4, 3, 4, 3, 4, 4, 3, 3], komentar: "Pelayanan cepat, mohon ruang tunggu ditambah kursi.", createdAt: Date.UTC(2026, 10, 3, 9, 12) },
  { id: "ikm-demo-2", nama: "", jenisSurat: "keterangan", scores: [3, 4, 4, 3, 4, 3, 4, 4, 3], komentar: "", createdAt: Date.UTC(2026, 10, 4, 10, 5) },
  { id: "ikm-demo-3", nama: "Joko Santoso", jenisSurat: "undangan", scores: [4, 3, 4, 4, 3, 4, 3, 4, 3], komentar: "", createdAt: Date.UTC(2026, 10, 5, 13, 40) },
  { id: "ikm-demo-4", nama: "", jenisSurat: "surat-dinas", scores: [3, 4, 3, 4, 4, 3, 4, 3, 4], komentar: "Petugas ramah dan menjelaskan syarat dengan jelas.", createdAt: Date.UTC(2026, 10, 6, 8, 55) },
  { id: "ikm-demo-5", nama: "Maya Putri", jenisSurat: "sk-pengangkatan", scores: [4, 4, 4, 3, 3, 4, 4, 3, 3], komentar: "", createdAt: Date.UTC(2026, 10, 9, 11, 20) },
  { id: "ikm-demo-6", nama: "", jenisSurat: "pengantar", scores: [3, 3, 4, 4, 4, 4, 3, 4, 3], komentar: "", createdAt: Date.UTC(2026, 10, 10, 14, 2) },
  { id: "ikm-demo-7", nama: "Andi Firmansyah", jenisSurat: "keterangan", scores: [4, 4, 4, 4, 4, 4, 3, 3, 3], komentar: "Sudah bagus, dipertahankan.", createdAt: Date.UTC(2026, 10, 11, 9, 47) },
  { id: "ikm-demo-8", nama: "", jenisSurat: "sk", scores: [4, 3, 4, 4, 4, 4, 4, 3, 3], komentar: "", createdAt: Date.UTC(2026, 10, 12, 15, 18) },
  { id: "ikm-demo-9", nama: "Rina Marlina", jenisSurat: "undangan", scores: [3, 4, 4, 4, 4, 3, 4, 4, 3], komentar: "", createdAt: Date.UTC(2026, 10, 13, 10, 31) },
  { id: "ikm-demo-10", nama: "", jenisSurat: "pengantar", scores: [4, 4, 3, 4, 4, 4, 3, 4, 3], komentar: "", createdAt: Date.UTC(2026, 10, 16, 12, 8) },
  { id: "ikm-demo-11", nama: "Dedi Supriadi", jenisSurat: "keterangan", scores: [4, 4, 4, 3, 4, 4, 4, 3, 3], komentar: "Sarana parkir perlu diperluas.", createdAt: Date.UTC(2026, 10, 17, 9, 26) },
  { id: "ikm-demo-12", nama: "", jenisSurat: "surat-dinas", scores: [3, 4, 4, 4, 4, 4, 4, 3, 3], komentar: "", createdAt: Date.UTC(2026, 10, 18, 16, 44) },
];

export type IkmCategory = "A" | "B" | "C" | "D";

export function ikmCategory(score: number): IkmCategory {
  if (score >= 88.31) return "A";
  if (score >= 76.61) return "B";
  if (score >= 65) return "C";
  return "D";
}

export interface IkmStats {
  count: number;
  perElement: number[]; // mean 1-4 per element (0 when no responses)
  overall: number; // 25-100 (0 when no responses)
  category: IkmCategory;
  minIdx: number; // index of the lowest-scoring element
  maxIdx: number; // index of the highest-scoring element
}

export function computeIkm(items: IkmResponse[]): IkmStats {
  const perElement: number[] = IKM_ELEMENTS.map((_, i) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, r) => acc + (r.scores[i] ?? 0), 0);
    return sum / items.length;
  });
  const mean =
    perElement.length === 0 ? 0 : perElement.reduce((a, b) => a + b, 0) / perElement.length;
  const overall = items.length === 0 ? 0 : mean * 25;
  let minIdx = 0;
  let maxIdx = 0;
  perElement.forEach((v, i) => {
    if (v < perElement[minIdx]) minIdx = i;
    if (v > perElement[maxIdx]) maxIdx = i;
  });
  return {
    count: items.length,
    perElement,
    overall,
    category: ikmCategory(overall),
    minIdx,
    maxIdx,
  };
}

// ---------- storage (localStorage first, Firestore mirror best-effort) ----------

const ITEMS_KEY = "desaai-ikm-v1";
const META_KEY = "desaai-ikm-meta-v1";

let memoryItems: IkmResponse[] | null = null;
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

/** Load responses; on first run seeds the 12 demo responses. */
export function loadIkm(): IkmResponse[] {
  if (memoryItems) return [...memoryItems];
  let items: IkmResponse[] = [];
  let seeded = false;
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as IkmResponse[];
      if (Array.isArray(parsed)) items = parsed;
    }
    seeded = readMeta().seeded;
    if (items.length === 0 && !seeded) {
      items = IKM_SEED.map((r) => ({ ...r, scores: [...r.scores] }));
      seeded = true;
      saveIkm(items);
      writeMeta(true);
    }
  } catch {
    items = IKM_SEED.map((r) => ({ ...r, scores: [...r.scores] }));
    seeded = true;
  }
  memoryItems = items;
  memoryDemo = seeded && items.every((r) => r.id.startsWith("ikm-demo-"));
  return [...items];
}

export function saveIkm(items: IkmResponse[]): void {
  memoryItems = [...items];
  memoryDemo = items.length > 0 && items.every((r) => r.id.startsWith("ikm-demo-"));
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    writeMeta(true);
  } catch {
    // Storage unavailable — in-memory state still works.
  }
}

/** True when the current list is still exactly the demo seed. */
export function isIkmDemoData(): boolean {
  if (!memoryItems) loadIkm();
  return memoryDemo;
}

export function isIkmDemoRecord(r: IkmResponse): boolean {
  return r.id.startsWith("ikm-demo-");
}

// ---------- share texts ----------

export function ikmShareSurveyText(appUrl: string): string {
  return [
    "Survei Kepuasan Masyarakat (IKM) — Pelayanan Surat, Kecamatan Simpangkatis",
    "",
    "Bantu kami meningkatkan pelayanan: isi survei singkat (9 pertanyaan, ±2 menit) di sini:",
    appUrl,
    "",
    "Buka tab “Kepuasan (IKM)” di aplikasi DesaAI. Terima kasih atas penilaian Anda!",
  ].join("\n");
}

export function ikmShareResultsText(stats: IkmStats, appUrl: string): string {
  const catLabel: Record<IkmCategory, string> = {
    A: "A — Sangat Baik",
    B: "B — Baik",
    C: "C — Kurang Baik",
    D: "D — Tidak Baik",
  };
  const fmt = (v: number): string => v.toFixed(2).replace(".", ",");
  return [
    "Hasil Indeks Kepuasan Masyarakat (IKM) — Pelayanan Surat, Kecamatan Simpangkatis",
    "",
    `Skor IKM: ${fmt(stats.overall)} (Kategori ${catLabel[stats.category]})`,
    `Responden: ${stats.count} orang`,
    `Unsur tertinggi: ${IKM_ELEMENTS[stats.maxIdx].labelId} (${fmt(stats.perElement[stats.maxIdx])})`,
    `Unsur terendah: ${IKM_ELEMENTS[stats.minIdx].labelId} (${fmt(stats.perElement[stats.minIdx])})`,
    "",
    `Lihat detail dan isi survei: ${appUrl}`,
  ].join("\n");
}

// ---------- Firestore (best-effort mirror, never blocks UI) ----------

export async function syncIkmToFirestore(
  svc: FirebaseServices,
  items: IkmResponse[],
): Promise<void> {
  if (svc.status !== "ready" || !svc.db || !svc.uid) return;
  try {
    await setDoc(doc(svc.db, "users", svc.uid, "ikm", "rekap"), {
      items,
      updatedAt: serverTimestamp(),
      demo: isIkmDemoData(),
    });
    markFirestoreSync();
  } catch (e) {
    console.warn("DesaAI: Firestore IKM sync failed (local data kept).", e);
  }
}
