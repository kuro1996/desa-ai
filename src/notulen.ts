// DesaAI — Notulen Rapat (Paket 34, Ide 7): catatan/teks rapat → notulen
// terstruktur (tanggal, peserta, agenda, keputusan, tindak lanjut +
// penanggung jawab bila disebut) + draf surat tindak lanjut dari notulen
// itu. 100% offline dan rule-based (tanpa AI): parser TIDAK PERNAH
// mengarang — bagian yang tidak disebut di catatan tampil sebagai "—",
// nama/tanggal hanya diambil bila tertulis jelas di teks.
import { findCepatDates } from "./cepat";

export interface TindakLanjut {
  teks: string;
  penanggungJawab: string;
}

export interface Notulen {
  tanggal: string;
  peserta: string[];
  agenda: string[];
  keputusan: string[];
  tindakLanjut: TindakLanjut[];
}

const SECTION_HEADS: Array<{ key: keyof Notulen; re: RegExp }> = [
  { key: "peserta", re: /^(peserta|hadir|dihadiri(\s+oleh)?|yang\s+hadir)\s*:/i },
  { key: "agenda", re: /^agenda\s*:/i },
  { key: "keputusan", re: /^(keputusan|kesepakatan|hasil\s+rapat|diputuskan)\s*:/i },
  { key: "tindakLanjut", re: /^(tindak\s+lanjut|tindaklanjut|tugas|kesimpulan\s+dan\s+tindak\s+lanjut)\s*:/i },
];

function cleanItem(s: string): string {
  return s
    .trim()
    .replace(/^[-•–—*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Budi, Siti dan Ahmad" / "Budi; Siti; Ahmad" → ["Budi", "Siti", "Ahmad"].
 * (Tanpa capture group di split — grup tangkap menyisipkan `undefined`
 * ke hasil split dan melempar TypeError di .map.) */
function splitPeople(s: string): string[] {
  return s
    .split(/[,;]|\s+dan\s+/i)
    .map((p) => cleanItem(p.replace(/^dan\s+/i, "")))
    .filter((p) => p.length > 1 && p.length < 80);
}

function splitItems(s: string): string[] {
  return s
    .split(/[;\n]/)
    .map(cleanItem)
    .filter((p) => p.length > 1);
}

/** "Ditugaskan kepada Budi" / "PJ: Budi" / "oleh Siti" → nama, bila jelas. */
function extractPj(item: string): string {
  const m =
    item.match(/\bPJ\s*:\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/) ??
    item.match(/\bpenanggung\s+jawab\s*:\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/) ??
    item.match(/\bditugaskan\s+kepada\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/) ??
    item.match(/\boleh\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\s*$/);
  if (m) return m[1].trim();
  return "";
}

function makeTindakLanjut(item: string): TindakLanjut {
  const pj = extractPj(item);
  let teks = item;
  if (pj) {
    teks = cleanItem(
      item
        .replace(new RegExp(`\\bPJ\\s*:\\s*${pj}`, "i"), "")
        .replace(new RegExp(`penanggung\\s+jawab\\s*:\\s*${pj}`, "i"), "")
        .replace(new RegExp(`ditugaskan\\s+kepada\\s+${pj}`, "i"), `ditugaskan kepada ${pj}`)
        .replace(new RegExp(`\\boleh\\s+${pj}\\s*$`, "i"), ""),
    );
  }
  return { teks: teks || item, penanggungJawab: pj };
}

const KEPUTUSAN_MARK = /\b(diputuskan|disepakati|disetujui|keputusan|kesepakatan)\b/i;
const TINDAK_MARK =
  /\b(tindak\s+lanjut|ditugaskan|penanggung\s+jawab|\bPJ\s*:|akan\s+(dilakukan|dibuat|disusun|diadakan|dilaksanakan)|harus\s+(segera|dilakukan|dibuat|diselesaikan))\b/i;

/** Parse catatan rapat bebas menjadi notulen terstruktur. */
export function parseNotulen(text: string): Notulen {
  const out: Notulen = { tanggal: "", peserta: [], agenda: [], keputusan: [], tindakLanjut: [] };
  if (!text || !text.trim()) return out;
  const dates = findCepatDates(text);
  if (dates[0]) out.tanggal = dates[0];

  const lines = text.split(/\r?\n/);
  let section: keyof Notulen | null = null;
  const loose: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Header bagian ("Peserta:", "Agenda:", "Keputusan:", "Tindak lanjut:")
    // — sisanya di baris yang sama ikut jadi isi bagian itu.
    let matched = false;
    for (const head of SECTION_HEADS) {
      const m = line.match(head.re);
      if (m) {
        section = head.key;
        const rest = cleanItem(line.slice(m[0].length));
        if (rest) {
          if (head.key === "peserta") out.peserta.push(...splitPeople(rest));
          else if (head.key === "tindakLanjut") out.tindakLanjut.push(makeTindakLanjut(rest));
          else if (head.key === "agenda") out.agenda.push(...splitItems(rest));
          else out.keputusan.push(...splitItems(rest));
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;
    // "Tanggal: ..." / "Waktu: ..." / "Tempat: ..." di luar bagian.
    if (/^(tanggal|hari\s*\/\s*tanggal|waktu|tempat|lokasi)\s*:/i.test(line)) {
      if (!out.tanggal) {
        const d = findCepatDates(line);
        if (d[0]) out.tanggal = d[0];
      }
      section = null;
      continue;
    }
    // Baris "Dihadiri oleh ..." tanpa titik dua.
    const dihadiri = line.match(/^dihadiri\s+oleh\s+(.+)$/i);
    if (dihadiri) {
      out.peserta.push(...splitPeople(dihadiri[1]));
      continue;
    }
    if (section === "peserta") out.peserta.push(...splitPeople(line));
    else if (section === "agenda") out.agenda.push(cleanItem(line));
    else if (section === "keputusan") out.keputusan.push(cleanItem(line));
    else if (section === "tindakLanjut") out.tindakLanjut.push(makeTindakLanjut(cleanItem(line)));
    else loose.push(line);
  }
  // Tanpa header bagian: tebak dari kata kunci — hanya baris yang JELAS
  // menyebut keputusan/tindak lanjut; sisanya jadi agenda bila bernomor.
  for (const line of loose) {
    const item = cleanItem(line);
    if (!item) continue;
    if (TINDAK_MARK.test(item)) out.tindakLanjut.push(makeTindakLanjut(item));
    else if (KEPUTUSAN_MARK.test(item)) out.keputusan.push(item);
    else if (/^\d+[.)]\s+\S/.test(line) && out.agenda.length < 10) out.agenda.push(item);
  }
  // Bersihkan duplikat + kosong, pertahankan urutan.
  const dedup = (arr: string[]): string[] => [...new Set(arr.filter(Boolean))];
  out.peserta = dedup(out.peserta);
  out.agenda = dedup(out.agenda);
  out.keputusan = dedup(out.keputusan);
  const seenTl = new Set<string>();
  out.tindakLanjut = out.tindakLanjut.filter((t) => {
    if (!t.teks || seenTl.has(t.teks)) return false;
    seenTl.add(t.teks);
    return true;
  });
  // Tanggal dari baris "Tanggal: ..." bila findCepatDates tidak menemukannya
  // dalam format baku (mis. "20/11/2026" sudah ditangani di sana).
  if (!out.tanggal) {
    const m = text.match(/tanggal\s*:\s*([^\n,;]{3,40})/i);
    if (m) out.tanggal = cleanItem(m[1]);
  }
  return out;
}

const DASH = "—";

/** Render notulen sebagai teks rapi untuk ditampilkan / disimpan. */
export function formatNotulen(n: Notulen): string {
  const lines: string[] = ["NOTULEN RAPAT"];
  lines.push(`Tanggal: ${n.tanggal || DASH}`);
  lines.push(`Peserta: ${n.peserta.length ? n.peserta.join(", ") : DASH}`);
  lines.push("");
  lines.push("Agenda:");
  if (n.agenda.length) n.agenda.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  else lines.push(DASH);
  lines.push("");
  lines.push("Keputusan:");
  if (n.keputusan.length) n.keputusan.forEach((k, i) => lines.push(`${i + 1}. ${k}`));
  else lines.push(DASH);
  lines.push("");
  lines.push("Tindak Lanjut:");
  if (n.tindakLanjut.length) {
    n.tindakLanjut.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.teks}${t.penanggungJawab ? ` (PJ: ${t.penanggungJawab})` : ""}`);
    });
  } else lines.push(DASH);
  return lines.join("\n");
}

/** Kolom formulir Surat Dinas untuk surat tindak lanjut dari notulen. */
export function notulenToLetterFields(n: Notulen): { perihal: string; isi: string } {
  const perihal = `Tindak Lanjut Hasil Rapat${n.tanggal ? ` tanggal ${n.tanggal}` : ""}`;
  const parts: string[] = [];
  if (n.keputusan.length) {
    parts.push(`Keputusan rapat:${n.keputusan.map((k, i) => `\n${i + 1}. ${k}`).join("")}`);
  }
  if (n.tindakLanjut.length) {
    parts.push(
      `Tindak lanjut:${n.tindakLanjut
        .map(
          (t, i) =>
            `\n${i + 1}. ${t.teks}${t.penanggungJawab ? ` (Penanggung jawab: ${t.penanggungJawab})` : ""}`,
        )
        .join("")}`,
    );
  }
  if (n.peserta.length) parts.push(`Peserta rapat: ${n.peserta.join(", ")}.`);
  const isi =
    parts.join("\n\n") ||
    "Menindaklanjuti hasil rapat sebagaimana tercantum dalam notulen terlampir.";
  return { perihal, isi };
}
