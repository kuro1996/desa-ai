// DesaAI — Anin chat (Paket 32): command routing for the in-app agent.
// Pure logic only (no DOM, no AI calls): main.ts drives the UI and the
// hybrid-AI calls. Anin works ONLY inside this app: she answers questions
// about the app and its procedures, navigates to tabs, fills the letter
// form on command, and analyses IKM + complaint trends from local data.
// She never invents names, numbers, or dates — a field stays empty when
// the command does not state it clearly, and analyst answers only ever
// contain aggregates (counts, averages, categories), never raw records.
import { parseCepat, type CepatResult } from "./cepat";
import { matchKb, KB, type KbEntry } from "./kb";
import { matchAninKb, ANIN_KB, type AninKbEntry } from "./anin-kb";

export type AninExpression =
  | "tersenyum"
  | "senang"
  | "terkagum"
  | "sedih"
  | "marah"
  | "bingung"
  | "takut"
  | "malu"
  | "bersemangat"
  | "mengangguk";

/** Cropped faces from Bos's character sheet (public/, offline). */
export const ANIN_FACE_FILE: Record<AninExpression, string> = {
  tersenyum: "anin-face-tersenyum.png",
  senang: "anin-face-senang.png",
  terkagum: "anin-face-terkagum.png",
  sedih: "anin-face-sedih.png",
  marah: "anin-face-marah.png",
  bingung: "anin-face-bingung.png",
  takut: "anin-face-takut.png",
  malu: "anin-face-malu.png",
  bersemangat: "anin-face-bersemangat.png",
  mengangguk: "anin-face-mengangguk.png",
};

export type AninAnalystTopic = "ikm" | "complaints" | "improve";

export type AninIntent =
  | { kind: "greet" }
  | { kind: "thanks" }
  | { kind: "nav"; tab: string }
  | { kind: "letter"; parsed: CepatResult }
  | { kind: "letter-need" }
  | { kind: "analyst"; topic: AninAnalystTopic }
  | { kind: "appkb"; entry: AninKbEntry }
  | { kind: "kb"; entries: KbEntry[] }
  | { kind: "unknown" };

const NAV_VERB = /\b(buka|bukakan|lihat|tampilkan|pindah|tuju|ke|buka\s+tab)\b/i;

const TAB_KEYWORDS: Array<{ tab: string; keywords: string[] }> = [
  { tab: "home", keywords: ["beranda", "home", "dashboard", "awal"] },
  { tab: "letters", keywords: ["draf surat", "tab surat", "surat", "letter"] },
  { tab: "summarize", keywords: ["ringkasan", "rangkum", "summarize", "ringkas"] },
  { tab: "qa", keywords: ["tanya prosedur", "prosedur", "tanya jawab", "panduan"] },
  { tab: "drafts", keywords: ["arsip", "draf saya", "draf tersimpan", "drafts", "arsip & draf"] },
  { tab: "kepegawaian", keywords: ["kepegawaian", "perangkat desa", "data pegawai", "pegawai", "personnel"] },
  { tab: "ikm", keywords: ["ikm", "kepuasan", "survei kepuasan", "survey"] },
  { tab: "pengaduan", keywords: ["pengaduan", "aduan", "komplain", "keluhan"] },
  { tab: "agenda", keywords: ["agenda", "buku agenda", "mail register", "surat masuk"] },
];

// Analyst questions — checked BEFORE the app KB so "IKM rata-rata berapa?"
// is analysed (not answered with the generic IKM how-to) and "keluhan
// terbanyak" is analysed (not answered with the complaint how-to).
const ANALYST_RULES: Array<{ topic: AninAnalystTopic; patterns: RegExp[] }> = [
  {
    topic: "ikm",
    patterns: [
      /ikm.*(rata|berapa|skor|nilai)/i,
      /skor ikm/i,
      /rata-rata ikm/i,
      /berapa.*(responden|jawaban ikm)/i,
      /nilai ikm/i,
    ],
  },
  {
    topic: "complaints",
    patterns: [
      /keluhan terbanyak/i,
      /pengaduan terbanyak/i,
      /keluhan.*bulan ini/i,
      /pengaduan.*bulan ini/i,
      /keluhan.*paling banyak/i,
      /berapa.*pengaduan/i,
      /pengaduan.*berapa/i,
      /jumlah pengaduan/i,
    ],
  },
  {
    topic: "improve",
    patterns: [
      /yang harus diperbaiki/i,
      /apa.*diperbaiki/i,
      /saran perbaikan/i,
      /yang perlu diperbaiki/i,
      /perlu diperbaiki/i,
      /apa yang kurang/i,
    ],
  },
];

const GREET = /^(halo|hai|hi|hei|selamat (pagi|siang|sore|malam)|assalamu'alaikum|pagi|siang|sore|malam)\b/i;
const THANKS = /terima kasih|makasih|thanks|thank you/i;
const LETTER_VERB = /\b(buat|buatkan|bikin|tulis|tuliskan|tolong)\b/i;

/**
 * Route one user message. Order matters: greetings, navigation (explicit
 * "buka …"), letter commands, analyst questions, the app knowledge base
 * (every feature + troubleshooting), the procedure guide (KB), then
 * "unknown" (main.ts tries the hybrid AI, else the no-understand reply).
 * A bare "surat undangan …" without a create verb is NOT a letter
 * command — it falls through to KB instead of guessing.
 */
export function classifyAninText(raw: string): AninIntent {
  const text = raw.trim();
  if (!text) return { kind: "unknown" };
  if (GREET.test(text) && text.length < 30) return { kind: "greet" };
  if (THANKS.test(text) && text.length < 40) return { kind: "thanks" };

  // 1. Navigation: "buka data kepegawaian", "ke tab IKM", "tampilkan agenda".
  if (NAV_VERB.test(text)) {
    const lower = text.toLowerCase();
    for (const t of TAB_KEYWORDS) {
      if (t.keywords.some((k) => lower.includes(k))) return { kind: "nav", tab: t.tab };
    }
  }

  // 2. Letter command: create verb + "surat" → Surat Cepat parser.
  if (LETTER_VERB.test(text) && /surat/i.test(text)) {
    const parsed = parseCepat(text);
    if (parsed) return { kind: "letter", parsed };
    return { kind: "letter-need" };
  }

  // 3. Analyst: IKM averages, top complaints, what to improve — computed
  // on-device from local data (main.ts), never from raw records.
  for (const rule of ANALYST_RULES) {
    if (rule.patterns.some((re) => re.test(text))) return { kind: "analyst", topic: rule.topic };
  }

  // 4. App knowledge base: every feature + troubleshooting.
  const appEntry = matchAninKb(text);
  if (appEntry) return { kind: "appkb", entry: appEntry };

  // 5. Procedure guide (KB): KTP, KK, SKTM, … — offline, always available.
  const entries = matchKb(text);
  if (entries.length > 0) return { kind: "kb", entries };

  return { kind: "unknown" };
}

// ---------- Paket 32.1: topik terdekat (near-miss fallback) ----------

/** Kata yang terlalu umum untuk dipakai sebagai sinyal topik. */
const STOPWORDS = new Set([
  "cara", "apa", "yang", "saya", "bisa", "bagaimana", "kapan", "dimana",
  "apakah", "kalau", "ada", "ini", "itu", "dan", "atau", "saja", "mau",
  "tolong", "kami", "kamu", "anda", "dengan", "untuk", "dari", "di", "ke",
  "adalah", "seperti", "kenapa", "mengapa", "berapa", "siapa",
]);

export interface ClosestTopic {
  titleId: string;
  titleEn: string;
}

function topicWords(src: string): Set<string> {
  const out = new Set<string>();
  for (const w of src.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length >= 3 || w === "ktp" || w === "kk" || w === "sk") {
      if (!STOPWORDS.has(w)) out.add(w);
    }
  }
  return out;
}

/**
 * Topik terdekat saat TIDAK ADA entri yang cocok penuh — pencocokan
 * tingkat kata (bukan frasa penuh), sehingga "surat saya kapan selesai"
 * tetap menyarankan topik surat, bukan jalan buntu. Dipakai main.ts
 * untuk melengkapi jawaban "belum paham". Omong kosong murni (mis.
 * "zxqv kltp 123") tidak menghasilkan saran apa pun.
 */
export function suggestClosestTopics(question: string, limit = 3): ClosestTopic[] {
  const q = question.toLowerCase();
  const qWords = topicWords(q);
  if (qWords.size === 0) return [];
  const scored: Array<{ topic: ClosestTopic; score: number }> = [];
  const consider = (titleId: string, titleEn: string, keywords: string[]) => {
    const bag = new Set<string>();
    for (const src of [titleId, ...keywords]) {
      for (const w of topicWords(src)) bag.add(w);
    }
    let score = 0;
    for (const w of bag) {
      if (qWords.has(w) || q.includes(w)) score += 1;
    }
    if (score > 0) scored.push({ topic: { titleId, titleEn }, score });
  };
  for (const e of ANIN_KB) consider(e.titleId, e.titleEn, e.keywords);
  for (const e of KB) consider(e.titleId, e.titleEn, e.keywords);
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: ClosestTopic[] = [];
  for (const s of scored) {
    if (seen.has(s.topic.titleId)) continue;
    seen.add(s.topic.titleId);
    out.push(s.topic);
    if (out.length >= limit) break;
  }
  return out;
}
