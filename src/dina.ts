// DesaAI — Dina, the office guide (Paket 27). Pure logic only; all
// user-facing strings live in i18n.ts (keys dinaHi*, dinaTip*, dinaRot*).
// Dina is a friendly village-clerk mascot (pure inline SVG in index.html):
// warm and a little playful, but always polite — she works in a government
// office, so no ghosts, no scares, just a clear next step.
export interface DinaContext {
  aduanBaru: number;
  masaPerluPerhatian: number; // terms expired + expiring soon
  lettersToday: number;
}

export function dinaGreetingKey(
  hour: number,
): "dinaHiPagi" | "dinaHiSiang" | "dinaHiSore" | "dinaHiMalam" {
  if (hour < 11) return "dinaHiPagi";
  if (hour < 15) return "dinaHiSiang";
  if (hour < 19) return "dinaHiSore";
  return "dinaHiMalam";
}

export const DINA_ROT_KEYS = [
  "dinaRot1",
  "dinaRot2",
  "dinaRot3",
  "dinaRot4",
  "dinaRot5",
  "dinaRot6",
  "dinaRot7",
] as const;

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** One rotating tip per day — the same tip all day, a new one tomorrow. */
export function dinaRotatingTipKey(d: Date): string {
  return DINA_ROT_KEYS[dayOfYear(d) % DINA_ROT_KEYS.length];
}

export type DinaTipKind = "aduan" | "masa" | "surat" | "rotating";

/** Most urgent first: complaints, then expiring terms, then "no letters yet". */
export function dinaTipKind(ctx: DinaContext): DinaTipKind {
  if (ctx.aduanBaru > 0) return "aduan";
  if (ctx.masaPerluPerhatian > 0) return "masa";
  if (ctx.lettersToday === 0) return "surat";
  return "rotating";
}
