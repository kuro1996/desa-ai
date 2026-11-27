// DesaAI — Paket Adopsi Desa Lain (Paket 27). One JSON file another village
// office can download from the Home tab: the office letterhead, the 7 letter
// templates, and the 5-step adoption checklist — no office data is included
// (no letters, personnel, survey answers, or complaints). 100% offline: the
// pack is built from data already in this browser.
import { STRINGS } from "./i18n";
import { TEMPLATES } from "./templates";
import type { LetterheadSettings } from "./letterhead";

export const ADOPTION_STEP_KEYS = [
  "adopsiStep1",
  "adopsiStep2",
  "adopsiStep3",
  "adopsiStep4",
  "adopsiStep5",
] as const;

export const ADOPTION_SITE = "https://kuro1996.github.io/desa-ai/";

export interface AdoptionPack {
  app: "DesaAI";
  format: "desaai-adoption-pack";
  formatVersion: 1;
  exportedAt: string;
  site: string;
  letterhead: LetterheadSettings;
  templates: Array<{
    id: string;
    nameId: string;
    nameEn: string;
    fields: Array<{ key: string; labelId: string; labelEn: string }>;
  }>;
  checklist: Array<{ id: string; en: string }>;
  notes: { id: string; en: string };
}

export function buildAdoptionPack(
  letterhead: LetterheadSettings,
  now = new Date(),
): { filename: string; text: string; pack: AdoptionPack } {
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const pack: AdoptionPack = {
    app: "DesaAI",
    format: "desaai-adoption-pack",
    formatVersion: 1,
    exportedAt: now.toISOString(),
    site: ADOPTION_SITE,
    letterhead: { ...letterhead },
    templates: TEMPLATES.map((tpl) => ({
      id: tpl.id,
      nameId: tpl.nameId,
      nameEn: tpl.nameEn,
      fields: tpl.fields.map((f) => ({ key: f.key, labelId: f.labelId, labelEn: f.labelEn })),
    })),
    checklist: ADOPTION_STEP_KEYS.map((k) => ({
      id: STRINGS[k]?.id ?? k,
      en: STRINGS[k]?.en ?? k,
    })),
    notes: { id: STRINGS.adopsiNote?.id ?? "", en: STRINGS.adopsiNote?.en ?? "" },
  };
  return {
    filename: `desaai-paket-adopsi-${stamp}.json`,
    text: JSON.stringify(pack, null, 2),
    pack,
  };
}
