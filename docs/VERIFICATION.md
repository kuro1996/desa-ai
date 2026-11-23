# DesaAI — Verification Report

Built and verified on 2026-11-15 (build VM, Asia/Jakarta); rebuilt and
re-verified 2026-11-20 after merging the SIAP AKAD personnel module and
the supporting features (three pillars: letters, personnel, status);
re-verified again 2026-11-20 evening after the package: subdistrict-office
unit scope in Kepegawaian, the IKM (community satisfaction) tab, the
Pengaduan tab, and the modern mobile-first design refresh; re-verified
again 2026-11-20 night after Paket 3: IKM survey distribution via
deep link + QR code, the "Heritage of Simpangkatis" office logo in the
header + favicon, per-tab SVG icons, and a live quick-stats strip;
re-verified again 2026-11-20 night after Paket 4: office-photo hero
header, design polish (panel transitions, reduced-motion support, quiet
white stat cards, no decorative emoji), and feature upgrades — letter
print, officer/complaint detail dialogs, IKM band chart + CSV export,
complaint type filter, drafts search + delete, JSON data backup;
re-verified again 2026-11-21 ~00:05 WIB after Paket 5: home dashboard
(bento grid, global search, IKM trend chart, printable monthly report),
dark mode as a designed theme, subtle glass tab bar, and fluid
typography — design references: bento grid, dark mode, glassmorphism
2.0 (patterns only, no brands copied).
Re-verified again 2026-11-23 after Paket 11 (Buku Agenda Surat, 152
checks) and Paket 12 (PWA offline: manifest + service worker,
network-first shell, cache-first hashed assets, online/offline chip,
agenda joins the Firestore mirror; headless 158 checks + a new
16-check PWA harness — see the Paket 12 row below).

## What was verified live

| Check | Result |
|---|---|
| `npm install` (firebase 12.19.0, vite 6.4.6, TS 5.9) | ✅ 166 packages, exit 0 |
| Hybrid API surface in installed SDK | ✅ `InferenceMode.PREFER_ON_DEVICE` / `ONLY_IN_CLOUD`, `initializeDeviceModel`, `response.inferenceSource`, `useLimitedUseAppCheckTokens` all present in `@firebase/ai` |
| `npm run build` (`tsc -b && vite build`) | ✅ passes; `dist/` = index.html + logo.png + favicon.png + kantor.jpg + 1 CSS + 1 JS bundle (918 kB, 231 kB gzip). One non-fatal warning: chunk > 500 kB (Firebase SDK) — acceptable for a static app |
| `npm run test:headless` (125 checks) | ✅ **125/125 passed**, exit 0 (2026-11-21 ~00:05 WIB, run twice, identical results) |
| Headless-Chrome UI flows | ✅ app loads; 8 tabs incl. Beranda (home), Kepegawaian, IKM, Pengaduan; letters form (Undangan, 7 fields); auto letter numbering `140/001/DS/XI/2026` → `140/002/DS/XI/2026`; summarizer char counter; Q&A answered from offline KB with routing badge + sources (10 KB entries incl. perangkat desa & SK pengangkatan); KB syarat checklist ticks; EN→ID language toggle; drafts empty state; letter archive groups (Arsip surat / Ringkasan tersimpan); archive letter item has a "Beri penilaian" link that opens the IKM tab |
| Kepegawaian module (SIAP AKAD sample data) | ✅ 23 demo records seeded, labelled "DATA CONTOH — bukan data asli" (8 subdistrict-office staff + 15 village officers); stats 23 total / 10 villages / 16 active / 4 expiring ≤90d / 3 expired (matches masa bhakti dates recomputed in-test); per-unit stats 8/4/2/2 (kecamatan) and 15/12/2/1 (desa); 7 notifications (incl. kecamatan staff); 10 village cards; 6 lembaga cards; form validation rejects empty submit, non-16-digit NIK, end-before-start dates; add → 24, delete → 23; search + village + status + unit filters (unit filter: 8 kecamatan rows / 15 desa rows); form unit switch changes position options and locks the village to "Kecamatan Simpangkatis" for unit Kecamatan; add kecamatan record → 24 (kec 9), delete → 23 (kec 8); "Buat SK" prefills SK Pengangkatan template for a desa record (Ahmad Fauzi) and a kecamatan record (Rizky Ramadhan — Kepala Seksi Pelayanan); offline personnel recap renders |
| IKM module (PermenPAN-RB No. 14/2017) | ✅ 12 sample answers, labelled "DATA CONTOH — bukan data asli"; dashboard count 12, 9 per-element bars; score = mean per element × 25 verified in-test (sample mean 3.6111 → IKM 90.28, category A); category band checked against the score; share buttons exist; "Bagikan Survei" clipboard fallback works in headless (status "Link copied to clipboard"); full-survey submit → 13 respondents, formula still holds; exact endpoints verified from a clean state: all 4s → IKM 100, category A; all 1s → IKM 25, category D; IKM → Pengaduan link opens the Pengaduan tab |
| IKM survey distribution — deep link + QR (Paket 3) | ✅ fresh load with `#ikm` opens the IKM tab, `#pengaduan` opens the Pengaduan tab; switching tabs updates `location.hash` via `history.replaceState`; share card shows the full survey link (`…/desa-ai/#ikm`); QR code renders as inline SVG from the vendored generator (no network, works offline); copy-link button copies (status "Survey link copied."); download-QR button produces a PNG download (status "QR code downloaded."); WhatsApp link is `wa.me/?text=` with the survey link (`%23ikm`) in the invite text |
| Logo + tab icons + quick stats (Paket 3) | ✅ header shows Bos's "Heritage of Simpangkatis" logo (`public/logo.png`, black background made transparent, visually clean on white and emerald) with `naturalWidth > 0`; favicon set (`./favicon.png`); all 7 tabs have an inline SVG icon (Lucide-style, currentColor) + label, no emoji tabs left; quick-stats strip shows 3 live numbers verified against the data (1 saved letter, IKM = dashboard score 25,00, 2 complaints resolved) |
| Office-photo hero + design polish (Paket 4) | ✅ hero shows Bos's office photo (`public/kantor.jpg`, 4160×2773 original resized to 1600×1067, JPEG q80, 181 kB) as a cover background with a dark emerald gradient overlay; logo + "DesaAI" + office identity in white, verified readable (h1 computed color rgb(255,255,255)); hero 225 px tall on phones (180–280 px band) and 280 px on desktop (260–340 px band); screenshots checked visually on 390 px and 1280 px — photo, sign "SIMPANGKATIS", and text all render cleanly, office line wraps without clipping; panels have a gentle entrance animation (`panel-in`, disabled under `prefers-reduced-motion`); stat cards are quiet white surfaces with one colored accent each; decorative emoji removed from buttons and share labels |
| Feature upgrades (Paket 4) | ✅ letter **print**: Print button fills a print-only area (office header + template + date + letter text) and calls `window.print()`; built CSS contains a `@media print` stylesheet that hides the app chrome and shows only the letter. Officer **detail dialog**: first-row Detail button opens a dialog with NIK, birthplace/date, religion, position, village, phone, term dates and status (Ahmad Fauzi verified). IKM **band chart + CSV export**: all 9 fills carry a band (good/mid/low); export button downloads the CSV and reports "IKM results downloaded.". Complaint **type filter + detail dialog**: filter "Keterlambatan" shows 3 items; Detail opens a dialog with the full complaint text. Drafts **search + delete + backup**: search "Undangan" filters to 1 draft, clearing restores 2; deleting "Ringkasan dokumen" leaves 1 draft and reports "Draft deleted."; backup export reports "Backup downloaded." (JSON of drafts, personnel, IKM, complaints, letter numbers, KB checklist) |
| Pengaduan module | ✅ 6 demo complaints, labelled "DATA CONTOH — bukan data asli"; stats 3 Baru / 2 Diproses / 1 Selesai; empty submit rejected; submit adds a complaint (7 items, Baru 4); status change Baru → Selesai updates stats (Baru 3, Selesai 2); status filter shows 2 Selesai / 3 Baru |
| Home dashboard — bento grid, global search, IKM trend, monthly report (Paket 5) | ✅ Beranda is the default tab (deep link `#beranda` opens it too); bento shows 8 cards with live numbers verified against the data — IKM 90,28 = dashboard score (category A), 0 letters today, 3 new complaints, 12 IKM answers + 6 complaints in November 2026; masa-bhakti counts (4 akan habis / 3 habis) match the kepegawaian tab stats; IKM trend chart is a hand-rolled SVG with 12 points (one per answer), last point = overall score 90.28; global search finds an officer ("Ahmad" → Ahmad Fauzi, Personnel group) and clicking the result opens the officer detail dialog, finds complaints by type ("Keterlambatan" → Complaints group), and shows an empty state for no match; quick action "Open the survey" jumps to the IKM tab; monthly report print fills the report area (title "Laporan Bulanan — November 2026", IKM + personnel lines) and calls `window.print()` with `body[data-print-target="report"]` |
| Dark mode + 2026 design refresh (Paket 5) | ✅ theme toggle in the header switches to a dark theme with its own color tokens (verified by computed styles: body rgb(15,26,19), panel/tab/input/bento rgb(24,36,32), light text rgb(232,240,234), hero title stays white); choice saved to localStorage (`desaai-theme-v1`) and applied before first paint, persists across reload, toggles back to light; QR box stays white in dark mode so the code still scans; sticky tab bar is translucent + blurred (glass 2.0); headings use fluid type (clamp); all 8 tabs have an inline SVG icon + label and open at 390 px phone width (8/8) with no horizontal overflow |
| Modern design / mobile | ✅ no horizontal overflow at 390 px phone width (scrollWidth 390); all 8 tabs clickable at phone width; modern emerald/teal + amber design (photo hero header with office identity, rounded white cards, soft shadows, 44 px touch targets, colored status chips) — no function changed |
| PWA offline (Paket 12) | ✅ manifest.webmanifest (standalone, `./` scope, 192 + 512 + maskable icons generated from the office logo, sizes verified against the real PNGs) + public/sw.js shipped in dist; `npm run test:pwa` (new Node vm harness driving the worker with stubbed CacheStorage/fetch) **16/16 passed**: install precaches exactly the 7 shell files (index.html NOT precached), navigation online serves the network shell and caches it, navigation offline serves the cached shell, a new deploy's shell (v2) wins over cached v1 (network-first — no stale shell), hashed JS/CSS + images served from cache offline with no second fetch, cross-origin Firebase/Google API requests are never intercepted or cached, activate deletes old caches and claims clients, offline navigation with an empty cache fails closed. Headless suite 152 → **158 checks** (6 new: manifest linked, net chip Online + ok style, bundle registers `./sw.js`, manifest fields, dist ships sw.js + manifest + 3 icons) — **157/158 on the final run; the 1 failure is the pre-existing flaky "kepegawaian summary renders an offline recap without AI" check, proven flaky on the pre-Paket-12 baseline too (151/152, same check failing)** |
| Console errors / failed requests | ✅ **0 console errors, 0 failed requests** (excluding this VM's blocked tunnel to Google endpoints — see environment notes) |

## What was NOT verified live (honest status)

- **Cloud Gemini calls were NOT verified end to end.** `scripts/node-cloud-test.mjs`
  reaches the Google backend, but no generation has succeeded yet:
  - 2026-11-20 ~20:52 WIB: timed out after 90 s (no response).
  - 2026-11-20 ~21:00 WIB: HTTP 500 from `firebasevertexai.googleapis.com` —
    "This model is currently experiencing high demand. Spikes in demand are
    usually temporary. Please try again later." (answered in ~3 s).
  - Retry 1 (~21:03 WIB): same HTTP 500 high-demand.
  - Retry 2 (~21:05 WIB): timed out after 150 s.
  - The request DOES reach the model endpoint (no 401/403, no "API not
    enabled"), so the Firebase project + AI Logic + key path work far enough
    to attempt inference — `gemini-3.8-flash` itself either returns 500
    high-demand or hangs. **Next step: retry later from a real browser, or
    try again when demand drops. Do NOT claim cloud generation works until
    one call returns real text.**
- **On-device Gemini Nano inference was NOT verified.** The build VM's
  headless Chrome (`/opt/meta-chromium/chrome`; system Chrome
  `/usr/bin/google-chrome` is absent after a VM replacement) exposes
  `LanguageModel.availability()`, which returns **"unavailable"** — no
  Gemini Nano model is downloaded on this VM and the Prompt API flag is
  not enabled. The header chip therefore reports "On-device: unavailable",
  and any AI call would take the cloud/fallback path. The hybrid code path
  itself (model creation with `PREFER_ON_DEVICE`, `initializeDeviceModel`
  on a user gesture, `inferenceSource` badge, `decideRoute` thresholds)
  is implemented exactly per the official Firebase AI Logic docs
  (fetched 2026-11-15) and degrades gracefully — but **live on-device
  inference must be verified on desktop Chrome 139+** with
  `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` enabled
  and a downloaded Nano model.
- **Firestore drafts / anonymous auth / Remote Config / App Check** were
  NOT verified live (same reason — this VM's browser cannot reach Google
  endpoints). Code paths are implemented with a localStorage fallback so
  the app works without them. The drafts list now renders local drafts
  even while Firebase init is still pending.
- The "On-device • private" badge on a Q&A answer means the answer came
  from the **local offline guide with no network call** — it is NOT a
  Gemini Nano inference. The badge's reason text says exactly that.
- The 23 personnel records are **SAMPLE DATA from SIAP AKAD** (demo NIKs),
  labelled in the UI. They demonstrate the admin flow and term-expiry
  notifications; they are not real personnel data. The 8 subdistrict-office
  records use generic example names (e.g. Budi Prasetyo, Siti Rahmawati)
  and are NOT the real office holders — never present them as such.
- **Service-worker registration on a real browser was NOT verified from
  this VM (Paket 12).** The worker logic itself is proven by
  `npm run test:pwa` (16/16, vm harness), but a live register + offline
  reload needs an http(s) origin: file:// cannot host a worker, and
  this VM's Chrome blocks every http://127.0.0.1 / localhost navigation
  with Local Network Access checks — all `--disable-features` flag
  variants were tried 2026-11-23 and still block, and the VM's only
  other interface IP (198.19.0.2) is unreachable from the shell itself.
  **Live proof must come from Bos's phone or a real browser on the
  live site** (steps in `~/workspace/buildhybridai/uji-cloud-hp-20261123.md`:
  chip Online, Add to Home Screen, airplane-mode reload, offline agenda
  entry, re-sync on reconnect). Do NOT claim the PWA works live until
  that check passes.
- **IKM Web Share was NOT verified live.** Headless Chrome has no
  `navigator.share`, so the test verifies the clipboard fallback ("Link
  copied to clipboard") and the manual-copy box path, not the native
  share sheet — that needs a real phone browser.
- **The modern design was verified structurally only** (no horizontal
  overflow at 390 px, all 7 tabs clickable, chips/cards render) — no
  visual-design review was done; a human look on a real phone is still
  the honest check for "modern and attractive".

## Environment notes (for the next run)

- `/usr/bin/google-chrome` is missing on this VM; the test auto-detects
  and falls back to `/opt/meta-chromium/chrome` (with its WebGL allowlist
  flags). If system Chrome returns, it is used first.
- This VM's Chrome build blocks `http://127.0.0.1` navigations
  (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`), so the headless test
  loads the build via `file://` with `--allow-file-access-from-files`.
  The Vite build uses `base: "./"` (relative asset paths) to make that
  work; `npm run preview` still serves it over HTTP for real use.
- This VM's headless Chrome cannot reach Google/Firebase endpoints at all
  (`ERR_TUNNEL_CONNECTION_FAILED` for `firebaseinstallations`,
  `recaptcha`, `googleapis.com`, …), so Firebase init hangs in the
  browser and AI calls cannot start there. The headless test filters
  exactly those tunnel failures out of its "0 console errors / 0 failed
  requests" assertions and asserts zero for everything else. The same
  endpoints ARE reachable from the shell/Node (curl: recaptcha 200,
  firebaseinstallations 404 as expected, generativelanguage 403 as
  expected without a key).
- The Node cloud probe (`scripts/node-cloud-test.mjs`, timeout now 150 s
  via `CLOUD_TEST_TIMEOUT_MS`) uses the same project, backend
  (`GoogleAIBackend`), and model (`gemini-3.8-flash`) as the app.
