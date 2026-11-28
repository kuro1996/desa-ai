// DesaAI — Paket 34 Ide 1: Anin belajar dari arsip.
// Pure logic only (no DOM, no Firebase): reads the local draft archive
// (listLocalDrafts) and suggests the next letter number + the format
// previously used for a letter type. Never invents: an empty archive
// returns null, and a letter type with no archived letter returns null.
import type { Draft } from "./drafts";
import { TEMPLATES } from "./templates";

/** One letter number found in a draft, split into its sequence + pattern. */
export interface ParsedLetterNumber {
  raw: string;
  seq: number;
  seqWidth: number;
  /** Pattern with the sequence replaced by "#", e.g. "140/#/DS/XI/2026". */
  pattern: string;
}

const NUMBER_TOKEN = /\b\d+(?:\.\d+)?(?:\/[A-Za-z0-9.\-]+)+\b/g;

/**
 * Find letter numbers in a text. A token counts only when it has at least
 * 3 slash-separated segments, ends in a 4-digit year, and has at least one
 * middle segment containing a letter — so plain dates ("20/11/2026")
 * are not mistaken for letter numbers.
 */
export function extractLetterNumbers(text: string): ParsedLetterNumber[] {
  const out: ParsedLetterNumber[] = [];
  for (const m of text.matchAll(NUMBER_TOKEN)) {
    const raw = m[0];
    const parts = raw.split("/");
    if (parts.length < 3) continue;
    if (!/^\d{4}$/.test(parts[parts.length - 1])) continue;
    if (!parts.slice(1, -1).some((p) => /[A-Za-z]/.test(p))) continue;
    // The sequence is the second segment when it is numeric
    // ("140/012/DS/…", "470/45/Kec-Simp/…", "188.4/05/DS/…"); when the
    // second segment is a code ("005/Kec-Simp/…") the first segment is
    // the sequence. A number without any numeric sequence is skipped.
    let seqIdx = -1;
    if (/^\d+$/.test(parts[1])) seqIdx = 1;
    else if (/^\d+$/.test(parts[0])) seqIdx = 0;
    if (seqIdx < 0) continue;
    const seq = Number(parts[seqIdx]);
    if (!Number.isFinite(seq) || seq <= 0) continue;
    const patternParts = [...parts];
    patternParts[seqIdx] = "#";
    out.push({
      raw,
      seq,
      seqWidth: parts[seqIdx].length,
      pattern: patternParts.join("/"),
    });
  }
  return out;
}

export interface NextNumberSuggestion {
  next: string;
  pattern: string;
  /** How many archived letters share this pattern. */
  basedOn: number;
  lastNumber: string;
  lastTitle: string;
}

function renderNext(n: ParsedLetterNumber): string {
  return n.pattern.replace("#", String(n.seq).padStart(n.seqWidth, "0"));
}

/**
 * Suggest the next letter number from the archive. When templateId is
 * given, only drafts of that type count; otherwise all letter drafts.
 * Picks the pattern with the most archived letters (ties: the most
 * recent draft's pattern), then max sequence + 1, zero-padded like the
 * archive writes it. Returns null when no usable number exists.
 */
export function suggestNextNumber(
  drafts: Draft[],
  templateId: string | null,
): NextNumberSuggestion | null {
  const letters = drafts.filter((d) => d.kind === "letter");
  const pool = templateId
    ? letters.filter((d) => draftTemplateId(d) === templateId)
    : letters;
  if (pool.length === 0) return null;
  const byPattern = new Map<
    string,
    { max: ParsedLetterNumber; count: number; lastAt: number; lastTitle: string }
  >();
  for (const d of pool) {
    for (const n of extractLetterNumbers(`${d.title}\n${d.content}`)) {
      const cur = byPattern.get(n.pattern);
      if (!cur || n.seq > cur.max.seq) {
        byPattern.set(n.pattern, {
          max: n,
          count: (cur?.count ?? 0) + 1,
          lastAt: d.createdAt,
          lastTitle: d.title,
        });
      } else {
        cur.count += 1;
        if (d.createdAt > cur.lastAt) {
          cur.lastAt = d.createdAt;
          cur.lastTitle = d.title;
        }
      }
    }
  }
  if (byPattern.size === 0) return null;
  let best: { max: ParsedLetterNumber; count: number; lastTitle: string } | null =
    null;
  for (const v of byPattern.values()) {
    if (!best || v.count > best.count) best = v;
  }
  if (!best) return null;
  const nextSeq = best.max.seq + 1;
  return {
    next: renderNext({ ...best.max, seq: nextSeq }),
    pattern: best.max.pattern,
    basedOn: best.count,
    lastNumber: best.max.raw,
    lastTitle: best.lastTitle,
  };
}

// ---------- which template is a draft? ----------

/**
 * A draft's template, from its title (drafts are saved under the
 * template's Indonesian name) or, failing that, from type keywords in
 * its content. Returns null when the type cannot be determined.
 */
export function draftTemplateId(d: Draft): string | null {
  const title = d.title.toLowerCase();
  for (const t of TEMPLATES) {
    if (title.includes(t.nameId.toLowerCase())) return t.id;
  }
  return detectLetterType(`${d.title}\n${d.content}`);
}

const TYPE_KEYWORDS: Array<{ id: string; patterns: RegExp[] }> = [
  {
    id: "undangan",
    patterns: [/undangan/i],
  },
  {
    id: "sk-pengangkatan",
    patterns: [/sk pengangkatan/i, /pengangkatan perangkat/i],
  },
  {
    id: "sk",
    patterns: [/surat keputusan/i, /\bsk\b/i],
  },
  {
    id: "sktm",
    patterns: [/sktm/i, /tidak mampu/i],
  },
  {
    id: "pengantar",
    patterns: [/pengantar/i],
  },
  {
    id: "keterangan",
    patterns: [/surat keterangan/i, /keterangan domisili/i, /keterangan usaha/i],
  },
  {
    id: "surat-dinas",
    patterns: [/surat dinas/i],
  },
];

/** Guess a letter template id from free text ("surat undangan …"). */
export function detectLetterType(text: string): string | null {
  for (const t of TYPE_KEYWORDS) {
    if (t.patterns.some((re) => re.test(text))) return t.id;
  }
  return null;
}

export interface ArchivedTemplate {
  templateId: string;
  templateNameId: string;
  count: number;
  lastDraft: Draft;
  lastNumber: string | null;
}

/**
 * The most recent archived draft of one letter type, with how many of
 * that type exist and the last number used. Null when the type was never
 * archived — Anin must say so, not invent a format.
 */
export function findArchivedTemplate(
  drafts: Draft[],
  templateId: string,
): ArchivedTemplate | null {
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  const matches = drafts
    .filter((d) => d.kind === "letter" && draftTemplateId(d) === templateId)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (matches.length === 0) return null;
  const last = matches[0];
  const nums = extractLetterNumbers(`${last.title}\n${last.content}`);
  return {
    templateId,
    templateNameId: tpl.nameId,
    count: matches.length,
    lastDraft: last,
    lastNumber: nums.length > 0 ? nums[nums.length - 1].raw : null,
  };
}
