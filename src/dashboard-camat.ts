// DesaAI — Dashboard Pagi Camat (Paket 34, Ide 6).
// One-page morning summary for the Camat, aggregated ONLY from data the
// app already holds (agenda register, IKM responses, complaints, saved
// drafts). Pure logic, no DOM: main.ts renders the numbers. Nothing is
// invented — when a source list is empty the section reports "belum ada
// data" instead of a made-up zero dressed as a measurement.
import type { AgendaEntry } from "./agenda";
import type { IkmResponse } from "./ikm";
import type { Aduan } from "./pengaduan";
import type { Draft } from "./drafts";

export interface CamatDashboard {
  /** Surat masuk/keluar whose letter date is today. */
  masukHariIni: number;
  keluarHariIni: number;
  /** Surat masuk/keluar whose letter date falls in the current Mon–Sun week. */
  masukMingguIni: number;
  keluarMingguIni: number;
  hasAgenda: boolean;
  /** IKM mean (25–100 scale, 0 when no responses) + respondent count. */
  ikmRata: number;
  ikmResponden: number;
  hasIkm: boolean;
  /** Complaints by status. */
  aduBaru: number;
  aduDiproses: number;
  aduSelesai: number;
  hasAduan: boolean;
  /** Saved letter drafts waiting (in the archive). */
  drafMenunggu: number;
  hasDrafts: boolean;
  /** True when every source list is empty. */
  allEmpty: boolean;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Start of the current week (Monday 00:00 local time). */
export function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function buildCamatDashboard(input: {
  agenda: AgendaEntry[];
  ikm: IkmResponse[];
  aduan: Aduan[];
  drafts: Draft[];
  now?: Date;
}): CamatDashboard {
  const now = input.now ?? new Date();
  const weekStart = startOfWeek(now);
  let masukHariIni = 0;
  let keluarHariIni = 0;
  let masukMingguIni = 0;
  let keluarMingguIni = 0;
  for (const e of input.agenda) {
    const t = new Date(e.tanggal);
    const isToday = sameDay(t, now);
    const isWeek = t.getTime() >= weekStart.getTime() && t.getTime() < weekStart.getTime() + 7 * 86_400_000;
    if (e.arah === "masuk") {
      if (isToday) masukHariIni += 1;
      if (isWeek) masukMingguIni += 1;
    } else {
      if (isToday) keluarHariIni += 1;
      if (isWeek) keluarMingguIni += 1;
    }
  }
  let ikmRata = 0;
  if (input.ikm.length > 0) {
    let sum = 0;
    let n = 0;
    for (const r of input.ikm) {
      for (const s of r.scores) {
        sum += s;
        n += 1;
      }
    }
    ikmRata = n === 0 ? 0 : (sum / n) * 25;
  }
  let aduBaru = 0;
  let aduDiproses = 0;
  let aduSelesai = 0;
  for (const a of input.aduan) {
    if (a.status === "baru") aduBaru += 1;
    else if (a.status === "diproses") aduDiproses += 1;
    else aduSelesai += 1;
  }
  const drafMenunggu = input.drafts.filter((d) => d.kind === "letter").length;
  const hasAgenda = input.agenda.length > 0;
  const hasIkm = input.ikm.length > 0;
  const hasAduan = input.aduan.length > 0;
  const hasDrafts = input.drafts.length > 0;
  return {
    masukHariIni,
    keluarHariIni,
    masukMingguIni,
    keluarMingguIni,
    hasAgenda,
    ikmRata,
    ikmResponden: input.ikm.length,
    hasIkm,
    aduBaru,
    aduDiproses,
    aduSelesai,
    hasAduan,
    drafMenunggu,
    hasDrafts,
    allEmpty: !hasAgenda && !hasIkm && !hasAduan && !hasDrafts,
  };
}
