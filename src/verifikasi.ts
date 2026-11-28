// DesaAI — Verifikasi surat via QR (Paket 34, Ide 4).
// Every archived letter gets a QR code that encodes a static verification
// URL: https://kuro1996.github.io/desa-ai/?verifikasi=<id-surat>&c=<checksum>
// The checksum is a short FNV-1a hash over the letter's own fields
// (id + title + content + createdAt), so any change to the archived
// content is detectable. Verification is honest and local-only: it checks
// the id + checksum against the drafts already loaded in this browser
// (local drafts + the Firestore copy when connected). No server, no new
// backend. A scanned code opened on a device that never saw the letter
// honestly reports "TIDAK DITEMUKAN dalam arsip" — it never claims a
// letter is fake or genuine without the data to back it.
import type { Draft } from "./drafts";

/** Public base URL of the deployed app (the QR target). */
export const VERIFY_BASE_URL = "https://kuro1996.github.io/desa-ai/";

/** FNV-1a 32-bit hash, hex, 8 chars — short, deterministic, dependency-free. */
export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Canonical string the checksum covers: the letter's own archived fields. */
export function letterChecksumSource(d: Pick<Draft, "id" | "title" | "content" | "createdAt">): string {
  return `${d.id}\n${d.title}\n${d.content}\n${d.createdAt}`;
}

/** Short checksum of an archived letter. */
export function letterChecksum(d: Pick<Draft, "id" | "title" | "content" | "createdAt">): string {
  return fnv1aHex(letterChecksumSource(d));
}

/** Static verification URL for a letter (what the QR code encodes). */
export function buildVerifyUrl(d: Pick<Draft, "id" | "title" | "content" | "createdAt">): string {
  return `${VERIFY_BASE_URL}?verifikasi=${encodeURIComponent(d.id)}&c=${letterChecksum(d)}`;
}

export interface VerifyParams {
  id: string;
  checksum: string;
}

/** Parse ?verifikasi=<id>&c=<checksum> from a query string; null when absent. */
export function parseVerifyQuery(search: string): VerifyParams | null {
  try {
    const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const id = (q.get("verifikasi") ?? "").trim();
    if (!id) return null;
    return { id, checksum: (q.get("c") ?? "").trim().toLowerCase() };
  } catch {
    return null;
  }
}

export type VerifyStatus = "verified" | "tampered" | "not-found";

export interface VerifyResult {
  status: VerifyStatus;
  draft?: Draft;
}

/**
 * Check id + checksum against drafts already loaded in this browser.
 * - verified: the id exists and the checksum matches the archived content.
 * - tampered: the id exists but the checksum does not match — the archived
 *   content differs from what the QR was made from.
 * - not-found: no draft with this id in the loaded archive (this browser
 *   never saw the letter, or it was deleted).
 */
export function verifyDraft(drafts: Draft[], id: string, checksum: string): VerifyResult {
  const draft = drafts.find((d) => d.id === id);
  if (!draft) return { status: "not-found" };
  if (!checksum) return { status: "tampered", draft };
  if (letterChecksum(draft) !== checksum) return { status: "tampered", draft };
  return { status: "verified", draft };
}
