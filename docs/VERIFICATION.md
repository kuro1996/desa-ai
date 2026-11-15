# DesaAI — Verification Report

Built and verified on 2026-11-15 (build VM, Asia/Jakarta).

## What was verified live

| Check | Result |
|---|---|
| `npm install` (firebase 12.19.0, vite 6.4.6, TS 5.9) | ✅ 166 packages, exit 0 |
| Hybrid API surface in installed SDK | ✅ `InferenceMode.PREFER_ON_DEVICE` / `ONLY_IN_CLOUD`, `initializeDeviceModel`, `response.inferenceSource`, `useLimitedUseAppCheckTokens` all present in `@firebase/ai` |
| `npm run build` (`tsc -b && vite build`) | ✅ passes; `dist/` = index.html + 1 CSS + 1 JS bundle (830 kB, 204 kB gzip). One non-fatal warning: chunk > 500 kB (Firebase SDK) — acceptable for a static app |
| `npm run test:headless` (17 checks) | ✅ **17/17 passed**, exit 0 |
| Headless-Chrome UI flows (demo mode, no Firebase) | ✅ app loads; demo banner; on-device chip; letters form (Undangan, 7 fields); summarizer char counter; Q&A answered from offline KB with routing badge + sources; KB guide (8 entries); EN→ID language toggle; drafts empty state |
| Console errors / failed requests | ✅ **0 console errors, 0 failed requests** |
| Screenshots (visual QA) | ✅ letters tab + Q&A tab render cleanly (see `/tmp/desaai-letters.png`, `/tmp/desaai-qa.png` — build-time only, not shipped) |

## What was NOT verified live (honest status)

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
- **Cloud Gemini calls were NOT verified** — no Firebase project exists
  yet (user step). In demo mode the app explains this instead of failing.
  After the user pastes a real config and runs `init ailogic`, verify:
  letter generation streams with a "Cloud" badge, and a short prompt on a
  Nano-capable Chrome shows "On-device • private".
- **Firestore drafts / anonymous auth / Remote Config / App Check** were
  NOT verified live (same reason — no project yet). Code paths are
  implemented with a localStorage fallback so the app works without them.
- The "On-device • private" badge on a Q&A answer means the answer came
  from the **local offline guide with no network call** — it is NOT a
  Gemini Nano inference. The badge's reason text says exactly that.

## Environment notes (for the next run)

- `/usr/bin/google-chrome` is missing on this VM; the test auto-detects
  and falls back to `/opt/meta-chromium/chrome` (with its WebGL allowlist
  flags). If system Chrome returns, it is used first.
- This VM's Chrome build blocks `http://127.0.0.1` navigations
  (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`), so the headless test
  loads the build via `file://` with `--allow-file-access-from-files`.
  The Vite build uses `base: "./"` (relative asset paths) to make that
  work; `npm run preview` still serves it over HTTP for real use.
