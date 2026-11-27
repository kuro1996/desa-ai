// DesaAI — Anin Analis (Paket 32): trend analysis over local IKM +
// complaint data. Pure functions over already-loaded records — the caller
// (main.ts) passes loadIkm()/loadAduan() results. Aggregation happens
// ON-DEVICE: answers contain only aggregates (counts, averages, category
// names, element labels). Raw records — names, complaint texts, contacts —
// are NEVER included in any answer and NEVER sent to any AI.
import { computeIkm, IKM_ELEMENTS, type IkmResponse } from "./ikm";
import { computeAduanStats, type Aduan } from "./pengaduan";

export interface AninIkmAnalysis {
  count: number;
  overall: number; // 25-100
  category: string; // A/B/C/D
  minLabelId: string;
  minLabelEn: string;
  minMean: number; // 1-4
  maxLabelId: string;
  maxLabelEn: string;
  maxMean: number; // 1-4
}

export function analyzeIkm(items: IkmResponse[]): AninIkmAnalysis {
  const stats = computeIkm(items);
  return {
    count: stats.count,
    overall: stats.overall,
    category: stats.category,
    minLabelId: IKM_ELEMENTS[stats.minIdx].labelId,
    minLabelEn: IKM_ELEMENTS[stats.minIdx].labelEn,
    minMean: stats.perElement[stats.minIdx],
    maxLabelId: IKM_ELEMENTS[stats.maxIdx].labelId,
    maxLabelEn: IKM_ELEMENTS[stats.maxIdx].labelEn,
    maxMean: stats.perElement[stats.maxIdx],
  };
}

export interface AninAduanAnalysis {
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
  /** Complaints in the current calendar month (0 when none yet). */
  monthTotal: number;
  monthBaru: number;
  monthDiproses: number;
  monthSelesai: number;
  monthLabel: string; // e.g. "November 2026"
  /** Top category — this month when there is any, else all-time. */
  topJenis: string;
  topCount: number;
  /** "month" = top is from this month; "all" = fell back to all-time. */
  scope: "month" | "all" | "none";
}

function inMonth(ts: number, now: Date): boolean {
  const d = new Date(ts);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function topJenisOf(items: Aduan[]): { jenis: string; count: number } {
  const byJenis = new Map<string, number>();
  for (const a of items) byJenis.set(a.jenis, (byJenis.get(a.jenis) ?? 0) + 1);
  let top = { jenis: "", count: 0 };
  for (const [jenis, count] of byJenis) {
    if (count > top.count) top = { jenis, count };
  }
  return top;
}

export function analyzeAduan(items: Aduan[], now: Date): AninAduanAnalysis {
  const stats = computeAduanStats(items);
  const monthItems = items.filter((a) => inMonth(a.createdAt, now));
  const monthStats = computeAduanStats(monthItems);
  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  if (items.length === 0) {
    return {
      total: 0, baru: 0, diproses: 0, selesai: 0,
      monthTotal: 0, monthBaru: 0, monthDiproses: 0, monthSelesai: 0,
      monthLabel, topJenis: "", topCount: 0, scope: "none",
    };
  }
  if (monthItems.length > 0) {
    const top = topJenisOf(monthItems);
    return {
      ...stats,
      monthTotal: monthItems.length,
      monthBaru: monthStats.baru, monthDiproses: monthStats.diproses, monthSelesai: monthStats.selesai,
      monthLabel,
      topJenis: top.jenis, topCount: top.count, scope: "month",
    };
  }
  const top = topJenisOf(items);
  return {
    ...stats,
    monthTotal: 0, monthBaru: 0, monthDiproses: 0, monthSelesai: 0,
    monthLabel,
    topJenis: top.jenis, topCount: top.count, scope: "all",
  };
}

/** i18n key for the improvement suggestion of one IKM element. */
export function saranUnsurKey(elementId: string): string {
  const map: Record<string, string> = {
    persyaratan: "aninSaranPersyaratan",
    prosedur: "aninSaranProsedur",
    waktu: "aninSaranWaktu",
    biaya: "aninSaranBiaya",
    produk: "aninSaranProduk",
    kompetensi: "aninSaranKompetensi",
    perilaku: "aninSaranPerilaku",
    pengaduan: "aninSaranPenanganan",
    sarana: "aninSaranSarana",
  };
  return map[elementId] ?? "aninSaranSarana";
}

/** i18n key for the improvement suggestion of one complaint category. */
export function saranJenisKey(jenis: string): string {
  const map: Record<string, string> = {
    Keterlambatan: "aninSaranLambat",
    "Persyaratan tidak jelas": "aninSaranSyarat",
    "Pelayanan kurang ramah": "aninSaranRamah",
    "Biaya tidak sesuai": "aninSaranBiayaAduan",
    Lainnya: "aninSaranLainnya",
  };
  return map[jenis] ?? "aninSaranLainnya";
}

/** Element id of the lowest-scoring IKM element (for the suggestion lookup). */
export function lowestElementId(items: IkmResponse[]): string {
  const stats = computeIkm(items);
  return IKM_ELEMENTS[stats.minIdx].id;
}
