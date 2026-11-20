# DesaAI — Verification Report

Built and verified on 2026-11-15 (build VM, Asia/Jakarta); rebuilt and
re-verified 2026-11-20 after merging the SIAP AKAD personnel module and
the supporting features (three pillars: letters, personnel, status).

## What was verified live

| Check | Result |
|---|---|
| `npm install` (firebase 12.19.0, vite 6.4.6, TS 5.9) | ✅ 166 packages, exit 0 |
| Hybrid API surface in installed SDK | ✅ `InferenceMode.PREFER_ON_DEVICE` / `ONLY_IN_CLOUD`, `initializeDeviceModel`, `response.inferenceSource`, `useLimitedUseAppCheckTokens` all present in `@firebase/ai` |
| `npm run build` (`tsc -b && vite build`) | ✅ passes; `dist/` = index.html + 1 CSS + 1 JS bundle (862 kB, 213 kB gzip). One non-fatal warning: chunk > 500 kB (Firebase SDK) — acceptable for a static app |
| `npm run test:headless` (43 checks) | ✅ **43/43 passed**, exit 0 (2026-11-20) |
| Headless-Chrome UI flows | ✅ app loads; 5 tabs incl. Kepegawaian; letters form (Undangan, 7 fields); auto letter numbering `140/001/DS/XI/2026` → `140/002/DS/XI/2026`; summarizer char counter; Q&A answered from offline KB with routing badge + sources (10 KB entries incl. perangkat desa & SK pengangkatan); KB syarat checklist ticks; EN→ID language toggle; drafts empty state; letter archive groups (Arsip surat / Ringkasan tersimpan) |
| Kepegawaian module (SIAP AKAD sample data) | ✅ 15 demo records seeded, labelled "DATA CONTOH — bukan data asli"; stats 15 total / 10 villages / 12 active / 2 expiring ≤90d / 1 expired (matches masa bhakti dates recomputed in-test); 3 notifications; 10 village cards; 6 lembaga cards; form validation rejects empty submit, non-16-digit NIK, end-before-start dates; add → 16, delete → 15; search + village + status filters; "Buat SK" prefills SK Pengangkatan template; offline personnel recap renders |
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
- The 15 personnel records are **SAMPLE DATA from SIAP AKAD** (demo NIKs),
  labelled in the UI. They demonstrate the admin flow and term-expiry
  notifications; they are not real personnel data.

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
