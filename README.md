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
   Surat Undangan, Surat Pengantar, Surat Keterangan, **Surat Keterangan
   Tidak Mampu (SKTM)**, and SK Pengangkatan Perangkat Desa (prefillable from a personnel record).
   Fill the fields, add a short instruction, get a formal Indonesian draft.
   Editable in place, copy / download `.txt` / **print** (a clean formal
   print layout with the office header), save to the drafts library.
   **Automatic letter numbering** fills the next number
   (`140/001/DS/XI/2026`, per-template counter, yearly reset), and saved
   letters are kept in the **letter archive** (Arsip surat) on the Archive
   tab. **Surat Cepat** (one sentence is enough): describe the letter in
   a single sentence — "Undangan musyawarah desa hari Jumat, 20 November
   2026 jam 09.00 di Balai Desa" — and the app guesses the template and
   pre-fills the form (date, time, place, recipient). The parser is
   **rule-based and 100% offline** (no AI call); the officer always
   reviews the fields before generating the draft, and a field stays
   empty when the sentence does not state it clearly — nothing is ever
   invented.
2. **Summarize** — paste a long document (minutes, regulation, report) and
   get a concise summary. Long documents always route to the cloud
   (on-device inference is capped at 9,216 input tokens).
3. **Procedure Q&A** — answers about KTP, KK, domisili, SKTM, birth/death
   certificates, moving, and business certificates, grounded in a small
   built-in knowledge base (`src/kb.ts`). The guide itself works fully
   offline — in demo mode, Q&A answers come straight from it. Each
   guide entry lists its document requirements as a **tickable checklist**
   (saved in the browser).
4. **Drafts library** — persisted in Firestore (anonymous auth) when
   Firebase is connected, otherwise in localStorage. Search drafts by
   title or text, delete drafts, and download a **data backup (JSON)**
   of all local data (letters, personnel, IKM, complaints, checklists).
5. **Kepegawaian (SIAP AKAD)** — personnel administration for the
   Simpangkatis subdistrict office **and** the village officers of its
   10 villages, adapted from Bos's own SIAP AKAD app ("Sistem Update Data
   Perangkat dan Lembaga Desa"). Two **units**: "Kecamatan" (subdistrict
   office staff — Camat, Sekretaris Kecamatan, Kepala Seksi, Kepala
   Subbagian, Staf Kecamatan) and "Desa" (village officers). Dashboard
   stats, **term-of-office notifications** (expired + expiring within 90
   days), per-unit summary cards and statistics, unit filter, officer
   input form (position options change with the chosen unit), searchable/
   filterable recap table with a Unit column, **detail dialog per
   officer** (NIK, birthplace/date, religion, position, village, phone,
   term dates, status), per-village cards, and the
   6 village institutions (BPD, LPM, PKK, Posyandu, Linmas, Karang
   Taruna). The 23 records (8 subdistrict staff + 15 village officers)
   are **SAMPLE DATA, clearly labelled "Data Contoh — bukan data asli"**
   — the subdistrict names are generic examples, not the real office
   holders; data is stored locally (localStorage, Firestore mirror when
   connected). **Personnel status (Aktif / Akan habis / Habis) is
   computed automatically from the term dates**, filterable in the table.
   The input form validates required fields, a 16-digit NIK, and that the
   term end date is after the start date. "Buat SK" on any row prefills the
   **SK Pengangkatan Perangkat Desa** letter template (village and
   subdistrict positions alike), and "Ringkasan kepegawaian" produces an
   AI summary when Firebase is connected (offline recap otherwise).
6. **Kepuasan — Indeks Kepuasan Masyarakat (IKM)** — community
   satisfaction survey for letter services, per **PermenPAN-RB No.
   14/2017**: 9 service elements (Persyaratan, Prosedur, Waktu
   Pelayanan, Biaya/Tarif, Produk Spesifikasi Jenis Pelayanan,
   Kompetensi Pelaksana, Perilaku Pelaksana, Penanganan Pengaduan,
   Sarana dan Prasarana), scale 1–4. **IKM = mean score × 25 (25–100)**,
   categories A (88,31–100, Sangat Baik), B (76,61–88,30), C
   (65,00–76,60), D (25,00–64,99). Dashboard shows the overall score +
   category, per-element averages with **band colors** (green ≥ 3.5,
   amber 2.5–3.5, red below 2.5 on the 1–4 scale), lowest/highest
   element, and respondent count. Results can be **exported as CSV**.
   **Shareable**: "Bagikan Survei" (Web Share API,
   clipboard fallback, manual-copy fallback) sends the app link +
   invitation; "Bagikan Hasil" shares a text summary of the score.
   The survey also has a **share card** with a deep link
   (`…/desa-ai/#ikm`) and a **QR code** generated locally in the browser
   (no network needed) — copy the link, download the QR as PNG to print
   and stick at the service counter, or share it via WhatsApp. Every
   tab has its own deep link too (`#beranda`, `#surat`, `#ringkas`,
   `#tanya`, `#draf`, `#kepegawaian`, `#ikm`, `#pengaduan`). The
   dashboard is also home to **Anin, the DesaAI guide** — a friendly
   village-clerk mascot (pure inline SVG, no external assets) who greets
   the officer by time of day and always points at the clearest next
   step: new complaints first, then expiring terms of office, then "no
   letters yet today — try Surat Cepat", plus one rotating daily tip
   (backup on Fridays, share the IKM survey, Ctrl+K, …). Empty states
   and the empty-form error carry Anin's next-step line too, so the
   officer is never left staring at a dead end.
10. **Adoption Pack for Other Villages** — DesaAI is free and
    open-source (Apache-2.0), and any village office can adopt it: the
    Home tab has a **Paket Adopsi Desa Lain** card with a 5-step
    checklist (set the letterhead → replace the sample data → share the
    IKM survey → record letters daily → back up weekly) and a button
    that downloads `desaai-paket-adopsi-YYYY-MM-DD.json` — the office
    letterhead, all 7 letter templates, and the checklist. No office
    data is included in the pack. See
    [Adoption in another village](#adoption-in-another-village).
   Respondents may stay anonymous; the 12 seed answers are **SAMPLE
   DATA, clearly labelled**. Each saved letter in the archive has a
   "Beri penilaian" link that opens the IKM tab.
7. **Pengaduan (Complaints)** — report problems with letter services
   (Keterlambatan, Persyaratan tidak jelas, Pelayanan kurang ramah,
   Biaya tidak sesuai, Lainnya), optionally anonymous, with the related
   letter service and an optional phone contact. The office tracks each
   report **Baru → Diproses → Selesai** (status filter + **type filter**,
   per-item status change, **detail dialog per complaint**, per-status
   statistics, **CSV export** of the whole list). The 6 seed complaints are
   **SAMPLE DATA, clearly labelled**. Linked from the IKM tab ("Punya
   keluhan? Sampaikan pengaduan").
8. **Bilingual UI** — English default (required by the rules) with an
   Indonesian toggle. Letters and procedure answers are always in formal
   Indonesian.
9. **Beranda (Home dashboard)** — the default tab: a **bento grid**
   (modular cards of different sizes, the dominant dashboard pattern in
   2026) with today's snapshot — big IKM score card, letters saved
   today, new complaints **with the 3 oldest unresolved complaints listed
   (name, type, days waiting — tap to open the list)**, terms of office needing attention (expired +
   expiring ≤ 90 days, top 3 listed), this month's totals, a
   **hand-rolled SVG IKM trend chart** (cumulative score after each
   answer), and a **printable monthly report** (letters + IKM +
   complaints + personnel snapshot for the running month, **plus a
   "Perlu perhatian" section** naming the oldest open complaints and the
   officers whose terms expire soon, so the paper copy is actionable). A **global
   search** box finds letters/drafts, officers, and complaints from one
   place and jumps straight to the record (officer/complaint detail
   dialog, or the draft itself). A **dark mode** toggle in the header
   switches to a properly designed dark theme (own color tokens, saved
   in localStorage, applied before first paint, follows the device
   scheme when nothing is saved yet). Every tab has its own deep link
   too (`#beranda`, `#surat`, `#ringkas`, `#tanya`, `#draf`,
   `#kepegawaian`, `#ikm`, `#pengaduan`).

The UI is modern and mobile-first: a **photo hero header** — the
Kecamatan Simpangkatis office building as the backdrop, with a dark
emerald gradient overlay so the office logo ("Heritage of
Simpangkatis"), the DesaAI name, and the office identity (Kecamatan
Simpangkatis • Kabupaten Bangka Tengah) stay readable; slim on phones
(~210 px) and taller on desktop (~280 px). Below it, a live
quick-stats strip (letters saved, IKM score, complaints resolved), a
sticky scrollable tab bar with a **subtle glass effect** (translucent +
blurred) where every tab has its own SVG icon + name, gentle panel
transitions (disabled when the user prefers reduced motion), quiet white
stat cards with one colored accent each, large touch targets, and clear
color-coded status chips — while keeping every feature working exactly
as before.

Design references (patterns only, no brands copied — chosen because they
fit a professional government office app: clean, calm, readable):
- **Bento grid** — modular dashboard cards (Apple-popularised, now the
  dominant dashboard layout in 2026; see Midrocket "UI Design Trends
  for 2026" and Arcenik "10 UI Design Trends Dominating 2026").
- **Dark mode as a designed system** — own color tokens per theme, not a
  simple inversion (2026 admin-dashboard standard; see Brucira "Top UI
  Design Trends: Glassmorphism, Dark Mode, Bento Grids and More").
- **Subtle glassmorphism ("glass 2.0")** — translucent layers with blur
  for depth without noise, used only on the sticky tab bar.
- **Fluid typography (clamp) + one big KPI number per card** — the 2026
  admin-dashboard idiom ("fewer, bigger numbers").

## Adoption in another village

DesaAI is built to outlive the hackathon: any village or subdistrict
office can adopt it for free, with no account and no server.

1. Open the live app: <https://kuro1996.github.io/desa-ai/>
2. Set the letterhead (Home tab → Pengaturan Kop Surat): office name,
   address, Camat name and NIP. Empty fields print as "—" — nothing is
   ever invented.
3. Replace the sample data with your own. Every seed record is clearly
   labelled "DATA CONTOH — bukan data asli" and can be edited or
   deleted; the app never treats sample data as real.
4. Share the IKM survey (IKM tab → Bagikan Survei): copy the link or
   print the QR code and stick it at the service counter.
5. Record incoming and outgoing letters in the Mail Register (Agenda
   tab) every day, and download a data backup (Home tab → Data &
   cadangan) every week.

The **Paket Adopsi Desa Lain** card on the Home tab downloads
`desaai-paket-adopsi-YYYY-MM-DD.json` — your letterhead, the 7 letter
templates (with their fields), and the 5-step checklist above, as a
single file you can keep or hand to the next village. The pack contains
no office data (no letters, personnel, survey answers, or complaints).
The source is Apache-2.0: fork it, change the office identity, and make
it yours — <https://github.com/kuro1996/desa-ai>.

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
  Chrome: loads the app, switches through all seven tabs, fills the letter
  form, tests automatic letter numbering, exercises the summarizer and the
  Q&A (offline KB path + syarat checklist), tests the Kepegawaian module
  end to end (23 sample records: 8 subdistrict staff + 15 village
  officers, per-unit stats and filters, notifications incl. kecamatan
  staff, form validation, unit-dependent position options, add/search/
  village/unit/status filters, Buat SK prefill for desa and kecamatan
  records, delete, offline recap), tests the IKM survey end to end
  (12 sample answers, score = mean × 25 verified, category bands,
  share buttons, full-survey submit, exact endpoints all-4 → 100/A and
  all-1 → 25/D), tests the Pengaduan module (6 sample complaints,
  validation, submit, status change, status filter), checks the archive
  "Beri penilaian" link, checks the **deep links** (`#ikm` and
  `#pengaduan` open their tab on load; switching tabs updates the hash),
  checks the **header logo loads** and the **favicon is set**, checks
  **all 7 tabs have an SVG icon + label**, checks the **IKM share card**
  (survey link contains `#ikm`, QR code renders, WhatsApp link, copy
  and download-QR buttons work), checks the **quick-stats strip**
  matches the live data (1 letter, IKM = dashboard score, 2 resolved
  complaints), checks for **no horizontal overflow at 390 px
  phone width**, and checks for **0 console errors / 0 failed requests**
  (excluding this VM's blocked tunnel to Google endpoints — see
  `docs/VERIFICATION.md`). **92/92 checks pass (2026-11-20, run twice).**
- On-device Gemini Nano was **not** verified live: the build VM's headless
  Chrome has no Prompt API / Gemini Nano, so the on-device chip reports
  "not supported here" and every AI call would take the cloud/fallback
  path. The hybrid code path (model creation, `initializeDeviceModel`,
  `inferenceSource` badge) is implemented per the official Firebase docs
  and degrades gracefully — see `docs/VERIFICATION.md` for the honest
  status. To verify on-device inference, open the app in desktop Chrome
  139+ with `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
  enabled and a downloaded Gemini Nano model.
- **Cloud Gemini calls: NOT yet verified end to end.** The Node probe
  (`scripts/node-cloud-test.mjs`) reaches the Google backend, but
  `gemini-3.8-flash` answered HTTP 500 "model is currently experiencing
  high demand" twice and timed out twice (90 s, then 150 s) on 2026-11-20
  (see `docs/VERIFICATION.md`). Retrying later — or from a real browser —
  is the remaining step.

## Architecture

```
index.html            — shell: header chips, 7 tabs, banner
public/logo.png       — office logo ("Heritage of Simpangkatis"),
                        black background made transparent
public/kantor.jpg      — office photo for the hero header (resized to
                        1600 px, JPEG quality 80)
public/favicon.png    — 64×64 favicon (same logo)
src/main.ts           — app wiring (tabs, i18n, feature handlers,
                        kepegawaian, IKM, pengaduan, hash routing,
                        quick-stats strip, QR share card)
src/firebase.ts       — init: App, Auth (anonymous), Firestore,
                        Remote Config, App Check, AI (GoogleAIBackend)
src/ai.ts             — hybrid model, routing decision, streaming
src/kb.ts             — offline procedure knowledge base (KTP, KK, …,
                        + perangkat desa & SK pengangkatan)
src/templates.ts      — letter templates + prompt builder (incl. SK
                        Pengangkatan Perangkat Desa)
src/kepegawaian.ts    — SIAP AKAD module: 15 village + 8 subdistrict
                        sample records, unit dimension, per-unit stats,
                        term-expiry notifications, localStorage store,
                        Firestore mirror (best-effort)
src/ikm.ts            — IKM survey (PermenPAN-RB 14/2017): 9 elements,
                        score = mean x 25, categories A-D, 12 sample
                        answers, share texts, localStorage + mirror
src/qrcode.ts         — vendored QR generator (qrcode-generator 1.4.4,
                        MIT, Kazuhiko Arase) — no npm dependency
src/qr.ts             — QR helpers (SVG + PNG data URL) for the survey
src/pengaduan.ts      — complaints: types, Baru/Diproses/Selesai
                        workflow, 6 sample complaints, localStorage +
                        mirror
src/i18n.ts           — English/Indonesian UI strings
src/drafts.ts         — drafts: Firestore (authed) or localStorage
src/firebase-config.js— web config (PLACEHOLDER, gitignored)
scripts/headless-test.mjs — headless-Chrome UI test (puppeteer-core)
scripts/node-cloud-test.mjs — Node probe for the cloud Gemini path
scripts/live-cloud-test.mjs — browser probe for the cloud Gemini path
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
- **Surat Cepat** (one-sentence letter drafting, offline rules),
  **Anin** (in-app guide with contextual next steps), and the
  **Adoption Pack for Other Villages** (in-app checklist + downloadable
  JSON pack), so the app keeps helping offices after the hackathon ends.
- Apache-2.0 license, this README, and a headless-Chrome verification
  script + report.

## License

Apache-2.0 — see `LICENSE`.
