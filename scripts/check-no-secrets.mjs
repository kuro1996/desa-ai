// check-no-secrets.mjs — penjaga deploy DesaAI.
//
// Mencegah terulangnya kebocoran 2026-11-20 (commit 6fc21ed7 menyapu
// .env + src/firebase-config.js ke repo publik).
//
// Mode 1 — pre-commit / staged (default):
//   node scripts/check-no-secrets.mjs
//   Memeriksa file yang di-stage (git diff --cached) berdasarkan NAMA
//   (jalur terlarang) dan ISI (pola secret).
//
// Mode 2 — deploy dir:
//   node scripts/check-no-secrets.mjs --dir <path>
//   Memeriksa pohon direktori staging deploy (mis. temp clone gh-pages)
//   berdasarkan NAMA + ISI, kecuali bundle JS hasil build (dist/assets/*.js
//   memang mengandung Firebase web apiKey BY DESIGN — kunci client yang
//   dilindungi pembatasan referrer — jadi bundle dikecualikan dari
//   pemindaian isi, tapi tetap diperiksa namanya).
//
// Keluar 1 bila ada pelanggaran, 0 bila bersih.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DENIED_PATHS = [
  /(^|\/)\.env(\..*)?$/,
  /(^|\/)src\/firebase-config\.js$/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.appcheck-debug-token$/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)id_rsa/,
  /(^|\/)credentials[^/]*\.json$/i,
];

// Pola isi secret. ApiKey Firebase web (AIza...) HANYA dipindai di file
// source, bukan di bundle build (lihat pengecualian di bawah).
const CONTENT_PATTERNS = [
  { name: "Google API key (AIza...)", re: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: "App Check debug token assignment", re: /VITE_APPCHECK_DEBUG_TOKEN\s*=/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "GitHub personal access token", re: /(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/ },
  { name: "Slack token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
];

const BUNDLE_RE = /(^|\/)assets\/[^/]+\.js$/; // bundle build — apiKey by design
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

function deniedPath(p) {
  return DENIED_PATHS.find((re) => re.test(p)) ?? null;
}

function scanText(rel, text, { isBundle }) {
  const hits = [];
  for (const { name, re } of CONTENT_PATTERNS) {
    if (isBundle && name.startsWith("Google API key")) continue;
    if (re.test(text)) hits.push(name);
  }
  return hits.map((name) => `${rel}: ${name}`);
}

function scanDir(dir) {
  const violations = [];
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.name === ".git") continue;
      const full = path.join(d, ent.name);
      const rel = path.relative(dir, full).split(path.sep).join("/");
      if (ent.isDirectory()) {
        const bad = deniedPath(rel + "/");
        if (bad) violations.push(`${rel}/: path terlarang (${bad})`);
        else walk(full);
      } else {
        const bad = deniedPath(rel);
        if (bad) {
          violations.push(`${rel}: path terlarang (${bad})`);
          continue;
        }
        if (fs.statSync(full).size > MAX_SCAN_BYTES) continue;
        const buf = fs.readFileSync(full);
        if (buf.includes(0)) continue; // biner
        violations.push(...scanText(rel, buf.toString("utf8"), { isBundle: BUNDLE_RE.test(rel) }));
      }
    }
  };
  walk(dir);
  return violations;
}

function scanStaged() {
  const violations = [];
  let files = [];
  try {
    files = execSync("git diff --cached --name-only -z", { encoding: "buffer" })
      .toString("utf8")
      .split("\0")
      .filter(Boolean);
  } catch {
    console.error("check-no-secrets: bukan repo git / git gagal — lewati.");
    return [];
  }
  for (const rel of files) {
    const bad = deniedPath(rel);
    if (bad) {
      violations.push(`${rel}: path terlarang (${bad})`);
      continue;
    }
    let text;
    try {
      text = execSync(`git show :${JSON.stringify(rel)}`, { encoding: "utf8", maxBuffer: MAX_SCAN_BYTES });
    } catch {
      continue; // file dihapus / tidak terbaca
    }
    violations.push(...scanText(rel, text, { isBundle: BUNDLE_RE.test(rel) }));
  }
  return violations;
}

const dirIdx = process.argv.indexOf("--dir");
const violations = dirIdx >= 0 ? scanDir(process.argv[dirIdx + 1]) : scanStaged();

if (violations.length > 0) {
  console.error("check-no-secrets: DITEMUKAN SECRET / FILE TERLARANG — dibatalkan:");
  for (const v of violations) console.error(`  - ${v}`);
  console.error("Perbaiki dulu (hapus dari staging / jangan commit file itu), lalu ulangi.");
  process.exit(1);
}
console.log("check-no-secrets: bersih.");
