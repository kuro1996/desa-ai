# DesaAI — AI Clerk for Village Offices

**#BuildHybridAI 2026 entry (Devpost / Google — $30,000 prize pool)**

DesaAI is an offline-first AI clerk for Indonesian village (*desa*) and
subdistrict (*kecamatan*) offices. It drafts formal official letters,
summarizes long documents, and answers procedure questions — using
**Firebase AI Logic hybrid inference**: short, private prompts run
**on-device (Gemini Nano 4)** when available, and long/complex prompts fall
back to **cloud Gemini**. Every answer shows a visible routing badge
("On-device • private" vs "Cloud") plus the fallback reason.

## Features

1. **Draft Letters** — templates for Surat Dinas, Surat Keputusan (SK),
   Surat Undangan, Surat Pengantar, and Surat Keterangan. Fill the fields,
   add a short instruction, get a formal Indonesian draft. Editable in
   place, copy / download `.txt`, save to the drafts library.
2. **Summarize** — paste a long document (minutes, regulation, report) and
   get a concise summary. Long documents always route to the cloud
   (on-device inference is capped at 9,216 input tokens).
3. **Procedure Q&A** — answers about KTP, KK, domisili, SKTM, birth/death
   certificates, moving, and business certificates, grounded in a small
   built-in knowledge base (`src/kb.ts`). The guide itself works fully
   offline — in demo mode, Q&A answers come straight from it.
4. **Drafts library** — persisted in Firestore (anonymous auth) when
   Firebase is connected, otherwise in localStorage.
5. **Bilingual UI** — English default (required by the rules) with an
   Indonesian toggle. Letters and procedure answers are always in formal
   Indonesian.

## How hybrid inference works

- `src/ai.ts` creates the model with
  `mode: InferenceMode.PREFER_ON_DEVICE`, `inCloudParams.model:
  "gemini-3.8-flash"` and `onDeviceParams` (expected text inputs/outputs in
  `en`/`id`, plus a system prompt).
- Before the first query (on a button click, i.e. a user gesture) the app
  calls `model.initializeDeviceModel()` to start the on-device download.
  While it downloads, queries fall back to the cloud automatically.
- Routing decision (`decideRoute`): prompts longer than the Remote Config
  threshold (`on_device_max_chars`, default 12,000 chars) go straight to
  the cloud-only model; short prompts use the hybrid model. The SDK reports
  the real source in `response.inferenceSource`, which the UI displays.
- On-device availability is probed directly with
  `LanguageModel.availability()` and shown in the header chip.
- Cloud model name comes from Remote Config (`cloud_model`, default
  `gemini-3.8-flash`) so it can change without redeploying.
- Backend is the **Gemini Developer API (free tier)** — no Blaze/paid
  features, no image generation.

## Setup (free tier only)

1. Create a Firebase project at <https://console.firebase.google.com> (free
   Spark plan is enough for the Gemini Developer API).
2. In the project directory, provision AI Logic (this is required — config
   files alone do not enable the service):
   ```bash
   npx -y firebase-tools@latest init ailogic
   ```
3. Enable **App Check** in the Firebase console and register a reCAPTCHA
   Enterprise site key. For local development, register a **debug token**
   (Firebase console → App Check → Manage debug tokens) and put it in a
   gitignored `.env` file — never commit it:
   ```
   VITE_APPCHECK_DEBUG_TOKEN=<your debug token>
   ```
4. Copy the Firebase web config into `src/firebase-config.js` (see
   `firebase-config.example.js` for the shape). The real file is gitignored.
5. Install and run:
   ```bash
   npm install
   npm run dev        # local dev server
   npm run build      # production build (must pass)
   npm run preview    # serve the built app
   ```

> **Demo mode:** without a Firebase config the app still runs — the UI,
> templates, offline procedure guide, and local drafts all work. AI
> generation buttons explain that a Firebase project is needed instead of
> failing. The on-device chip will report "not supported here" in browsers
> without the Prompt API.

## Verification (done during the hackathon build)

- `npm run build` passes (`tsc -b && vite build`).
- `npm run test:headless` serves the built app and drives it in headless
  Chrome: loads the app, switches through all four tabs, fills the letter
  form, exercises the summarizer and the Q&A (offline KB path), and checks
  for **0 console errors**.
- On-device Gemini Nano was **not** verified live: the build VM's headless
  Chrome has no Prompt API / Gemini Nano, so the on-device chip reports
  "not supported here" and every AI call would take the cloud/fallback
  path. The hybrid code path (model creation, `initializeDeviceModel`,
  `inferenceSource` badge) is implemented per the official Firebase docs
  and degrades gracefully — see `docs/VERIFICATION.md` for the honest
  status. To verify on-device inference, open the app in desktop Chrome
  139+ with `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
  enabled and a downloaded Gemini Nano model.

## Architecture

```
index.html            — shell: header chips, 4 tabs, banner
src/main.ts           — app wiring (tabs, i18n, feature handlers)
src/firebase.ts       — init: App, Auth (anonymous), Firestore,
                        Remote Config, App Check, AI (GoogleAIBackend)
src/ai.ts             — hybrid model, routing decision, streaming
src/kb.ts             — offline procedure knowledge base (KTP, KK, …)
src/templates.ts      — letter templates + prompt builder
src/i18n.ts           — English/Indonesian UI strings
src/drafts.ts         — drafts: Firestore (authed) or localStorage
src/firebase-config.js— web config (PLACEHOLDER, gitignored)
scripts/headless-test.mjs — headless-Chrome UI test (puppeteer-core)
```

## What was built during the hackathon

- Full web app (Vite + TypeScript + Firebase JS SDK v12) built during the
  #BuildHybridAI 2026 window.
- Firebase AI Logic **hybrid inference** integrated and actually called at
  runtime (not just imported): `PREFER_ON_DEVICE` model, streaming
  responses, `inferenceSource` routing badge + fallback reason.
- Five Indonesian letter templates, a document summarizer, a grounded
  procedure Q&A with an offline knowledge base, and a Firestore/local
  drafts library.
- Bilingual (EN/ID) responsive UI with no external fonts or CDNs beyond the
  Firebase SDK.
- Apache-2.0 license, this README, and a headless-Chrome verification
  script + report.

## License

Apache-2.0 — see `LICENSE`.
