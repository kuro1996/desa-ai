// DesaAI — Anin, the office guide (Paket 27). Pure logic only; all
// user-facing strings live in i18n.ts (keys aninHi*, aninTip*, aninRot*).
// Anin is a friendly village-clerk mascot (pure inline SVG in index.html):
// warm and a little playful, but always polite — she works in a government
// office, so no ghosts, no scares, just a clear next step.
export interface AninContext {
  aduanBaru: number;
  masaPerluPerhatian: number; // terms expired + expiring soon
  lettersToday: number;
}

export function aninGreetingKey(
  hour: number,
): "aninHiPagi" | "aninHiSiang" | "aninHiSore" | "aninHiMalam" {
  if (hour < 11) return "aninHiPagi";
  if (hour < 15) return "aninHiSiang";
  if (hour < 19) return "aninHiSore";
  return "aninHiMalam";
}

export const ANIN_ROT_KEYS = [
  "aninRot1",
  "aninRot2",
  "aninRot3",
  "aninRot4",
  "aninRot5",
  "aninRot6",
  "aninRot7",
] as const;

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** One rotating tip per day — the same tip all day, a new one tomorrow. */
export function aninRotatingTipKey(d: Date): string {
  return ANIN_ROT_KEYS[dayOfYear(d) % ANIN_ROT_KEYS.length];
}

export type AninTipKind = "aduan" | "masa" | "surat" | "rotating";

/** Most urgent first: complaints, then expiring terms, then "no letters yet". */
export function aninTipKind(ctx: AninContext): AninTipKind {
  if (ctx.aduanBaru > 0) return "aduan";
  if (ctx.masaPerluPerhatian > 0) return "masa";
  if (ctx.lettersToday === 0) return "surat";
  return "rotating";
}
