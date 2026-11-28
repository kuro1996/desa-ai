// DesaAI — Paket 34 Ide 3: Anin pengingat.
// Pure logic only (no DOM, no server): computes reminders from the
// app's own local data — mail-register entries due soon / overdue and
// complaints (Baru/Diproses) left untouched for more than 3 days.
// Every number comes from real data; an empty result means "no reminders".
import type { AgendaEntry } from "./agenda";
import type { Aduan } from "./pengaduan";

export type ReminderKind =
  | "agenda-besok"
  | "agenda-dekat"
  | "agenda-lewat"
  | "aduan-lama";

export interface Reminder {
  kind: ReminderKind;
  /** Subject (agenda perihal) or complaint type. */
  title: string;
  /** Counterparty (agenda pihak) or reporter name. */
  detail: string;
  /** Days until the agenda date (negative = overdue) or days waiting. */
  days: number;
  tab: "agenda" | "pengaduan";
}

export interface ReminderSummary {
  items: Reminder[];
  agendaBesok: number;
  agendaDekat: number;
  agendaLewat: number;
  aduanLama: number;
  total: number;
}

const DAY_MS = 86_400_000;
const ADUAN_STALE_DAYS = 3;
const AGENDA_SOON_DAYS = 3;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Reminders for `now`. Agenda entries still open (Baru/Diproses):
 * tomorrow → agenda-besok, within 3 days → agenda-dekat, past date →
 * agenda-lewat. Complaints still open and older than 3 days →
 * aduan-lama. Most urgent first (overdue agenda, then oldest complaints,
 * then tomorrow, then soon). Items are capped at 8 for display; the
 * counts always cover everything.
 */
export function computeReminders(
  now: Date,
  agenda: AgendaEntry[],
  aduan: Aduan[],
): ReminderSummary {
  const today = startOfDay(now);
  const items: Reminder[] = [];
  let agendaBesok = 0;
  let agendaDekat = 0;
  let agendaLewat = 0;
  for (const e of agenda) {
    if (e.status === "selesai") continue;
    const diff = Math.round((startOfDay(new Date(e.tanggal)) - today) / DAY_MS);
    if (diff < 0) {
      agendaLewat += 1;
      items.push({
        kind: "agenda-lewat",
        title: e.perihal,
        detail: e.pihak,
        days: -diff,
        tab: "agenda",
      });
    } else if (diff === 1) {
      agendaBesok += 1;
      items.push({
        kind: "agenda-besok",
        title: e.perihal,
        detail: e.pihak,
        days: 1,
        tab: "agenda",
      });
    } else if (diff <= AGENDA_SOON_DAYS) {
      agendaDekat += 1;
      items.push({
        kind: "agenda-dekat",
        title: e.perihal,
        detail: e.pihak,
        days: diff,
        tab: "agenda",
      });
    }
  }
  let aduanLama = 0;
  for (const a of aduan) {
    if (a.status === "selesai") continue;
    const waiting = Math.floor((now.getTime() - a.createdAt) / DAY_MS);
    if (waiting > ADUAN_STALE_DAYS) {
      aduanLama += 1;
      items.push({
        kind: "aduan-lama",
        title: a.jenis,
        detail: a.nama || "Anonim",
        days: waiting,
        tab: "pengaduan",
      });
    }
  }
  const rank: Record<ReminderKind, number> = {
    "agenda-lewat": 0,
    "aduan-lama": 1,
    "agenda-besok": 2,
    "agenda-dekat": 3,
  };
  items.sort(
    (a, b) => rank[a.kind] - rank[b.kind] || b.days - a.days,
  );
  const total = agendaBesok + agendaDekat + agendaLewat + aduanLama;
  return {
    items: items.slice(0, 8),
    agendaBesok,
    agendaDekat,
    agendaLewat,
    aduanLama,
    total,
  };
}
