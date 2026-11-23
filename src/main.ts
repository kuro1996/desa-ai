// DesaAI — app wiring: tabs, language toggle, letter drafting,
// document summarizer, procedure Q&A (KB-grounded), drafts library.
import {
  AGENDA_DISPOSISI,
  computeAgendaStats,
  createAgendaEntry,
  filterAgenda,
  isAgendaDemoRecord,
  loadAgenda,
  saveAgenda,
  syncAgendaToFirestore,
  type AgendaArah,
  type AgendaEntry,
  type AgendaStatus,
} from "./agenda";
import {
  BACKUP_MAX_BYTES,
  backupCountsLine,
  backupFilename,
  backupToJson,
  collectBackup,
  validateBackup,
  type DesaaiBackup,
} from "./backup";
import {
  generateStream,
  probeOnDevice,
  warmUpDeviceModel,
  type OnDeviceState,
} from "./ai";
import { countLocalDrafts, deleteDraft, listDrafts, listLocalDrafts, replaceLocalDrafts, saveDraft, type Draft } from "./drafts";
import { getLastFirestoreSync, initFirebase, type FirebaseServices } from "./firebase";
import { t, type Lang } from "./i18n";
import {
  computeIkm,
  IKM_ELEMENTS,
  ikmShareResultsText,
  ikmShareSurveyText,
  loadIkm,
  saveIkm,
  syncIkmToFirestore,
  type IkmResponse,
} from "./ikm";
import { KB, kbEntryToText, matchKb, type KbEntry } from "./kb";
import {
  DEFAULT_LETTERHEAD,
  LETTERHEAD_FIELDS,
  letterheadContactLine,
  loadLetterhead,
  saveLetterhead,
  type LetterheadSettings,
} from "./letterhead";
import {
  AGAMA_LIST,
  buildKepegawaianSummary,
  computeNotifications,
  computeSkReminders,
  computeStats,
  daysUntilEnd,
  DESA_LIST,
  filterPerangkat,
  formatDateId,
  isDemoRecord,
  JABATAN_KECAMATAN,
  JABATAN_LIST,
  KECAMATAN_LABEL,
  LEMBAGA,
  loadPerangkat,
  masaStatus,
  savePerangkat,
  syncPerangkatToFirestore,
  type MasaStatus,
  type Perangkat,
} from "./kepegawaian";
import {
  ADUAN_JENIS,
  computeAduanStats,
  filterAduan,
  isAduanDemoRecord,
  loadAduan,
  saveAduan,
  syncAduanToFirestore,
  type Aduan,
  type AduanStatus,
} from "./pengaduan";
import { buildLetterPrompt, TEMPLATES, type LetterTemplate } from "./templates";
import { makeQr } from "./qr";

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`DesaAI: missing element #${id}`);
  return el as T;
};

let lang: Lang = "en";
let svc: FirebaseServices | null = null;
let onDevice: OnDeviceState = "unsupported";
let currentTemplate: LetterTemplate = TEMPLATES[0];
let lastLetterText = "";
let lastSummaryText = "";

// ---------- language ----------

function applyLang(): void {
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key, lang);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-ph]").forEach((el) => {
    const key = el.dataset.i18nPh;
    if (key) (el as HTMLInputElement).placeholder = t(key, lang);
  });
  $("lang-toggle").textContent =
    lang === "en" ? "🇮🇩 Bahasa Indonesia" : "🇬🇧 English";
  updateThemeButton();
  updateModeButton();
  renderTemplateSelect();
  renderLetterFields();
  renderKbList();
  renderQaSuggestions();
  renderKepegawaian();
  renderIkm();
  renderPengaduan();
  renderHome();
  setNetChip();
  void refreshDrafts();
  // Paket 15 — keep an open print preview (with the officer's edits) when
  // the language toggles; field values live in printForm, so rebuild is safe.
  if (currentPrintDraft) {
    buildArchivePrintFields();
    renderArchiveSheet();
  }
}

// ---------- theme (dark mode) ----------

const THEME_KEY = "desaai-theme-v1";

function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function updateThemeButton(): void {
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.setAttribute(
      "aria-label",
      t(currentTheme() === "dark" ? "themeLight" : "themeDark", lang),
    );
  }
}

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable — the theme still applies for this session.
  }
  updateThemeButton();
}

// ---------- tabs + deep links (hash routing) ----------

// Short, shareable hashes per tab — e.g. .../desa-ai/#ikm opens the IKM
// survey directly. The survey link shared with residents is app URL + #ikm.
const TAB_HASHES: Record<string, string> = {
  beranda: "home",
  surat: "letters",
  ringkas: "summarize",
  tanya: "qa",
  draf: "drafts",
  kepegawaian: "kepegawaian",
  ikm: "ikm",
  pengaduan: "pengaduan",
  agenda: "agenda",
};
const HASH_BY_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_HASHES).map(([h, tab]) => [tab, h]),
);

/** Survey deep link: current app URL (no hash) + #ikm. */
function surveyLink(): string {
  return `${window.location.href.split("#")[0]}#ikm`;
}

function activateTab(tab: string, updateHash = true): void {
  document.querySelectorAll(".tab").forEach((b) => {
    const isActive = (b as HTMLButtonElement).dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  document.querySelectorAll<HTMLElement>(".panel").forEach((p) => {
    p.hidden = p.id !== `panel-${tab}`;
  });
  if (tab === "drafts") void refreshDrafts();
  if (tab === "home") renderHome();
  if (tab === "kepegawaian") renderKepegawaian();
  if (tab === "ikm") renderIkm();
  if (tab === "pengaduan") renderPengaduan();
  if (tab === "agenda") renderAgenda();
  // A detail dialog belongs to its tab — close it when leaving the tab.
  document.querySelectorAll("dialog[open]").forEach((d) => {
    (d as HTMLDialogElement).close();
  });
  if (updateHash) {
    history.replaceState(null, "", `#${HASH_BY_TAB[tab] ?? tab}`);
  }
}

function tabFromHash(): string | null {
  return TAB_HASHES[window.location.hash.slice(1)] ?? null;
}

function initTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (tab) activateTab(tab);
    });
  });
  window.addEventListener("hashchange", () => {
    const tab = tabFromHash();
    if (tab) activateTab(tab, false);
  });
}

// ---------- command palette (Ctrl+K) — Paket 7 ----------

interface PaletteCmd {
  id: string;
  label: () => string;
  run: () => void;
}

function paletteCommands(): PaletteCmd[] {
  const cmds: PaletteCmd[] = [];
  // One entry per tab — label read live from the tab button so it follows
  // the active language without a second string table.
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    const tabId = btn.dataset.tab;
    if (!tabId) return;
    cmds.push({
      id: `tab-${tabId}`,
      label: () => btn.textContent?.trim() ?? tabId,
      run: () => activateTab(tabId),
    });
  });
  cmds.push(
    { id: "cmd-new-letter", label: () => t("cmdNewLetter", lang), run: () => activateTab("letters") },
    { id: "cmd-new-agenda", label: () => t("cmdNewAgenda", lang), run: () => activateTab("agenda") },
    { id: "cmd-new-aduan", label: () => t("cmdNewAduan", lang), run: () => activateTab("pengaduan") },
    { id: "cmd-fill-ikm", label: () => t("cmdFillIkm", lang), run: () => activateTab("ikm") },
    { id: "cmd-print-report", label: () => t("cmdPrintReport", lang), run: () => printMonthlyReport() },
    {
      id: "cmd-backup",
      label: () => t("cmdBackup", lang),
      run: () => {
        activateTab("home");
        document.getElementById("home-backup-export")?.click();
      },
    },
    {
      id: "cmd-letterhead",
      label: () => t("cmdLetterhead", lang),
      run: () => {
        activateTab("home");
        document
          .getElementById("home-letterhead-card")
          ?.scrollIntoView({ block: "start" });
        (
          document.getElementById("home-lh-camat-nama") as HTMLInputElement | null
        )?.focus();
      },
    },
    {
      id: "cmd-theme",
      label: () => t("cmdTheme", lang),
      run: () => applyTheme(currentTheme() === "dark" ? "light" : "dark"),
    },
    {
      id: "cmd-lang",
      label: () => t("cmdLang", lang),
      run: () => {
        lang = lang === "en" ? "id" : "en";
        applyLang();
      },
    },
  );
  return cmds;
}

let paletteSelected = 0;
let paletteVisible: PaletteCmd[] = [];

function renderPaletteList(): void {
  const list = $("palette-list");
  list.innerHTML = "";
  const q = ($("palette-input") as HTMLInputElement).value.trim().toLowerCase();
  paletteVisible = paletteCommands().filter((c) =>
    q === "" ? true : c.label().toLowerCase().includes(q),
  );
  if (paletteVisible.length === 0) {
    const li = document.createElement("li");
    li.className = "palette-empty";
    li.textContent = t("paletteEmpty", lang);
    list.appendChild(li);
    paletteSelected = -1;
    return;
  }
  if (paletteSelected < 0 || paletteSelected >= paletteVisible.length) {
    paletteSelected = 0;
  }
  paletteVisible.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = `palette-item${i === paletteSelected ? " selected" : ""}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === paletteSelected ? "true" : "false");
    li.textContent = c.label();
    li.addEventListener("click", () => {
      paletteSelected = i;
      runPaletteCmd(c);
    });
    list.appendChild(li);
  });
}

function runPaletteCmd(cmd: PaletteCmd): void {
  ($("palette") as HTMLDialogElement).close();
  cmd.run();
}

function openPalette(): void {
  paletteSelected = 0;
  ($("palette-input") as HTMLInputElement).value = "";
  renderPaletteList();
  const dlg = $("palette") as HTMLDialogElement;
  if (!dlg.open) dlg.showModal();
  ($("palette-input") as HTMLInputElement).focus();
}

function initPalette(): void {
  $("palette-open").addEventListener("click", openPalette);
  document.addEventListener("keydown", (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      openPalette();
    }
  });
  const dlg = $("palette") as HTMLDialogElement;
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) dlg.close();
  });
  $("palette-input").addEventListener("input", () => {
    paletteSelected = 0;
    renderPaletteList();
  });
  $("palette-input").addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      paletteSelected = Math.min(paletteSelected + 1, paletteVisible.length - 1);
      renderPaletteList();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      paletteSelected = Math.max(paletteSelected - 1, 0);
      renderPaletteList();
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      const cmd = paletteVisible[paletteSelected];
      if (cmd) runPaletteCmd(cmd);
    }
  });
}

// ---------- citizen mode (Mode Warga) — Paket 7 ----------

const MODE_KEY = "desaai-mode-v1";
type AppMode = "petugas" | "warga";
let appMode: AppMode = "petugas";

// Officer-only tabs — hidden from the nav while in citizen mode.
const OFFICER_TABS = ["letters", "summarize", "drafts", "kepegawaian", "agenda"];

function updateModeButton(): void {
  $("mode-toggle-label").textContent = t(
    appMode === "warga" ? "modePetugas" : "modeWarga",
    lang,
  );
}

function applyMode(mode: AppMode): void {
  appMode = mode;
  document.body.classList.toggle("mode-warga", mode === "warga");
  $("home-warga-card").hidden = mode !== "warga";
  updateModeButton();
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Storage unavailable — the mode still applies for this session.
  }
  if (mode === "warga") {
    const active = document.querySelector<HTMLButtonElement>(".tab.active");
    const tab = active?.dataset.tab ?? "home";
    if (OFFICER_TABS.includes(tab)) activateTab("home");
  }
}

function initMode(): void {
  let saved: AppMode = "petugas";
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === "warga" || raw === "petugas") saved = raw;
  } catch {
    // Storage unavailable — officer mode by default.
  }
  applyMode(saved);
  $("mode-toggle").addEventListener("click", () =>
    applyMode(appMode === "warga" ? "petugas" : "warga"),
  );
  $("warga-go-ikm").addEventListener("click", () => activateTab("ikm"));
  $("warga-go-aduan").addEventListener("click", () => activateTab("pengaduan"));
  $("warga-go-qa").addEventListener("click", () => activateTab("qa"));
}

// ---------- complaints-by-type chart (home) — Paket 7 ----------

function renderAduanChart(): void {
  const wrap = $("home-aduan-chart");
  const items = loadAduan();
  $("home-aduan-chart-empty").hidden = items.length > 0;
  wrap.innerHTML = "";
  if (items.length === 0) return;
  const counts = ADUAN_JENIS.map((j) => items.filter((a) => a.jenis === j).length);
  const max = Math.max(1, ...counts);
  ADUAN_JENIS.forEach((j, i) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    const label = document.createElement("span");
    label.className = "chart-label";
    label.textContent = t(`aduJenis${i + 1}`, lang);
    const track = document.createElement("div");
    track.className = "chart-track";
    const fill = document.createElement("div");
    fill.className = "chart-fill";
    fill.style.width = `${Math.round((counts[i] / max) * 100)}%`;
    track.appendChild(fill);
    const value = document.createElement("span");
    value.className = "chart-value";
    value.dataset.count = String(counts[i]);
    value.textContent = String(counts[i]);
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    wrap.appendChild(row);
  });
}

// ---------- quick-stats strip (live counts from existing data) ----------

function renderQuickStats(): void {
  $("qs-letters").textContent = String(countLocalDrafts("letter"));
  const ikmStats = computeIkm(loadIkm());
  $("qs-ikm").textContent =
    ikmStats.count === 0 ? "–" : ikmFmt(ikmStats.overall);
  const aduStats = computeAduanStats(loadAduan());
  $("qs-aduan").textContent = String(aduStats.selesai);
}

// ---------- home dashboard (bento) + global search + monthly report ----------

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inMonth(ts: number, now = new Date()): boolean {
  const d = new Date(ts);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function monthNameId(d = new Date()): string {
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Cumulative IKM score after each answer (answers sorted by date). */
function ikmTrendPoints(
  items: IkmResponse[],
): Array<{ date: string; score: number; count: number }> {
  const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
  return sorted.map((r, i) => ({
    date: new Date(r.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
    score: computeIkm(sorted.slice(0, i + 1)).overall,
    count: i + 1,
  }));
}

function renderTrend(): void {
  const wrap = $("home-ikm-trend");
  const pts = ikmTrendPoints(loadIkm());
  $("home-trend-empty").hidden = pts.length >= 2;
  if (pts.length < 2) {
    wrap.innerHTML = "";
    return;
  }
  // Hand-rolled SVG line chart (no dependency): score 25–100 on the Y axis.
  const W = 600;
  const H = 180;
  const L = 40;
  const R = 10;
  const T = 14;
  const B = 26;
  const y = (s: number): number => T + (1 - (s - 25) / 75) * (H - T - B);
  const x = (i: number): number => L + (i / (pts.length - 1)) * (W - L - R);
  const grid = [25, 50, 75, 100]
    .map(
      (v) =>
        `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" class="trend-grid"/>` +
        `<text x="${L - 6}" y="${y(v) + 4}" class="trend-axis" text-anchor="end">${v}</text>`,
    )
    .join("");
  const line = pts
    .map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
    .join(" ");
  const circles = pts
    .map(
      (p, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(p.score).toFixed(1)}" r="4" ` +
        `data-score="${p.score.toFixed(2)}" data-date="${p.date}">` +
        `<title>${p.date}: ${ikmFmt(p.score)} (${p.count})</title></circle>`,
    )
    .join("");
  wrap.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren IKM" ` +
    `preserveAspectRatio="none" style="width:100%;height:auto;display:block">` +
    `${grid}<polyline points="${line}" class="trend-line"/>${circles}` +
    `<text x="${L}" y="${H - 6}" class="trend-axis">${pts[0].date}</text>` +
    `<text x="${W - R}" y="${H - 6}" class="trend-axis" text-anchor="end">${pts[pts.length - 1].date}</text>` +
    `</svg>`;
}

interface MonthlyReport {
  monthLabel: string;
  letters: number;
  agsMasuk: number;
  agsKeluar: number;
  agsBaru: number;
  agsDiproses: number;
  agsSelesai: number;
  ikmCount: number;
  ikmScore: number;
  ikmCat: string;
  aduTotal: number;
  aduBaru: number;
  aduDiproses: number;
  aduSelesai: number;
  kegTotal: number;
  kegAktif: number;
  kegAkan: number;
  kegHabis: number;
}

function monthlyReportData(now = new Date()): MonthlyReport {
  const letters = listLocalDrafts().filter(
    (d) => d.kind === "letter" && inMonth(d.createdAt, now),
  ).length;
  const ikmMonth = loadIkm().filter((r) => inMonth(r.createdAt, now));
  const ikmStats = computeIkm(ikmMonth);
  const aduMonth = loadAduan().filter((a) => inMonth(a.createdAt, now));
  const aduStats = computeAduanStats(aduMonth);
  const keg = computeStats(loadPerangkat(), now);
  // Mail register for the month, by letter date (tanggal), not record date.
  const agsMonth = loadAgenda().filter((e) => inMonth(e.tanggal, now));
  return {
    monthLabel: monthNameId(now),
    letters,
    agsMasuk: agsMonth.filter((e) => e.arah === "masuk").length,
    agsKeluar: agsMonth.filter((e) => e.arah === "keluar").length,
    agsBaru: agsMonth.filter((e) => e.status === "baru").length,
    agsDiproses: agsMonth.filter((e) => e.status === "diproses").length,
    agsSelesai: agsMonth.filter((e) => e.status === "selesai").length,
    ikmCount: ikmMonth.length,
    ikmScore: ikmStats.overall,
    ikmCat: ikmStats.category,
    aduTotal: aduMonth.length,
    aduBaru: aduStats.baru,
    aduDiproses: aduStats.diproses,
    aduSelesai: aduStats.selesai,
    kegTotal: keg.total,
    kegAktif: keg.aktif,
    kegAkan: keg.akanHabis,
    kegHabis: keg.habis,
  };
}

function renderReportPreview(): void {
  const d = monthlyReportData();
  const preview = $("home-report-preview");
  preview.innerHTML = "";
  const rows: Array<[string, string]> = [
    [t("homeMonthLetters", lang), String(d.letters)],
    [
      t("tabAgenda", lang),
      `${d.agsMasuk} masuk · ${d.agsKeluar} keluar (${t("aduStatusBaru", lang)} ${d.agsBaru} · ${t("aduStatusDiproses", lang)} ${d.agsDiproses} · ${t("aduStatusSelesai", lang)} ${d.agsSelesai})`,
    ],
    [
      t("homeMonthIkm", lang),
      `${d.ikmCount} — IKM ${d.ikmCount === 0 ? "–" : ikmFmt(d.ikmScore)} (${d.ikmCat})`,
    ],
    [
      t("homeMonthAduan", lang),
      `${d.aduTotal} (${t("aduStatusBaru", lang)} ${d.aduBaru} · ${t("aduStatusDiproses", lang)} ${d.aduDiproses} · ${t("aduStatusSelesai", lang)} ${d.aduSelesai})`,
    ],
    [
      t("kegTitle", lang).split("—")[0].trim(),
      `${d.kegTotal} — ${t("kegStatusAktif", lang)} ${d.kegAktif} · ${t("kegStatusAkanHabis", lang)} ${d.kegAkan} · ${t("kegStatusHabis", lang)} ${d.kegHabis}`,
    ],
  ];
  for (const [k, v] of rows) {
    const p = document.createElement("p");
    p.className = "report-row";
    const strong = document.createElement("strong");
    strong.textContent = k;
    const span = document.createElement("span");
    span.textContent = v;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(": "));
    p.appendChild(span);
    preview.appendChild(p);
  }
}

// ---------- Paket 18 — Grafik Tren Bulanan (6 bulan terakhir) ----------
// Grouped bars, hand-rolled SVG like the IKM trend (no dependency).
// Four series, all counted from local data only: letters saved
// (listLocalDrafts kind "letter", by createdAt), mail register in/out
// (loadAgenda, by tanggal), complaints (loadAduan, by createdAt).
// A month with no entries shows 0 — never invented.

interface MonthlyTrendPoint {
  label: string;
  surat: number;
  masuk: number;
  keluar: number;
  aduan: number;
}

type MonthlyTrendKey = "surat" | "masuk" | "keluar" | "aduan";

function monthlyTrendData(now = new Date()): MonthlyTrendPoint[] {
  const months: Array<{ y: number; m: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() });
  }
  const inYM = (ts: number, y: number, m: number): boolean => {
    const d = new Date(ts);
    return d.getFullYear() === y && d.getMonth() === m;
  };
  const letters = listLocalDrafts().filter((d) => d.kind === "letter");
  const agenda = loadAgenda();
  const aduan = loadAduan();
  return months.map(({ y, m }) => ({
    label: new Date(y, m, 1).toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    }),
    surat: letters.filter((d) => inYM(d.createdAt, y, m)).length,
    masuk: agenda.filter((e) => e.arah === "masuk" && inYM(e.tanggal, y, m)).length,
    keluar: agenda.filter((e) => e.arah === "keluar" && inYM(e.tanggal, y, m)).length,
    aduan: aduan.filter((a) => inYM(a.createdAt, y, m)).length,
  }));
}

/** Integer grid step so the Y axis never shows fractions (counts are whole). */
function monthlyTrendStep(max: number): number {
  const target = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(1, target))));
  for (const mult of [1, 2, 5, 10]) {
    if (mult * pow >= target) return Math.max(1, mult * pow);
  }
  return Math.max(1, 10 * pow);
}

function renderMonthlyTrend(): void {
  const wrap = $("home-month-trend");
  const pts = monthlyTrendData();
  const series: Array<{ key: MonthlyTrendKey; label: string }> = [
    { key: "surat", label: t("mtrendSurat", lang) },
    { key: "masuk", label: t("mtrendMasuk", lang) },
    { key: "keluar", label: t("mtrendKeluar", lang) },
    { key: "aduan", label: t("mtrendAduan", lang) },
  ];
  const max = Math.max(1, ...pts.flatMap((p) => series.map((s) => p[s.key])));
  const step = monthlyTrendStep(max);
  const top = Math.ceil(max / step) * step;
  const W = 640;
  const H = 220;
  const L = 36;
  const R = 8;
  const T = 20;
  const B = 30;
  const y = (v: number): number => T + (1 - v / top) * (H - T - B);
  const groupW = (W - L - R) / pts.length;
  const barW = 12;
  const gap = 3;
  const contentW = series.length * barW + (series.length - 1) * gap;
  const grid: string[] = [];
  for (let v = 0; v <= top; v += step) {
    grid.push(
      `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" class="trend-grid"/>` +
        `<text x="${L - 6}" y="${y(v) + 4}" class="trend-axis" text-anchor="end">${v}</text>`,
    );
  }
  const bars: string[] = [];
  pts.forEach((p, i) => {
    const gx = L + i * groupW + (groupW - contentW) / 2;
    series.forEach((s, j) => {
      const v = p[s.key];
      const bx = gx + j * (barW + gap);
      bars.push(
        `<rect x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${barW}" ` +
          `height="${(y(0) - y(v)).toFixed(1)}" class="mtrend-bar-${j}" ` +
          `data-month="${i}" data-series="${s.key}" data-value="${v}">` +
          `<title>${p.label} — ${s.label}: ${v}</title></rect>`,
      );
      bars.push(
        `<text x="${(bx + barW / 2).toFixed(1)}" y="${(y(v) - 4).toFixed(1)}" ` +
          `class="mtrend-value" text-anchor="middle">${v}</text>`,
      );
    });
    bars.push(
      `<text x="${(L + i * groupW + groupW / 2).toFixed(1)}" y="${H - 8}" ` +
        `class="trend-axis" text-anchor="middle">${p.label}</text>`,
    );
  });
  wrap.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren bulanan" ` +
    `preserveAspectRatio="none" style="width:100%;height:auto;display:block">` +
    `${grid.join("")}${bars.join("")}` +
    `</svg>`;
}

// ---------- Paket 16 — "Perlu Ditindaklanjuti" ----------
// One list of everything still needing officer action, oldest first:
// open complaints + open mail-register items. A register entry for an
// incoming letter without a disposition is flagged "Belum didisposisi"
// (the disposition itself is the missing action). Local data only, so
// it works fully offline — same sources as the monthly report.

interface FollowUpItem {
  kind: "pengaduan" | "agenda" | "kepegawaian";
  id: string;
  title: string;
  date: number; // createdAt (complaint) / tanggal (register) / masaSelesai (SK)
  status: AduanStatus | AgendaStatus | "habis" | "akan-habis";
  needDisposisi: boolean;
  skDays?: number; // days until SK expiry (negative = expired) — kepegawaian only
}

function followUpItems(): FollowUpItem[] {
  const items: FollowUpItem[] = [];
  for (const a of loadAduan()) {
    if (a.status === "selesai") continue;
    items.push({
      kind: "pengaduan",
      id: a.id,
      title: `${a.nama || t("ikmAnon", lang)} — ${a.jenis}`,
      date: a.createdAt,
      status: a.status,
      needDisposisi: false,
    });
  }
  for (const e of loadAgenda()) {
    if (e.status === "selesai") continue;
    items.push({
      kind: "agenda",
      id: e.id,
      title: `${e.nomorAgenda} — ${e.perihal}`,
      date: e.tanggal,
      status: e.status,
      needDisposisi: e.arah === "masuk" && e.disposisi === "",
    });
  }
  // Paket 20 — expired / soon-expiring staff decrees (SK) join the list.
  // Sort key is the SK end date, so the most overdue SK sorts first.
  for (const n of computeSkReminders(loadPerangkat())) {
    items.push({
      kind: "kepegawaian",
      id: n.perangkat.id,
      title: `${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa}`,
      date: new Date(`${n.perangkat.masaSelesai}T00:00:00`).getTime(),
      status: n.kind,
      needDisposisi: false,
      skDays: n.days,
    });
  }
  return items.sort((a, b) => a.date - b.date);
}

function renderFollowUp(): void {
  const items = followUpItems();
  const nAduan = items.filter((i) => i.kind === "pengaduan").length;
  const nAgenda = items.filter((i) => i.kind === "agenda").length;
  const nSk = items.filter((i) => i.kind === "kepegawaian").length;
  const nDisp = items.filter((i) => i.needDisposisi).length;
  $("home-followup-count").textContent = String(items.length);
  $("home-followup-summary").textContent =
    `${nAduan} ${t("homeFollowupAduan", lang)} · ${nAgenda} ${t("homeFollowupAgenda", lang)}` +
    (nSk > 0 ? ` · ${nSk} ${t("homeFollowupSk", lang)}` : "") +
    (nDisp > 0 ? ` · ${nDisp} ${t("homeFollowupNoDisposisi", lang)}` : "");
  const list = $("home-followup-list");
  list.innerHTML = "";
  $("home-followup-empty").hidden = items.length > 0;
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "notif-item followup-item";
    li.dataset.tab = item.kind;
    li.dataset.id = item.id;
    const strong = document.createElement("strong");
    strong.textContent = item.title;
    li.appendChild(strong);
    const detail = document.createElement("span");
    const dateStr = new Date(item.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (item.kind === "kepegawaian") {
      const d = item.skDays ?? 0;
      detail.textContent =
        `${t("homeFollowupSk", lang)} · ` +
        (d < 0
          ? `${t("kegSkHabis", lang)} ${-d} ${t("kegNotifDaysAgo", lang)}`
          : `${t("kegSkAkanHabis", lang)} ${d} ${t("kegNotifDays", lang)}`) +
        ` (${dateStr})`;
    } else {
      const days = Math.max(
        0,
        Math.floor((Date.now() - item.date) / 86_400_000),
      );
      const statusLabel =
        item.status === "baru"
          ? t("aduStatusBaru", lang)
          : t("aduStatusDiproses", lang);
      detail.textContent =
        `${item.kind === "pengaduan" ? t("tabPengaduan", lang) : t("tabAgenda", lang)} · ` +
        statusLabel +
        (item.needDisposisi ? ` · ${t("homeFollowupNoDisposisi", lang)}` : "") +
        ` · ${days} ${t("homeAduanWaiting", lang)} (${dateStr})`;
    }
    li.appendChild(detail);
    list.appendChild(li);
  }
}

function printMonthlyReport(): void {
  const d = monthlyReportData();
  $("report-print-title").textContent = `Laporan Bulanan — ${d.monthLabel}`;
  $("report-print-date").textContent = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Attention list for the printed file: oldest open complaints + terms
  // expiring soon, so the paper copy is actionable, not just counts.
  const attention: string[] = [];
  const openAduan = loadAduan()
    .filter((a) => a.status !== "selesai")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 5);
  for (const a of openAduan) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - a.createdAt) / 86_400_000),
    );
    attention.push(
      `- ${a.nama || "Anonim"} — ${a.jenis} (${new Date(a.createdAt).toLocaleDateString("id-ID")}, ${days} hari menunggu)`,
    );
  }
  for (const n of computeNotifications(loadPerangkat(), new Date()).slice(0, 5)) {
    attention.push(
      n.kind === "habis"
        ? `- ${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa} (masa bhakti habis ${formatDateId(n.perangkat.masaSelesai)})`
        : `- ${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa} (masa bhakti habis ${formatDateId(n.perangkat.masaSelesai)}, ${n.days} hari lagi)`,
    );
  }
  $("report-print-body").textContent = [
    `Surat tersimpan bulan ini: ${d.letters}`,
    `Agenda surat bulan ini: masuk ${d.agsMasuk}, keluar ${d.agsKeluar} (Baru ${d.agsBaru}, Diproses ${d.agsDiproses}, Selesai ${d.agsSelesai})`,
    `IKM: skor ${d.ikmCount === 0 ? "–" : ikmFmt(d.ikmScore)} (kategori ${d.ikmCat}), ${d.ikmCount} responden`,
    `Pengaduan bulan ini: ${d.aduTotal} (Baru ${d.aduBaru}, Diproses ${d.aduDiproses}, Selesai ${d.aduSelesai})`,
    `Kepegawaian: ${d.kegTotal} pegawai — aktif ${d.kegAktif}, akan habis ${d.kegAkan}, habis ${d.kegHabis}`,
    "",
    "Perlu perhatian:",
    ...(attention.length > 0 ? attention : ["- Tidak ada."]),
    "",
    "Data contoh ditandai pada masing-masing modul (bukan data asli).",
  ].join("\n");
  document.body.dataset.printTarget = "report";
  window.print();
  setStatus($("home-report-status"), t("homeReportPrinted", lang));
}

// Paket 13 — export the monthly report as a comma-separated CSV (header
// Bahasa Indonesia). Local data only, so it works fully offline — no
// Firebase call, same sources as the on-screen recap + mail register.
function monthlyReportCsv(now = new Date()): { filename: string; text: string } {
  const d = monthlyReportData(now);
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows: Array<[string, string, string]> = [
    ["Surat", "Surat tersimpan bulan ini", String(d.letters)],
    ["Agenda", "Surat masuk bulan ini", String(d.agsMasuk)],
    ["Agenda", "Surat keluar bulan ini", String(d.agsKeluar)],
    ["Agenda", "Agenda berstatus Baru", String(d.agsBaru)],
    ["Agenda", "Agenda berstatus Diproses", String(d.agsDiproses)],
    ["Agenda", "Agenda berstatus Selesai", String(d.agsSelesai)],
    ["IKM", "Responden bulan ini", String(d.ikmCount)],
    ["IKM", "Skor IKM rata-rata", d.ikmCount === 0 ? "–" : d.ikmScore.toFixed(2)],
    ["IKM", "Kategori IKM", d.ikmCat],
    ["Pengaduan", "Total pengaduan bulan ini", String(d.aduTotal)],
    ["Pengaduan", "Berstatus Baru", String(d.aduBaru)],
    ["Pengaduan", "Berstatus Diproses", String(d.aduDiproses)],
    ["Pengaduan", "Berstatus Selesai", String(d.aduSelesai)],
    ["Kepegawaian", "Total pegawai", String(d.kegTotal)],
    ["Kepegawaian", "Aktif", String(d.kegAktif)],
    ["Kepegawaian", "Akan habis masa bhakti", String(d.kegAkan)],
    ["Kepegawaian", "Masa bhakti habis", String(d.kegHabis)],
  ];
  const lines = [
    `Laporan Bulanan,${d.monthLabel}`,
    "Kecamatan Simpangkatis,Kabupaten Bangka Tengah",
    "",
    "Bagian,Metrik,Nilai",
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  return { filename: `laporan-bulanan-${ym}.csv`, text: lines.join("\n") };
}

function exportMonthlyReportCsv(): void {
  const { filename, text } = monthlyReportCsv();
  downloadFile(filename, text, "text/csv;charset=utf-8");
  setStatus($("home-report-status"), `${t("homeReportExported", lang)} ${filename}`);
}

// ---------- Backup & Restore (Paket 14) ----------

let pendingBackup: DesaaiBackup | null = null;
/** Merged drafts count (local + Firestore), refreshed by refreshDrafts(). */
let mergedDraftCount: number | null = null;

function backupCounts(): {
  surat: number;
  pegawai: number;
  ikm: number;
  pengaduan: number;
  agenda: number;
} {
  return {
    surat: mergedDraftCount ?? listLocalDrafts().length,
    pegawai: loadPerangkat().length,
    ikm: loadIkm().length,
    pengaduan: loadAduan().length,
    agenda: loadAgenda().length,
  };
}

function renderBackupCard(): void {
  const el = document.getElementById("home-backup-counts");
  if (el) el.textContent = backupCountsLine(backupCounts(), lang);
}

// ---------- Paket 17 — Pengaturan Kop Surat ----------

const LETTERHEAD_INPUT_IDS: Record<keyof LetterheadSettings, string> = {
  instansi1: "home-lh-instansi1",
  instansi2: "home-lh-instansi2",
  alamat: "home-lh-alamat",
  telepon: "home-lh-telepon",
  email: "home-lh-email",
  camatNama: "home-lh-camat-nama",
  camatNip: "home-lh-camat-nip",
  sekretarisNama: "home-lh-sekretaris-nama",
};

function renderLetterheadForm(): void {
  const lh = loadLetterhead();
  for (const key of LETTERHEAD_FIELDS) {
    const input = document.getElementById(
      LETTERHEAD_INPUT_IDS[key],
    ) as HTMLInputElement | null;
    if (input) input.value = lh[key];
  }
}

function saveLetterheadForm(): void {
  const next: LetterheadSettings = { ...DEFAULT_LETTERHEAD };
  for (const key of LETTERHEAD_FIELDS) {
    const input = document.getElementById(
      LETTERHEAD_INPUT_IDS[key],
    ) as HTMLInputElement | null;
    if (input) next[key] = input.value;
  }
  saveLetterhead(next);
  setStatus($("home-letterhead-status"), t("homeLetterheadSaved", lang));
  // A print preview already open on the drafts tab re-renders with the
  // new kop right away — no need to reopen it.
  if (currentPrintDraft) renderArchiveSheet();
}

async function exportBackup(): Promise<void> {
  const status = $("home-backup-status");
  try {
    const backup = await collectBackup(svc);
    const filename = backupFilename();
    downloadFile(filename, backupToJson(backup), "application/json;charset=utf-8");
    setStatus(status, `${t("homeBackupExported", lang)} ${filename}`);
  } catch (e) {
    console.warn("DesaAI: backup export failed.", e);
    setStatus(status, t("homeBackupReadFail", lang), true);
  }
  renderBackupCard();
}

function resetBackupFileInput(): void {
  ($("home-backup-file") as HTMLInputElement).value = "";
}

function hideBackupConfirm(): void {
  $("home-backup-confirm").hidden = true;
  pendingBackup = null;
}

async function handleBackupFile(file: File): Promise<void> {
  const status = $("home-backup-status");
  hideBackupConfirm();
  if (file.size > BACKUP_MAX_BYTES) {
    setStatus(status, t("homeBackupTooBig", lang), true);
    resetBackupFileInput();
    return;
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    setStatus(status, t("homeBackupReadFail", lang), true);
    resetBackupFileInput();
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    setStatus(status, t("homeBackupInvalid", lang), true);
    resetBackupFileInput();
    return;
  }
  const result = validateBackup(parsed, lang);
  if (!result.ok) {
    setStatus(
      status,
      `${t("homeBackupInvalid", lang)} ${result.errors[0] ?? ""}`,
      true,
    );
    resetBackupFileInput();
    return;
  }
  pendingBackup = result.backup;
  const d = new Date(result.backup.exportedAt);
  const dateStr = Number.isNaN(d.getTime())
    ? result.backup.exportedAt
    : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  $("home-backup-confirm-text").textContent =
    `${t("homeBackupConfirmQ", lang)} — ${dateStr} · ${backupCountsLine(result.backup.counts, lang)}`;
  $("home-backup-confirm").hidden = false;
  setStatus(status, "");
}

/** Replace all local collections with the validated backup, then let the
 * existing Firestore mirrors follow (same paths as normal edits). */
async function applyBackup(backup: DesaaiBackup): Promise<void> {
  saveAgenda(backup.collections.agenda);
  saveIkm(backup.collections.ikm);
  saveAduan(backup.collections.pengaduan);
  savePerangkat(backup.collections.pegawai);
  // Paket 17 — letterhead settings travel with the backup when present
  // (older v1 backups simply have none — the current settings stay).
  if (backup.collections.pengaturan) {
    saveLetterhead(backup.collections.pengaturan);
    renderLetterheadForm();
  }
  // Letters: replace the local archive, but skip drafts that already
  // exist in Firestore — otherwise the merged library would show them
  // twice. On a fresh browser (different anonymous uid) nothing is
  // skipped, so the letters are fully recovered locally.
  const current = await listDrafts(svc);
  const currentIds = new Set(current.map((d) => d.id));
  replaceLocalDrafts(
    backup.collections.surat.filter(
      (d) => d.source === "local" || !currentIds.has(d.id),
    ),
  );
  mergedDraftCount = null;
  syncAllToFirestore();
  await refreshDrafts();
  renderHome();
  renderKepegawaian();
  renderIkm();
  renderPengaduan();
  renderAgenda();
}

let homeSearchQuery = "";

function renderHomeSearch(): void {
  const wrap = $("home-search-results");
  const q = homeSearchQuery.trim().toLowerCase();
  wrap.innerHTML = "";
  if (!q) return;
  const groups: Array<{
    key: string;
    items: Array<{ label: string; sub: string; go: () => void }>;
  }> = [
    {
      key: "homeSearchLetters",
      items: listLocalDrafts()
        .filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.content.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .map((d) => ({
          label: d.title,
          sub: d.content.slice(0, 80),
          go: () => openDraft(d),
        })),
    },
    {
      key: "homeSearchKeg",
      items: loadPerangkat()
        .filter(
          (p) =>
            p.nama.toLowerCase().includes(q) ||
            p.jabatan.toLowerCase().includes(q) ||
            p.desa.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .map((p) => ({
          label: p.nama,
          sub: `${p.jabatan} • ${p.desa}`,
          go: () => {
            activateTab("kepegawaian");
            kegShowDetail(p);
          },
        })),
    },
    {
      key: "homeSearchAgenda",
      items: loadAgenda()
        .filter(
          (e) =>
            e.perihal.toLowerCase().includes(q) ||
            e.pihak.toLowerCase().includes(q) ||
            e.nomorAgenda.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .map((e) => ({
          label: e.perihal,
          sub: `${e.nomorAgenda} • ${e.pihak}`,
          go: () => activateTab("agenda"),
        })),
    },
    {
      key: "homeSearchAduan",
      items: loadAduan()
        .filter(
          (a) =>
            a.isi.toLowerCase().includes(q) ||
            a.jenis.toLowerCase().includes(q) ||
            a.nama.toLowerCase().includes(q),
        )
        .slice(0, 5)
        .map((a) => ({
          label: a.nama || t("ikmAnon", lang),
          sub: `${a.jenis} — ${a.isi.slice(0, 80)}`,
          go: () => {
            activateTab("pengaduan");
            aduShowDetail(a);
          },
        })),
    },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = t("homeSearchEmpty", lang);
    wrap.appendChild(p);
    return;
  }
  for (const g of groups) {
    if (g.items.length === 0) continue;
    const h = document.createElement("h4");
    h.className = "search-group";
    h.textContent = `${t(g.key, lang)} (${g.items.length})`;
    wrap.appendChild(h);
    for (const item of g.items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "search-result";
      const strong = document.createElement("strong");
      strong.textContent = item.label;
      const span = document.createElement("span");
      span.textContent = item.sub;
      b.appendChild(strong);
      b.appendChild(span);
      b.addEventListener("click", item.go);
      wrap.appendChild(b);
    }
  }
}

// ---------- Paket 10 — Briefing Pagi (morning briefing) ----------
interface BriefingFocus {
  text: string;
  tab: string;
}

interface Briefing {
  dateLabel: string;
  summary: string;
  focus: BriefingFocus[];
  urgent: boolean;
  waText: string;
}

let briefingWaText = "";

function buildBriefing(now = new Date()): Briefing {
  const aduan = loadAduan();
  const aduStats = computeAduanStats(aduan);
  const openAduan = aduan
    .filter((a) => a.status !== "selesai")
    .sort((a, b) => a.createdAt - b.createdAt);
  const notifs = computeNotifications(loadPerangkat(), now);
  const ikmStats = computeIkm(loadIkm());
  const lettersToday = listLocalDrafts().filter(
    (d) => d.kind === "letter" && sameDay(new Date(d.createdAt), now),
  ).length;
  const masukToday = loadAgenda().filter(
    (e) => e.arah === "masuk" && sameDay(new Date(e.tanggal), now),
  ).length;
  const habis = notifs.filter((n) => n.kind === "habis").length;
  const akan = notifs.filter((n) => n.kind === "akan-habis").length;
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const summary = [
    `${aduStats.baru} ${t("briefingAduan", lang)}`,
    `${habis} ${t("briefingMasaHabis", lang)}`,
    ikmStats.count === 0
      ? "IKM –"
      : `IKM ${ikmFmt(ikmStats.overall)} (${ikmStats.category})`,
    `${lettersToday} ${t("briefingSurat", lang)}`,
    `${masukToday} ${t("briefingAgendaMasuk", lang)}`,
  ].join(" • ");
  const focus: BriefingFocus[] = [];
  if (openAduan.length > 0) {
    const a = openAduan[0];
    const days = Math.max(
      0,
      Math.floor((now.getTime() - a.createdAt) / 86_400_000),
    );
    focus.push({
      text: `${t("briefingOldestAduan", lang)}: ${a.nama || t("ikmAnon", lang)} — ${a.jenis}, ${days} ${t("homeAduanWaiting", lang)}`,
      tab: "pengaduan",
    });
  }
  if (notifs.length > 0) {
    const n = notifs[0];
    focus.push({
      text:
        n.kind === "habis"
          ? `${t("briefingMasaHabisItem", lang)}: ${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa}`
          : `${t("briefingMasaAkanItem", lang)}: ${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa} (${n.days} ${t("kegNotifDays", lang)})`,
      tab: "kepegawaian",
    });
  }
  if (ikmStats.count > 0) {
    const label =
      lang === "id"
        ? IKM_ELEMENTS[ikmStats.minIdx].labelId
        : IKM_ELEMENTS[ikmStats.minIdx].labelEn;
    focus.push({
      text: `${t("briefingIkmLowest", lang)}: ${label} (${ikmFmt(ikmStats.perElement[ikmStats.minIdx])})`,
      tab: "ikm",
    });
  }
  const waLines = [
    "*Briefing Pagi — Kecamatan Simpangkatis*",
    dateLabel,
    `• Pengaduan baru: ${aduStats.baru} (belum selesai: ${openAduan.length})`,
    `• Masa bhakti: ${akan} akan habis ≤90 hari, ${habis} sudah habis`,
    ikmStats.count === 0
      ? "• IKM: belum ada jawaban"
      : `• IKM: ${ikmFmt(ikmStats.overall)} (kategori ${ikmStats.category}), ${ikmStats.count} responden`,
    `• Surat hari ini: ${lettersToday}`,
    `• Surat masuk hari ini: ${masukToday}`,
    "Fokus hari ini:",
    ...(focus.length > 0
      ? focus.map((f) => `- ${f.text}`)
      : ["- Tidak ada yang mendesak."]),
    "DesaAI — data contoh, bukan data asli.",
  ];
  const urgent =
    habis > 0 || openAduan.some((a) => now.getTime() - a.createdAt >= 7 * 86_400_000);
  return {
    dateLabel,
    summary,
    focus: focus.slice(0, 3),
    urgent,
    waText: waLines.join("\n"),
  };
}

function renderBriefing(): void {
  const b = buildBriefing();
  briefingWaText = b.waText;
  $("home-briefing-date").textContent = b.dateLabel;
  const summaryEl = $("home-briefing-summary");
  summaryEl.textContent = b.summary;
  summaryEl.classList.toggle("briefing-urgent", b.urgent);
  const list = $("home-briefing-focus");
  list.innerHTML = "";
  $("home-briefing-empty").hidden = b.focus.length > 0;
  for (const f of b.focus) {
    const li = document.createElement("li");
    li.className = "notif-item briefing-focus-item";
    const strong = document.createElement("strong");
    strong.textContent = f.text;
    li.appendChild(strong);
    li.addEventListener("click", () => activateTab(f.tab));
    list.appendChild(li);
  }
}

async function copyBriefing(): Promise<void> {
  const status = $("home-briefing-status");
  try {
    await navigator.clipboard.writeText(briefingWaText);
    setStatus(status, t("briefingCopied", lang));
  } catch {
    // Fallback for browsers without async-clipboard permission.
    try {
      const ta = document.createElement("textarea");
      ta.value = briefingWaText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      setStatus(status, ok ? t("briefingCopied", lang) : t("briefingCopyFail", lang));
    } catch {
      setStatus(status, t("briefingCopyFail", lang));
    }
  }
}

function renderHome(): void {
  const now = new Date();
  // IKM card (same numbers as the IKM dashboard).
  const ikmStats = computeIkm(loadIkm());
  $("home-ikm-score").textContent =
    ikmStats.count === 0 ? "–" : ikmFmt(ikmStats.overall);
  const catEl = $("home-ikm-cat");
  catEl.textContent =
    ikmStats.count === 0
      ? ""
      : `${ikmStats.category} — ${t(`ikmCat${ikmStats.category}`, lang)}`;
  catEl.className = `badge ${
    ikmStats.category === "A"
      ? "badge-device"
      : ikmStats.category === "B"
        ? "badge-cloud"
        : "badge-unknown"
  }`;
  $("home-ikm-count").textContent = `${ikmStats.count} ${t("ikmRespondents", lang)}`;
  $("home-ikm-lowest").textContent =
    ikmStats.count === 0
      ? "–"
      : `${
          lang === "id"
            ? IKM_ELEMENTS[ikmStats.minIdx].labelId
            : IKM_ELEMENTS[ikmStats.minIdx].labelEn
        } (${ikmFmt(ikmStats.perElement[ikmStats.minIdx])})`;
  // Letters saved today.
  const drafts = listLocalDrafts();
  $("home-letters-today").textContent = String(
    drafts.filter((d) => d.kind === "letter" && sameDay(new Date(d.createdAt), now))
      .length,
  );
  // New complaints.
  $("home-aduan-baru").textContent = String(
    computeAduanStats(loadAduan()).baru,
  );
  // Oldest unresolved complaints (waiting longest first).
  const openAduan = loadAduan()
    .filter((a) => a.status !== "selesai")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3);
  const aduanList = $("home-aduan-list");
  aduanList.innerHTML = "";
  $("home-aduan-empty").hidden = openAduan.length > 0;
  for (const a of openAduan) {
    const li = document.createElement("li");
    li.className = "notif-item";
    const strong = document.createElement("strong");
    strong.textContent = `${a.nama || t("ikmAnon", lang)} — ${a.jenis}`;
    li.appendChild(strong);
    const days = Math.max(
      0,
      Math.floor((now.getTime() - a.createdAt) / 86_400_000),
    );
    const detail = document.createElement("span");
    detail.textContent = `${days} ${t("homeAduanWaiting", lang)} (${new Date(a.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`;
    li.appendChild(detail);
    aduanList.appendChild(li);
  }
  // Terms of office needing attention (expired first, then expiring soon).
  const notifs = computeNotifications(loadPerangkat(), now);
  $("home-masa-akan").textContent = String(
    notifs.filter((n) => n.kind === "akan-habis").length,
  );
  $("home-masa-habis").textContent = String(
    notifs.filter((n) => n.kind === "habis").length,
  );
  const masaList = $("home-masa-list");
  masaList.innerHTML = "";
  $("home-masa-empty").hidden = notifs.length > 0;
  for (const n of notifs.slice(0, 3)) {
    const li = document.createElement("li");
    li.className = `notif-item ${n.kind === "habis" ? "notif-habis" : ""}`;
    const strong = document.createElement("strong");
    strong.textContent = `${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa}`;
    li.appendChild(strong);
    const detail = document.createElement("span");
    detail.textContent =
      n.kind === "habis"
        ? `${t("kegNotifHabis", lang)} ${-n.days} ${t("kegNotifDaysAgo", lang)} (${formatDateId(n.perangkat.masaSelesai)})`
        : `${t("kegNotifAkanHabis", lang)} ${n.days} ${t("kegNotifDays", lang)} (${formatDateId(n.perangkat.masaSelesai)})`;
    li.appendChild(detail);
    masaList.appendChild(li);
  }
  // This month.
  $("home-month-name").textContent = monthNameId(now);
  $("home-month-letters").textContent = String(
    drafts.filter((d) => d.kind === "letter" && inMonth(d.createdAt, now)).length,
  );
  $("home-month-ikm").textContent = String(
    loadIkm().filter((r) => inMonth(r.createdAt, now)).length,
  );
  $("home-month-aduan").textContent = String(
    loadAduan().filter((a) => inMonth(a.createdAt, now)).length,
  );
  renderTrend();
  renderAduanChart();
  renderReportPreview();
  renderMonthlyTrend();
  renderFollowUp();
  renderBriefing();
  renderHomeSearch();
  renderQuickStats();
  renderBackupCard();
  renderLetterheadForm();
}

function initHome(): void {
  renderHome();
  ($("home-search") as HTMLInputElement).addEventListener("input", (ev) => {
    homeSearchQuery = (ev.target as HTMLInputElement).value;
    renderHomeSearch();
  });
  $("home-go-letters").addEventListener("click", () =>
    document.querySelector<HTMLButtonElement>('[data-tab="letters"]')?.click(),
  );
  $("home-go-ikm").addEventListener("click", () =>
    document.querySelector<HTMLButtonElement>('[data-tab="ikm"]')?.click(),
  );
  $("home-go-aduan").addEventListener("click", () =>
    document.querySelector<HTMLButtonElement>('[data-tab="pengaduan"]')?.click(),
  );
  // Tapping an unresolved complaint on the dashboard opens the list.
  $("home-aduan-list").addEventListener("click", () =>
    document.querySelector<HTMLButtonElement>('[data-tab="pengaduan"]')?.click(),
  );
  // Paket 16 — tapping a follow-up item jumps to its tab.
  $("home-followup-list").addEventListener("click", (ev) => {
    const li = (ev.target as HTMLElement).closest<HTMLElement>("li[data-tab]");
    if (!li) return;
    document
      .querySelector<HTMLButtonElement>(`[data-tab="${li.dataset.tab}"]`)
      ?.click();
  });
  $("home-go-keg").addEventListener("click", () =>
    document.querySelector<HTMLButtonElement>('[data-tab="kepegawaian"]')?.click(),
  );
  $("home-report-print").addEventListener("click", printMonthlyReport);
  $("home-report-export").addEventListener("click", exportMonthlyReportCsv);
  $("home-briefing-copy").addEventListener("click", () => void copyBriefing());
  // Paket 14 — Backup & Restore.
  $("home-backup-export").addEventListener("click", () => void exportBackup());
  $("home-backup-import").addEventListener("click", () =>
    ($("home-backup-file") as HTMLInputElement).click(),
  );
  ($("home-backup-file") as HTMLInputElement).addEventListener(
    "change",
    (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) void handleBackupFile(file);
    },
  );
  $("home-backup-confirm-yes").addEventListener("click", async () => {
    const backup = pendingBackup;
    hideBackupConfirm();
    resetBackupFileInput();
    if (!backup) return;
    await applyBackup(backup);
    setStatus($("home-backup-status"), t("homeBackupRestored", lang));
  });
  $("home-backup-confirm-no").addEventListener("click", () => {
    hideBackupConfirm();
    resetBackupFileInput();
    setStatus($("home-backup-status"), t("homeBackupCancelled", lang));
  });
  // Paket 17 — Pengaturan Kop Surat.
  $("home-letterhead-save").addEventListener("click", () =>
    saveLetterheadForm(),
  );
}

// ---------- status chips ----------

function setDeviceChip(state: OnDeviceState, progress?: number): void {
  const chip = $("device-chip");
  const map: Record<OnDeviceState, string> = {
    available: t("deviceAvailable", lang),
    downloading: t("deviceDownloading", lang),
    downloadable: t("deviceDownloadable", lang),
    unavailable: t("deviceUnavailable", lang),
    unsupported: t("deviceUnsupported", lang),
  };
  chip.textContent =
    state === "downloading" && typeof progress === "number"
      ? `${map[state]} ${Math.round(progress * 100)}%`
      : map[state];
  chip.className =
    "chip " + (state === "available" ? "chip-ok" : state === "unsupported" ? "chip-muted" : "chip-warn");
}

function setFirebaseChip(): void {
  const chip = $("firebase-chip");
  if (!svc || svc.status === "not-configured") {
    chip.textContent = t("firebaseDemo", lang);
    chip.className = "chip chip-warn";
  } else if (svc.status === "ready") {
    // Paket 9 — sync status: show the last successful Firestore write.
    const last = getLastFirestoreSync();
    const syncText = last
      ? `${t("firebaseSynced", lang)} ${last.toLocaleTimeString(lang === "id" ? "id-ID" : "en-GB", { hour: "2-digit", minute: "2-digit" })}`
      : t("firebaseNotSynced", lang);
    chip.textContent = `${t("firebaseReady", lang)} · ${syncText}`;
    chip.className = "chip chip-ok";
  } else {
    chip.textContent = `${t("firebaseError", lang)}: ${svc.error ?? ""}`;
    chip.className = "chip chip-warn";
  }
}

// Paket 12 — network status chip (next to the Firestore sync chip).
// Offline is not an error state: local data keeps working and syncs back
// when the network returns (see the "online" listener in boot()).
function setNetChip(): void {
  const chip = $("net-chip");
  if (navigator.onLine) {
    chip.textContent = t("netOnline", lang);
    chip.className = "chip chip-ok";
  } else {
    chip.textContent = t("netOffline", lang);
    chip.className = "chip chip-warn";
  }
}

// Paket 12 — one place that mirrors every local module to Firestore
// (best-effort, never throws). Used on boot and when the network comes
// back, so entries written while offline upload on reconnect.
function syncAllToFirestore(): void {
  if (!svc || svc.status !== "ready") return;
  void Promise.allSettled([
    syncIkmToFirestore(svc, loadIkm()),
    syncAduanToFirestore(svc, loadAduan()),
    syncPerangkatToFirestore(svc, loadPerangkat()),
    syncAgendaToFirestore(svc, loadAgenda()),
  ]).then(() => setFirebaseChip());
}

// ---------- routing badge ----------

function showBadge(
  badgeEl: HTMLElement,
  reasonEl: HTMLElement,
  source: "ON_DEVICE" | "IN_CLOUD" | "UNKNOWN",
  routeReason: "short" | "long" | "fallback" | "forced-cloud",
): void {
  if (source === "ON_DEVICE") {
    badgeEl.textContent = t("badgeDevice", lang);
    badgeEl.className = "badge badge-device";
    reasonEl.textContent = t("reasonShort", lang);
  } else if (source === "IN_CLOUD") {
    badgeEl.textContent = `${t("badgeCloud", lang)} • ${svc?.cloudModel ?? "gemini-3.8-flash"}`;
    badgeEl.className = "badge badge-cloud";
    reasonEl.textContent =
      routeReason === "long"
        ? t("reasonLong", lang)
        : routeReason === "forced-cloud"
          ? t("reasonForcedCloud", lang)
          : t("reasonFallback", lang);
  } else {
    badgeEl.textContent = t("badgeUnknown", lang);
    badgeEl.className = "badge badge-unknown";
    reasonEl.textContent = "";
  }
}

function setStatus(el: HTMLElement, msg: string, isError = false): void {
  el.textContent = msg;
  el.classList.toggle("error", isError);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function downloadFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadTxt(filename: string, text: string): void {
  downloadFile(filename, text, "text/plain;charset=utf-8");
}

/** Escape one CSV cell: quote when the value contains a separator (comma
 * or semicolon — both export flavours exist), quote, or newline; double
 * inner quotes. */
function csvEscape(v: string): string {
  return /[;,\"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Read a JSON value from localStorage without throwing (backup export). */
function readLocalJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

// ---------- letters ----------

// Automatic letter numbering: per-template counter, reset every year.
// Format: {prefix}/{seq 3 digits}/DS/{roman month}/{year}, e.g. 140/001/DS/XI/2026.
const LETTER_PREFIX: Record<string, string> = {
  "surat-dinas": "140",
  sk: "188.4",
  undangan: "140",
  pengantar: "140",
  keterangan: "140",
  "sk-pengangkatan": "188.4",
};
const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function nextLetterNumber(tplId: string): string {
  const key = "desaai-nomor-surat-v1";
  const now = new Date();
  const year = now.getFullYear();
  let store: { year: number; counters: Record<string, number> } = { year, counters: {} };
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { year?: number; counters?: Record<string, number> };
      if (parsed.year === year && parsed.counters) store = { year, counters: parsed.counters };
    }
  } catch {
    // Start fresh.
  }
  const seq = (store.counters[tplId] ?? 0) + 1;
  store.counters[tplId] = seq;
  try {
    localStorage.setItem(key, JSON.stringify(store));
  } catch {
    // Storage unavailable — number still filled in for this draft.
  }
  const prefix = LETTER_PREFIX[tplId] ?? "140";
  return `${prefix}/${String(seq).padStart(3, "0")}/DS/${ROMAN_MONTHS[now.getMonth()]}/${year}`;
}

function renderTemplateSelect(): void {
  const sel = $("letter-template") as HTMLSelectElement;
  const prev = sel.value || currentTemplate.id;
  sel.innerHTML = "";
  for (const tpl of TEMPLATES) {
    const opt = document.createElement("option");
    opt.value = tpl.id;
    opt.textContent = lang === "id" ? tpl.nameId : `${tpl.nameId} (${tpl.nameEn})`;
    sel.appendChild(opt);
  }
  sel.value = prev;
  currentTemplate = TEMPLATES.find((t) => t.id === sel.value) ?? TEMPLATES[0];
}

function renderLetterFields(): void {
  const wrap = $("letter-fields");
  wrap.innerHTML = "";
  for (const f of currentTemplate.fields) {
    const label = document.createElement("label");
    label.className = "field" + (f.type === "textarea" ? " field-wide" : "");
    const span = document.createElement("span");
    span.textContent = lang === "id" ? f.labelId : f.labelEn;
    label.appendChild(span);
    const input =
      f.type === "textarea"
        ? document.createElement("textarea")
        : document.createElement("input");
    input.id = `letter-field-${f.key}`;
    input.dataset.fieldKey = f.key;
    if (input instanceof HTMLInputElement) input.type = f.type === "date" ? "text" : "text";
    if (input instanceof HTMLTextAreaElement) input.rows = 3;
    input.placeholder = f.placeholder;
    label.appendChild(input);
    wrap.appendChild(label);
  }
}

function readLetterValues(): Record<string, string> {
  const values: Record<string, string> = {};
  document
    .querySelectorAll<HTMLElement>("#letter-fields [data-field-key]")
    .forEach((el) => {
      const key = (el as HTMLElement).dataset.fieldKey;
      if (key) values[key] = (el as HTMLInputElement | HTMLTextAreaElement).value;
    });
  return values;
}

function initLetters(): void {
  const sel = $("letter-template") as HTMLSelectElement;
  sel.addEventListener("change", () => {
    currentTemplate = TEMPLATES.find((t) => t.id === sel.value) ?? TEMPLATES[0];
    renderLetterFields();
  });
  renderTemplateSelect();
  renderLetterFields();

  $("letter-clear").addEventListener("click", () => {
    renderLetterFields();
    ($("letter-extra") as HTMLInputElement).value = "";
    $("letter-output-wrap").hidden = true;
    setStatus($("letter-status"), "");
  });

  $("letter-autonumber").addEventListener("click", () => {
    const hasNomor = currentTemplate.fields.some((f) => f.key === "nomor");
    if (!hasNomor) {
      setStatus($("letter-status"), t("statusNeedInput", lang), true);
      return;
    }
    const input = document.getElementById("letter-field-nomor") as HTMLInputElement | null;
    if (!input) return;
    input.value = nextLetterNumber(currentTemplate.id);
    setStatus($("letter-status"), t("autoNumberDone", lang));
  });

  $("letter-generate").addEventListener("click", async () => {
    const btn = $("letter-generate") as HTMLButtonElement;
    const status = $("letter-status");
    const values = readLetterValues();
    const extra = ($("letter-extra") as HTMLInputElement).value;
    if (Object.values(values).every((v) => !v.trim()) && !extra.trim()) {
      setStatus(status, t("statusNeedInput", lang), true);
      return;
    }
    if (!svc || svc.status !== "ready") {
      setStatus(status, t("statusNeedConfig", lang), true);
      return;
    }
    btn.disabled = true;
    setStatus(status, t("statusThinking", lang));
    $("letter-output-wrap").hidden = false;
    const output = $("letter-output") as HTMLTextAreaElement;
    output.value = "";
    try {
      warmUpDeviceModel(svc, (p) => setDeviceChip("downloading", p));
      const prompt = buildLetterPrompt(currentTemplate, values, extra);
      const result = await generateStream(
        svc,
        prompt,
        { forceCloud: false, onDevice },
        (text) => {
          output.value = text;
        },
      );
      lastLetterText = result.text;
      showBadge($("letter-badge"), $("letter-reason"), result.source, result.route.reason);
      setStatus(status, "");
    } catch (e) {
      console.error("DesaAI: letter generation failed", e);
      setStatus(status, t("statusAiError", lang), true);
    } finally {
      btn.disabled = false;
    }
  });

  $("letter-copy").addEventListener("click", async () => {
    const ok = await copyText(($("letter-output") as HTMLTextAreaElement).value);
    setStatus($("letter-status"), ok ? t("statusCopied", lang) : t("statusError", lang) + "clipboard", !ok);
  });
  $("letter-download").addEventListener("click", () => {
    downloadTxt(
      `${currentTemplate.id}-${new Date().toISOString().slice(0, 10)}.txt`,
      ($("letter-output") as HTMLTextAreaElement).value,
    );
  });
  $("letter-print").addEventListener("click", () => {
    const text = ($("letter-output") as HTMLTextAreaElement).value;
    $("letter-print-title").textContent =
      lang === "id" ? currentTemplate.nameId : currentTemplate.nameEn;
    $("letter-print-date").textContent = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    $("letter-print-body").textContent = text;
    // Which print area the @media print stylesheet shows.
    document.body.dataset.printTarget = "letter";
    window.print();
  });
  $("letter-save").addEventListener("click", async () => {
    if (!svc) return;
    const text = ($("letter-output") as HTMLTextAreaElement).value;
    if (!text.trim()) return;
    const d = await saveDraft(svc, "letter", currentTemplate.nameId, text);
    setStatus(
      $("letter-status"),
      d.source === "firestore" ? t("statusSaved", lang) : t("statusSavedLocal", lang),
    );
  });
}

// ---------- summarizer ----------

function initSummarizer(): void {
  const input = $("sum-input") as HTMLTextAreaElement;
  const count = $("sum-count");
  const updateCount = () => {
    count.textContent = String(input.value.length);
  };
  input.addEventListener("input", updateCount);
  updateCount();

  $("sum-clear").addEventListener("click", () => {
    input.value = "";
    updateCount();
    $("sum-output-wrap").hidden = true;
    setStatus($("sum-status"), "");
  });

  $("sum-generate").addEventListener("click", async () => {
    const btn = $("sum-generate") as HTMLButtonElement;
    const status = $("sum-status");
    const text = input.value.trim();
    if (!text) {
      setStatus(status, t("statusNeedText", lang), true);
      return;
    }
    if (!svc || svc.status !== "ready") {
      setStatus(status, t("statusNeedConfig", lang), true);
      return;
    }
    const length = ($("sum-length") as HTMLSelectElement).value;
    const lengthId =
      length === "short"
        ? "Singkat: hanya 5–7 poin kunci dalam bentuk daftar."
        : length === "detailed"
          ? "Detail: ringkasan terstruktur dengan judul bagian (Latar belakang, Isi utama, Keputusan/Tindak lanjut)."
          : "Sedang: poin kunci disertai penjelasan singkat.";
    btn.disabled = true;
    setStatus(status, t("statusThinking", lang));
    $("sum-output-wrap").hidden = false;
    const output = $("sum-output");
    output.textContent = "";
    try {
      warmUpDeviceModel(svc, (p) => setDeviceChip("downloading", p));
      const prompt = [
        "Ringkas dokumen berikut dalam Bahasa Indonesia formal.",
        lengthId,
        "Jangan menambahkan fakta yang tidak ada di dokumen. Bila ada tanggal, angka, atau nama, pertahankan apa adanya.",
        "",
        "DOKUMEN:",
        text,
      ].join("\n");
      // Long documents always go to the cloud (on-device input cap).
      const result = await generateStream(
        svc,
        prompt,
        { forceCloud: true, onDevice },
        (t2) => {
          output.textContent = t2;
        },
      );
      lastSummaryText = result.text;
      showBadge($("sum-badge"), $("sum-reason"), result.source, result.route.reason);
      setStatus(status, "");
    } catch (e) {
      console.error("DesaAI: summarization failed", e);
      setStatus(status, t("statusAiError", lang), true);
    } finally {
      btn.disabled = false;
    }
  });

  $("sum-copy").addEventListener("click", async () => {
    const ok = await copyText($("sum-output").textContent ?? "");
    setStatus($("sum-status"), ok ? t("statusCopied", lang) : t("statusError", lang) + "clipboard", !ok);
  });
  $("sum-save").addEventListener("click", async () => {
    if (!svc || !lastSummaryText.trim()) return;
    const d = await saveDraft(svc, "summary", "Ringkasan dokumen", lastSummaryText);
    setStatus(
      $("sum-status"),
      d.source === "firestore" ? t("statusSaved", lang) : t("statusSavedLocal", lang),
    );
  });
}

// KB checklist persistence (document-requirements ticks).
const KB_CHECK_KEY = "desaai-kb-checklist-v1";

function loadKbChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KB_CHECK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isKbChecked(entryId: string, idx: number): boolean {
  return loadKbChecks()[`${entryId}:${idx}`] === true;
}

function setKbChecked(entryId: string, idx: number, checked: boolean): void {
  const map = loadKbChecks();
  map[`${entryId}:${idx}`] = checked;
  try {
    localStorage.setItem(KB_CHECK_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable — checkbox state still works for this session.
  }
}

// ---------- Q&A ----------

function renderKbList(): void {
  const list = $("kb-list");
  list.innerHTML = "";
  for (const e of KB) {
    const div = document.createElement("div");
    div.className = "kb-item";
    const h = document.createElement("h3");
    h.textContent = lang === "id" ? e.titleId : `${e.titleId} (${e.titleEn})`;
    div.appendChild(h);
    // Document-requirements checklist (tick off as the clerk collects them).
    const syarat = document.createElement("ul");
    syarat.className = "checklist";
    e.syaratId.forEach((s, idx) => {
      const li = document.createElement("li");
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isKbChecked(e.id, idx);
      cb.addEventListener("change", () => {
        setKbChecked(e.id, idx, cb.checked);
        li.classList.toggle("done", cb.checked);
      });
      const span = document.createElement("span");
      span.textContent = s;
      label.appendChild(cb);
      label.appendChild(span);
      li.appendChild(label);
      li.classList.toggle("done", cb.checked);
      syarat.appendChild(li);
    });
    div.appendChild(syarat);
    const steps = document.createElement("ul");
    for (const s of e.langkahId) {
      const li = document.createElement("li");
      li.textContent = s;
      steps.appendChild(li);
    }
    div.appendChild(steps);
    list.appendChild(div);
  }
}

function renderQaSuggestions(): void {
  const row = $("qa-suggestions");
  row.innerHTML = "";
  const suggestions =
    lang === "id"
      ? ["Apa syarat membuat KTP?", "Bagaimana cara mengurus KK baru?", "Apa itu SKTM?", "Berapa lama masa bhakti perangkat desa?"]
      : ["What do I need to apply for a KTP?", "How do I get a new KK?", "What is an SKTM?", "How long is a village officer's term?"];
  for (const s of suggestions) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s;
    b.addEventListener("click", () => {
      ($("qa-input") as HTMLInputElement).value = s;
      $("qa-ask").click();
    });
    row.appendChild(b);
  }
}

function formatKbAnswer(entries: KbEntry[]): string {
  return entries
    .map((e) => {
      const lines = [
        `${e.titleId} (${e.titleEn})`,
        `Syarat: ${e.syaratId.join("; ")}`,
        "Langkah:",
        ...e.langkahId.map((s, i) => `${i + 1}. ${s}`),
        `Catatan: ${e.catatanId}`,
      ];
      return lines.join("\n");
    })
    .join("\n\n");
}

function initQa(): void {
  renderKbList();
  renderQaSuggestions();

  $("qa-ask").addEventListener("click", async () => {
    const btn = $("qa-ask") as HTMLButtonElement;
    const status = $("qa-status");
    const question = ($("qa-input") as HTMLInputElement).value.trim();
    if (!question) {
      setStatus(status, t("statusNeedQuestion", lang), true);
      return;
    }
    const matches = matchKb(question);
    const output = $("qa-output");
    const sources = $("qa-sources");
    $("qa-output-wrap").hidden = false;

    // Demo mode / no Firebase: answer straight from the offline guide.
    if (!svc || svc.status !== "ready") {
      if (matches.length === 0) {
        setStatus(status, t("statusNeedConfig", lang), true);
        output.textContent = "";
        sources.textContent = "";
        return;
      }
      output.textContent = formatKbAnswer(matches);
      sources.textContent =
        `${t("sourcesLabel", lang)}${matches.map((m) => m.titleId).join(", ")} — ${t("kbOfflineNote", lang)}`;
      const badge = $("qa-badge");
      badge.textContent = t("badgeDevice", lang);
      badge.className = "badge badge-device";
      $("qa-reason").textContent = t("kbOfflineNote", lang);
      setStatus(status, "");
      return;
    }

    btn.disabled = true;
    setStatus(status, t("statusThinking", lang));
    output.textContent = "";
    sources.textContent = "";
    try {
      warmUpDeviceModel(svc, (p) => setDeviceChip("downloading", p));
      const grounding =
        matches.length > 0
          ? matches.map(kbEntryToText).join("\n\n")
          : "Tidak ada entri panduan yang cocok; jawab dengan pengetahuan umum tentang administrasi desa Indonesia dan katakan bila Anda tidak yakin.";
      const prompt = [
        "Jawab pertanyaan warga tentang prosedur administrasi desa dalam Bahasa Indonesia yang jelas dan ringkas.",
        "Gunakan HANYA informasi dari panduan berikut; jangan mengarang syarat atau langkah.",
        "",
        "PANDUAN:",
        grounding,
        "",
        `PERTANYAAN: ${question}`,
      ].join("\n");
      const result = await generateStream(
        svc,
        prompt,
        { forceCloud: false, onDevice },
        (text) => {
          output.textContent = text;
        },
      );
      showBadge($("qa-badge"), $("qa-reason"), result.source, result.route.reason);
      if (matches.length > 0) {
        sources.textContent = `${t("sourcesLabel", lang)}${matches.map((m) => m.titleId).join(", ")}`;
      }
      setStatus(status, "");
    } catch (e) {
      console.error("DesaAI: Q&A failed", e);
      setStatus(status, t("statusAiError", lang), true);
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------- drafts ----------

let draftsQuery = "";

async function refreshDrafts(): Promise<void> {
  // Works even while Firebase init is still pending (svc === null):
  // local drafts are always listable; Firestore sync joins when ready.
  const list = $("drafts-list");
  const empty = $("drafts-empty");
  const all = await listDrafts(svc);
  // Paket 14 — the home backup card shows the merged letters count.
  mergedDraftCount = all.length;
  renderBackupCard();
  const q = draftsQuery.trim().toLowerCase();
  const drafts = q
    ? all.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q),
      )
    : all;
  list.innerHTML = "";
  empty.hidden = drafts.length > 0;
  empty.textContent =
    drafts.length === 0 && q ? t("draftsNoMatch", lang) : t("draftsEmpty", lang);
  const renderGroup = (title: string, group: Draft[]): void => {
    if (group.length === 0) return;
    const h = document.createElement("h3");
    h.className = "subhead";
    h.textContent = title;
    list.appendChild(h);
    for (const d of group) renderDraftItem(d);
  };
  const renderDraftItem = (d: Draft): void => {
    const div = document.createElement("div");
    div.className = "draft-item";
    const h = document.createElement("h3");
    h.textContent = d.title;
    div.appendChild(h);
    const meta = document.createElement("p");
    meta.textContent = `${t("savedAt", lang)}${new Date(d.createdAt).toLocaleString()} • ${d.kind} • ${d.source}`;
    div.appendChild(meta);
    const preview = document.createElement("p");
    preview.textContent = d.content.slice(0, 240);
    div.appendChild(preview);
    const actions = document.createElement("div");
    actions.className = "actions";
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn";
    openBtn.textContent = t("open", lang);
    openBtn.addEventListener("click", () => {
      openDraft(d);
    });
    actions.appendChild(openBtn);
    if (d.kind === "letter") {
      // Paket 15 — print this archived letter as a formal official letter.
      const printBtn = document.createElement("button");
      printBtn.type = "button";
      printBtn.className = "btn";
      printBtn.textContent = t("printLetter", lang);
      printBtn.addEventListener("click", () => {
        openArchivePrint(d);
      });
      actions.appendChild(printBtn);
    }
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn";
    delBtn.textContent = t("delete", lang);
    delBtn.addEventListener("click", async () => {
      await deleteDraft(svc, d);
      setStatus($("drafts-status"), t("statusDeleted", lang));
      await refreshDrafts();
    });
    actions.appendChild(openBtn);
    actions.appendChild(delBtn);
    if (d.kind === "letter") {
      const rateBtn = document.createElement("button");
      rateBtn.type = "button";
      rateBtn.className = "btn btn-link rate-btn";
      rateBtn.textContent = t("rateThis", lang);
      rateBtn.addEventListener("click", () => {
        document.querySelector<HTMLButtonElement>('[data-tab="ikm"]')?.click();
      });
      actions.appendChild(rateBtn);
    }
    div.appendChild(actions);
    list.appendChild(div);
  };
  renderGroup(t("kegArchiveLetters", lang), drafts.filter((d) => d.kind === "letter"));
  renderGroup(t("kegArchiveSummaries", lang), drafts.filter((d) => d.kind !== "letter"));
  renderQuickStats();
}

function openDraft(d: Draft): void {
  if (d.kind === "letter") {
    document.querySelector<HTMLButtonElement>('[data-tab="letters"]')?.click();
    $("letter-output-wrap").hidden = false;
    ($("letter-output") as HTMLTextAreaElement).value = d.content;
    lastLetterText = d.content;
  } else if (d.kind === "summary") {
    document.querySelector<HTMLButtonElement>('[data-tab="summarize"]')?.click();
    $("sum-output-wrap").hidden = false;
    $("sum-output").textContent = d.content;
    lastSummaryText = d.content;
  }
}

// ---------- print an archived letter as a formal official letter (Paket 15) ----------
// The archive stores only title + body + date, so the preview lets the officer
// fill in the missing formal fields (number, addressee) before printing.
// NOTHING is invented: an empty number/addressee prints as "—", and the
// signatory name is "—" — the app has no Camat name on file. The letter
// number auto-fill only fires when the officer presses the button, and only
// for the template the draft title matches (drafts are saved with the
// template's Indonesian name).

let currentPrintDraft: Draft | null = null;
let printForm = { nomor: "", tanggal: "", tujuan: "", perihal: "", isi: "" };

function formatLetterDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function printMetaRow(label: string, value: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "print-meta-row";
  const k = document.createElement("span");
  k.className = "print-meta-key";
  k.textContent = label;
  const v = document.createElement("span");
  v.className = "print-meta-val";
  v.textContent = value || "—";
  row.appendChild(k);
  row.appendChild(v);
  return row;
}

function printSignBlock(tanggal: string): HTMLElement {
  const sign = document.createElement("div");
  sign.className = "print-sign-inner";
  const place = document.createElement("p");
  place.textContent = `Simpangkatis, ${tanggal || "—"}`;
  const title = document.createElement("p");
  title.textContent = t("printSignerTitle", lang);
  const name = document.createElement("p");
  name.className = "print-sign-name";
  // Paket 17 — the name comes from the officer's letterhead settings.
  // Empty stays a clear placeholder, never an invented name.
  const lh = loadLetterhead();
  name.textContent = lh.camatNama.trim() || "—";
  const nip = document.createElement("p");
  nip.textContent = lh.camatNip.trim() ? `NIP. ${lh.camatNip.trim()}` : "NIP. —";
  sign.append(place, title, name, nip);
  return sign;
}

/** Second signature block, only when the officer filled in a secretary. */
function printSecretaryBlock(): HTMLElement | null {
  const lh = loadLetterhead();
  if (!lh.sekretarisNama.trim()) return null;
  const sign = document.createElement("div");
  sign.className = "print-sign-inner print-sign-secretary";
  const title = document.createElement("p");
  title.textContent = t("printSignerSecretary", lang);
  const name = document.createElement("p");
  name.className = "print-sign-name";
  name.textContent = lh.sekretarisNama.trim();
  sign.append(title, name);
  return sign;
}

function renderArchiveSheet(): void {
  const sheet = $("archive-print-sheet");
  sheet.innerHTML = "";
  const kop = document.createElement("div");
  kop.className = "print-kop";
  const logo = document.createElement("img");
  logo.className = "print-kop-logo";
  logo.src = "./logo.png";
  logo.alt = "";
  const kopText = document.createElement("div");
  kopText.className = "print-kop-text";
  // Paket 17 — institution lines from the officer's letterhead settings
  // (pre-filled with the values Paket 15 already used); empty prints "—".
  const lh = loadLetterhead();
  const gov = document.createElement("p");
  gov.className = "print-kop-gov";
  gov.textContent = lh.instansi1.trim() || "—";
  const office = document.createElement("p");
  office.className = "print-kop-office";
  office.textContent = lh.instansi2.trim() || "—";
  kopText.append(gov, office);
  const contact = letterheadContactLine(lh);
  if (contact) {
    const contactEl = document.createElement("p");
    contactEl.className = "print-kop-contact";
    contactEl.textContent = contact;
    kopText.appendChild(contactEl);
  }
  kop.append(logo, kopText);
  sheet.appendChild(kop);
  sheet.appendChild(document.createElement("hr"));
  const meta = document.createElement("div");
  meta.className = "print-meta";
  meta.append(
    printMetaRow("Nomor", printForm.nomor),
    printMetaRow("Tanggal", printForm.tanggal),
    printMetaRow("Perihal", printForm.perihal),
    printMetaRow("Kepada Yth.", printForm.tujuan),
  );
  sheet.appendChild(meta);
  const body = document.createElement("div");
  body.className = "print-body";
  body.textContent = printForm.isi;
  sheet.appendChild(body);
  const sign = document.createElement("div");
  sign.className = "print-sign";
  const secretary = printSecretaryBlock();
  if (secretary) {
    sign.classList.add("print-sign-dual");
    sign.append(secretary, printSignBlock(printForm.tanggal));
  } else {
    sign.appendChild(printSignBlock(printForm.tanggal));
  }
  sheet.appendChild(sign);
}

function buildArchivePrintFields(): void {
  const wrap = $("archive-print-fields");
  wrap.innerHTML = "";
  const mkField = (
    key: keyof typeof printForm,
    labelKey: string,
    phKey: string | null,
    textarea: boolean,
  ): void => {
    const label = document.createElement("label");
    label.className = "field" + (textarea ? " field-wide" : "");
    const span = document.createElement("span");
    span.textContent = t(labelKey, lang);
    label.appendChild(span);
    const input = textarea
      ? document.createElement("textarea")
      : document.createElement("input");
    input.id = `archive-print-${key}`;
    if (input instanceof HTMLTextAreaElement) input.rows = 8;
    if (phKey) input.placeholder = t(phKey, lang);
    input.value = printForm[key];
    input.addEventListener("input", () => {
      printForm[key] = input.value;
      renderArchiveSheet();
    });
    label.appendChild(input);
    wrap.appendChild(label);
  };
  mkField("nomor", "printFieldNomor", "printFieldNomorPh", false);
  // Auto-number, only when the draft title matches a known template.
  const tpl = currentPrintDraft
    ? TEMPLATES.find((x) => x.nameId === currentPrintDraft?.title)
    : undefined;
  if (tpl) {
    const autoBtn = document.createElement("button");
    autoBtn.type = "button";
    autoBtn.className = "btn";
    autoBtn.id = "archive-print-autonumber";
    autoBtn.textContent = t("printAutoNumber", lang);
    autoBtn.addEventListener("click", () => {
      printForm.nomor = nextLetterNumber(tpl.id);
      const input = $("archive-print-nomor") as HTMLInputElement;
      input.value = printForm.nomor;
      renderArchiveSheet();
    });
    wrap.appendChild(autoBtn);
  }
  mkField("tanggal", "printFieldTanggal", null, false);
  mkField("tujuan", "printFieldTujuan", "printFieldTujuanPh", false);
  mkField("perihal", "printFieldPerihal", null, false);
  mkField("isi", "printFieldIsi", null, true);
}

function openArchivePrint(d: Draft): void {
  currentPrintDraft = d;
  printForm = {
    nomor: "",
    tanggal: formatLetterDate(d.createdAt),
    tujuan: "",
    perihal: d.title,
    isi: d.content,
  };
  buildArchivePrintFields();
  renderArchiveSheet();
  $("archive-print-preview").hidden = false;
  $("archive-print-preview").scrollIntoView({ block: "start" });
}

function closeArchivePrint(): void {
  currentPrintDraft = null;
  $("archive-print-preview").hidden = true;
}

function doArchivePrint(): void {
  // Fill the print-only area from the same form the preview shows, so the
  // printed page matches the preview exactly.
  const meta = $("archive-print-meta");
  meta.innerHTML = "";
  meta.append(
    printMetaRow("Nomor", printForm.nomor),
    printMetaRow("Tanggal", printForm.tanggal),
    printMetaRow("Perihal", printForm.perihal),
    printMetaRow("Kepada Yth.", printForm.tujuan),
  );
  $("archive-print-body").textContent = printForm.isi;
  const sign = $("archive-print-sign");
  sign.innerHTML = "";
  sign.appendChild(printSignBlock(printForm.tanggal));
  document.body.dataset.printTarget = "archive-letter";
  window.print();
}

function initDrafts(): void {
  ($("drafts-search") as HTMLInputElement).addEventListener("input", (ev) => {
    draftsQuery = (ev.target as HTMLInputElement).value;
    void refreshDrafts();
  });
  // Paket 15 — print the archived letter shown in the preview.
  $("archive-print-do").addEventListener("click", doArchivePrint);
  $("archive-print-close").addEventListener("click", closeArchivePrint);
  $("backup-export").addEventListener("click", async () => {
    const backup = {
      app: "DesaAI",
      exportedAt: new Date().toISOString(),
      drafts: await listDrafts(svc),
      perangkat: loadPerangkat(),
      ikm: loadIkm(),
      pengaduan: loadAduan(),
      letterNumbers: readLocalJson("desaai-nomor-surat-v1"),
      kbChecklist: readLocalJson("desaai-kb-checklist-v1"),
    };
    downloadFile(
      `desaai-cadangan-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8",
    );
    setStatus($("drafts-status"), t("backupDone", lang));
  });
}

// ---------- kepegawaian (SIAP AKAD — sample data) ----------

let kegItems: Perangkat[] = [];

function kegFillSelect(
  el: HTMLSelectElement,
  values: string[],
  allLabel: string,
): void {
  el.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = allLabel;
  el.appendChild(all);
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  }
}

function kegStatusPill(p: Perangkat): { text: string; cls: string } {
  const s = masaStatus(p);
  if (s === "aktif") return { text: t("kegStatusAktif", lang), cls: "aktif" };
  if (s === "akan-habis") return { text: t("kegStatusAkanHabis", lang), cls: "akan-habis" };
  return { text: t("kegStatusHabis", lang), cls: "habis" };
}

function renderKepegawaian(): void {
  kegItems = loadPerangkat();
  const items = kegItems;
  const stats = computeStats(items);
  $("keg-stat-total").textContent = String(stats.total);
  $("keg-stat-desa").textContent = String(stats.desaCount);
  $("keg-stat-aktif").textContent = String(stats.aktif);
  $("keg-stat-akanhabis").textContent = String(stats.akanHabis);
  $("keg-stat-habis").textContent = String(stats.habis);
  $("keg-unit-kec-total").textContent = String(stats.kecamatan.total);
  $("keg-unit-kec-aktif").textContent = String(stats.kecamatan.aktif);
  $("keg-unit-kec-akanhabis").textContent = String(stats.kecamatan.akanHabis);
  $("keg-unit-kec-habis").textContent = String(stats.kecamatan.habis);
  $("keg-unit-desa-total").textContent = String(stats.desa.total);
  $("keg-unit-desa-aktif").textContent = String(stats.desa.aktif);
  $("keg-unit-desa-akanhabis").textContent = String(stats.desa.akanHabis);
  $("keg-unit-desa-habis").textContent = String(stats.desa.habis);

  // Notifications
  const notifs = computeNotifications(items);
  const notifList = $("keg-notif-list");
  notifList.innerHTML = "";
  $("keg-notif-count").textContent = String(notifs.length);
  $("keg-notif-empty").hidden = notifs.length > 0;
  for (const n of notifs) {
    const li = document.createElement("li");
    li.className = `notif-item ${n.kind === "habis" ? "notif-habis" : ""}`;
    const strong = document.createElement("strong");
    strong.textContent = `${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa}`;
    li.appendChild(strong);
    const detail = document.createElement("span");
    detail.textContent =
      n.kind === "habis"
        ? `${t("kegNotifHabis", lang)} ${-n.days} ${t("kegNotifDaysAgo", lang)} (${formatDateId(n.perangkat.masaSelesai)})`
        : `${t("kegNotifAkanHabis", lang)} ${n.days} ${t("kegNotifDays", lang)} (${formatDateId(n.perangkat.masaSelesai)})`;
    li.appendChild(detail);
    notifList.appendChild(li);
  }

  // Paket 20 — Pengingat Masa Berlaku SK (30-day window; the SK's validity
  // is the appointment term already stored as masaSelesai — nothing is
  // invented; records without an end date are skipped by computeSkReminders).
  const skReminders = computeSkReminders(items);
  const skList = $("keg-sk-list");
  skList.innerHTML = "";
  $("keg-sk-count").textContent = String(skReminders.length);
  $("keg-sk-empty").hidden = skReminders.length > 0;
  for (const n of skReminders) {
    const li = document.createElement("li");
    li.className = `notif-item ${n.kind === "habis" ? "notif-habis" : ""}`;
    const strong = document.createElement("strong");
    strong.textContent = `${n.perangkat.nama} — ${n.perangkat.jabatan}, ${n.perangkat.desa}`;
    li.appendChild(strong);
    const detail = document.createElement("span");
    detail.textContent =
      n.kind === "habis"
        ? `${t("kegSkHabis", lang)} ${-n.days} ${t("kegNotifDaysAgo", lang)} (${formatDateId(n.perangkat.masaSelesai)})`
        : `${t("kegSkAkanHabis", lang)} ${n.days} ${t("kegNotifDays", lang)} (${formatDateId(n.perangkat.masaSelesai)})`;
    li.appendChild(detail);
    skList.appendChild(li);
  }

  // Table (search + filters)
  const search = ($("keg-search") as HTMLInputElement).value ?? "";
  const desaF = ($("keg-filter-desa") as HTMLSelectElement).value ?? "";
  const jabF = ($("keg-filter-jabatan") as HTMLSelectElement).value ?? "";
  const unitF = ($("keg-filter-unit") as HTMLSelectElement).value as
    | "kecamatan"
    | "desa"
    | "";
  const statusSel = $("keg-filter-status") as HTMLSelectElement;
  const prevStatus = statusSel.value as MasaStatus | "";
  statusSel.innerHTML = "";
  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "", label: t("kegFilterStatus", lang) },
    { value: "aktif", label: t("kegStatusAktif", lang) },
    { value: "akan-habis", label: t("kegStatusAkanHabis", lang) },
    { value: "habis", label: t("kegStatusHabis", lang) },
  ];
  for (const o of statusOptions) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    statusSel.appendChild(opt);
  }
  statusSel.value = prevStatus;
  const filtered = filterPerangkat(items, search, desaF, jabF, prevStatus, unitF);
  const tbody = $("keg-table-body");
  tbody.innerHTML = "";
  filtered.forEach((p, i) => {
    const tr = document.createElement("tr");
    const pill = kegStatusPill(p);
    const cells: HTMLElement[] = [];
    const td = (text: string): HTMLElement => {
      const c = document.createElement("td");
      c.textContent = text;
      return c;
    };
    cells.push(td(String(i + 1)));
    const nameCell = document.createElement("td");
    nameCell.textContent = p.nama;
    if (isDemoRecord(p)) {
      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = t("kegDemoBadge", lang);
      nameCell.appendChild(badge);
    }
    cells.push(nameCell);
    cells.push(
      td(p.unit === "kecamatan" ? t("kegUnitKecOpt", lang) : t("kegUnitDesaOpt", lang)),
    );
    cells.push(td(p.jabatan));
    cells.push(td(p.desa));
    cells.push(td(`${p.tempatLahir}, ${formatDateId(p.tglLahir)}`));
    cells.push(td(p.agama));
    cells.push(td(p.noHp || "-"));
    cells.push(td(`${formatDateId(p.masaMulai)} - ${formatDateId(p.masaSelesai)}`));
    const statusCell = document.createElement("td");
    const pillEl = document.createElement("span");
    pillEl.className = `status-pill ${pill.cls}`;
    pillEl.textContent = pill.text;
    statusCell.appendChild(pillEl);
    cells.push(statusCell);
    const actCell = document.createElement("td");
    const actWrap = document.createElement("div");
    actWrap.className = "row-actions";
    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.className = "btn";
    detailBtn.textContent = t("detail", lang);
    detailBtn.dataset.action = "detail";
    detailBtn.dataset.id = p.id;
    const skBtn = document.createElement("button");
    skBtn.type = "button";
    skBtn.className = "btn";
    skBtn.textContent = t("kegSkBtn", lang);
    skBtn.dataset.action = "sk";
    skBtn.dataset.id = p.id;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn";
    delBtn.textContent = t("delete", lang);
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = p.id;
    actWrap.appendChild(detailBtn);
    actWrap.appendChild(skBtn);
    actWrap.appendChild(delBtn);
    actCell.appendChild(actWrap);
    cells.push(actCell);
    for (const c of cells) tr.appendChild(c);
    tbody.appendChild(tr);
  });
  $("keg-count").textContent =
    `${t("kegShowing", lang)} ${filtered.length} ${t("kegOf", lang)} ${items.length} ${t("kegRecords", lang)}`;

  // Desa cards
  const desaWrap = $("keg-desa-cards");
  desaWrap.innerHTML = "";
  for (const desa of DESA_LIST) {
    const desaData = items.filter((p) => p.desa === desa);
    const counts: Record<string, number> = {};
    for (const p of desaData) counts[p.jabatan] = (counts[p.jabatan] ?? 0) + 1;
    const card = document.createElement("div");
    card.className = "desa-card";
    const h = document.createElement("h4");
    h.textContent = desa;
    card.appendChild(h);
    const c = document.createElement("p");
    c.className = "count";
    c.textContent = `${desaData.length} ${t("kegStatTotal", lang).toLowerCase()}`;
    card.appendChild(c);
    const tags = document.createElement("div");
    tags.className = "tags";
    for (const [j, n] of Object.entries(counts)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = `${j}: ${n}`;
      tags.appendChild(tag);
    }
    card.appendChild(tags);
    const names = document.createElement("p");
    names.className = "count";
    names.textContent = desaData
      .slice(0, 3)
      .map((p) => p.nama)
      .join(", ");
    card.appendChild(names);
    desaWrap.appendChild(card);
  }

  // Lembaga
  const lemWrap = $("keg-lembaga-list");
  lemWrap.innerHTML = "";
  for (const l of LEMBAGA) {
    const card = document.createElement("div");
    card.className = "lembaga-card";
    const h = document.createElement("h4");
    h.textContent = `${l.name} — ${l.fullId}`;
    card.appendChild(h);
    const p = document.createElement("p");
    p.textContent = lang === "id" ? l.descId : l.descEn;
    card.appendChild(p);
    lemWrap.appendChild(card);
  }
  renderQuickStats();
}

function kegShowDetail(p: Perangkat): void {
  const dlg = $("keg-detail") as HTMLDialogElement;
  const pill = kegStatusPill(p);
  const days = daysUntilEnd(p);
  $("keg-detail-title").textContent = `${t("kegDetailTitle", lang)} — ${p.nama}`;
  const rows: Array<[string, string]> = [
    [t("kegUnitCol", lang), p.unit === "kecamatan" ? t("kegUnitKecOpt", lang) : t("kegUnitDesaOpt", lang)],
    ["Jabatan", p.jabatan],
    ["Desa", p.desa],
    ["NIK", p.nik || "—"],
    ["TTL", `${p.tempatLahir}, ${formatDateId(p.tglLahir)}`],
    ["Agama", p.agama],
    ["No. HP", p.noHp || "—"],
    ["Masa bhakti", `${formatDateId(p.masaMulai)} – ${formatDateId(p.masaSelesai)}`],
    [
      "Status",
      days < 0
        ? `${pill.text} (${-days} ${t("kegNotifDaysAgo", lang)})`
        : `${pill.text} (${days} ${t("kegNotifDays", lang)})`,
    ],
    ["Alamat", p.alamat || "—"],
  ];
  const body = $("keg-detail-body");
  body.innerHTML = "";
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    body.appendChild(dt);
    body.appendChild(dd);
  }
  if (!dlg.open) dlg.showModal();
}

function kegSetLetterField(key: string, value: string): void {
  const el = document.getElementById(`letter-field-${key}`) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
  if (el) el.value = value;
}

function kegOpenSk(p: Perangkat): void {
  const sel = $("letter-template") as HTMLSelectElement;
  sel.value = "sk-pengangkatan";
  currentTemplate = TEMPLATES.find((tp) => tp.id === "sk-pengangkatan") ?? TEMPLATES[0];
  renderLetterFields();
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  kegSetLetterField("tanggal", today);
  kegSetLetterField("nama", p.nama);
  kegSetLetterField("nik", p.nik);
  kegSetLetterField("jabatan", p.jabatan);
  kegSetLetterField("desa", p.desa);
  kegSetLetterField("masaMulai", formatDateId(p.masaMulai));
  kegSetLetterField("masaSelesai", formatDateId(p.masaSelesai));
  document.querySelector<HTMLButtonElement>('[data-tab="letters"]')?.click();
}

/** Switch the form's position + village selects to match the chosen unit. */
function kegSetUnit(unit: "kecamatan" | "desa"): void {
  const jabSel = $("keg-in-jabatan") as HTMLSelectElement;
  const desaSel = $("keg-in-desa") as HTMLSelectElement;
  if (unit === "kecamatan") {
    kegFillSelect(jabSel, JABATAN_KECAMATAN, "—");
    desaSel.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = KECAMATAN_LABEL;
    opt.textContent = KECAMATAN_LABEL;
    desaSel.appendChild(opt);
    desaSel.value = KECAMATAN_LABEL;
    desaSel.disabled = true;
  } else {
    kegFillSelect(jabSel, JABATAN_LIST, "—");
    kegFillSelect(desaSel, DESA_LIST, "—");
    desaSel.disabled = false;
  }
}

function initKepegawaian(): void {
  kegFillSelect($("keg-in-agama") as HTMLSelectElement, AGAMA_LIST, "—");
  // Unit select (form) + unit filter — values are stable ids, labels are i18n.
  const unitSel = $("keg-in-unit") as HTMLSelectElement;
  unitSel.innerHTML = "";
  for (const [value, key] of [
    ["desa", "kegUnitDesaOpt"],
    ["kecamatan", "kegUnitKecOpt"],
  ] as const) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t(key, lang);
    unitSel.appendChild(opt);
  }
  unitSel.value = "desa";
  const unitFilter = $("keg-filter-unit") as HTMLSelectElement;
  unitFilter.innerHTML = "";
  for (const [value, label] of [
    ["", t("kegFilterUnit", lang)],
    ["kecamatan", t("kegUnitKecOpt", lang)],
    ["desa", t("kegUnitDesaOpt", lang)],
  ] as const) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    unitFilter.appendChild(opt);
  }
  kegSetUnit("desa");
  kegFillSelect(
    $("keg-filter-desa") as HTMLSelectElement,
    DESA_LIST,
    t("kegFilterDesa", lang),
  );
  kegFillSelect(
    $("keg-filter-jabatan") as HTMLSelectElement,
    [...new Set([...JABATAN_LIST, ...JABATAN_KECAMATAN])],
    t("kegFilterJabatan", lang),
  );
  renderKepegawaian();

  unitSel.addEventListener("change", () => {
    kegSetUnit(unitSel.value as "kecamatan" | "desa");
  });
  $("keg-search").addEventListener("input", renderKepegawaian);
  $("keg-filter-desa").addEventListener("change", renderKepegawaian);
  $("keg-filter-unit").addEventListener("change", renderKepegawaian);
  $("keg-filter-jabatan").addEventListener("change", renderKepegawaian);
  $("keg-filter-status").addEventListener("change", renderKepegawaian);

  $("keg-table-body").addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement).closest("button[data-action]") as
      | HTMLButtonElement
      | null;
    if (!btn || !btn.dataset.id) return;
    const p = kegItems.find((x) => x.id === btn.dataset.id);
    if (!p) return;
    if (btn.dataset.action === "detail") {
      kegShowDetail(p);
      return;
    }
    if (btn.dataset.action === "sk") {
      kegOpenSk(p);
      return;
    }
    if (btn.dataset.action === "delete") {
      if (!window.confirm(`${t("delete", lang)} ${p.nama}?`)) return;
      kegItems = kegItems.filter((x) => x.id !== p.id);
      savePerangkat(kegItems);
      if (svc) void syncPerangkatToFirestore(svc, kegItems).then(() => setFirebaseChip());
      renderKepegawaian();
      setStatus($("keg-form-status"), t("kegDeleted", lang));
    }
  });

  $("keg-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const val = (id: string): string =>
      ($(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value.trim();
    const nama = val("keg-in-nama");
    const tempat = val("keg-in-tempat");
    const tglLahir = val("keg-in-tgl");
    const agama = val("keg-in-agama");
    const jabatan = val("keg-in-jabatan");
    const unit = val("keg-in-unit") as "kecamatan" | "desa";
    const desa = unit === "kecamatan" ? KECAMATAN_LABEL : val("keg-in-desa");
    const masaMulai = val("keg-in-mulai");
    const masaSelesai = val("keg-in-selesai");
    const nik = val("keg-in-nik");
    const errs: string[] = [];
    if (!nama || !tempat || !tglLahir || !agama || !jabatan || !desa || !masaMulai || !masaSelesai) {
      errs.push(t("kegNeedName", lang));
    }
    if (nik && !/^\d{16}$/.test(nik)) errs.push(t("kegNikInvalid", lang));
    if (masaMulai && masaSelesai && masaSelesai <= masaMulai) errs.push(t("kegDateInvalid", lang));
    if (tglLahir) {
      const dd = new Date();
      const todayStr = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
      if (tglLahir > todayStr) errs.push(t("kegBirthInvalid", lang));
    }
    if (errs.length > 0) {
      setStatus($("keg-form-status"), errs.join(" "), true);
      return;
    }
    const np: Perangkat = {
      id: `k-${Date.now()}`,
      nama,
      nik,
      tempatLahir: tempat,
      tglLahir,
      agama,
      jabatan,
      desa,
      unit,
      noHp: val("keg-in-hp"),
      masaMulai,
      masaSelesai,
      alamat: val("keg-in-alamat"),
    };
    kegItems = [...kegItems, np];
    savePerangkat(kegItems);
    if (svc) void syncPerangkatToFirestore(svc, kegItems).then(() => setFirebaseChip());
    ($("keg-form") as HTMLFormElement).reset();
    // reset() clears the unit select too — restore the desa default.
    ($("keg-in-unit") as HTMLSelectElement).value = "desa";
    kegSetUnit("desa");
    renderKepegawaian();
    setStatus($("keg-form-status"), t("kegSaved", lang));
  });

  $("keg-summarize").addEventListener("click", async () => {
    const btn = $("keg-summarize") as HTMLButtonElement;
    const status = $("keg-sum-status");
    const wrap = $("keg-sum-output-wrap");
    const output = $("keg-sum-output");
    const badge = $("keg-sum-badge");
    const reason = $("keg-sum-reason");
    const recap = buildKepegawaianSummary(kegItems);
    wrap.hidden = false;
    if (!svc || svc.status !== "ready") {
      output.textContent = recap;
      badge.textContent = t("badgeUnknown", lang);
      badge.className = "badge badge-unknown";
      reason.textContent = t("kegSumOfflineNote", lang);
      setStatus(status, "");
      return;
    }
    btn.disabled = true;
    setStatus(status, t("statusThinking", lang));
    output.textContent = "";
    try {
      const prompt = [
        "Buat ringkasan eksekutif kepegawaian perangkat desa dalam Bahasa Indonesia formal dan singkat, berdasarkan rekap berikut.",
        "Sorot: berapa yang masa bhaktinya habis, siapa yang akan habis dalam 90 hari, dan apa tindak lanjut yang disarankan untuk kecamatan.",
        "Jangan menambahkan fakta di luar rekap.",
        "",
        "REKAP:",
        recap,
      ].join("\n");
      const result = await generateStream(
        svc,
        prompt,
        { forceCloud: true, onDevice },
        (text) => {
          output.textContent = text;
        },
      );
      showBadge(badge, reason, result.source, result.route.reason);
      setStatus(status, "");
    } catch (e) {
      console.error("DesaAI: kepegawaian summary failed", e);
      // Fail soft: never leave the officer with an empty panel — the
      // offline recap is always available, even when the AI call fails.
      output.textContent = recap;
      badge.textContent = t("badgeUnknown", lang);
      badge.className = "badge badge-unknown";
      reason.textContent = t("kegSumOfflineNote", lang);
      setStatus(status, t("statusAiError", lang), true);
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------- IKM (Indeks Kepuasan Masyarakat) ----------

let ikmItems: IkmResponse[] = [];

function ikmFmt(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

function renderIkm(): void {
  ikmItems = loadIkm();
  const stats = computeIkm(ikmItems);
  const scoreEl = $("ikm-score");
  scoreEl.textContent = stats.count === 0 ? "–" : ikmFmt(stats.overall);
  scoreEl.dataset.score = String(stats.overall);
  const catEl = $("ikm-category");
  catEl.textContent =
    stats.count === 0 ? "" : `${stats.category} — ${t(`ikmCat${stats.category}`, lang)}`;
  catEl.className = `badge ${
    stats.category === "A"
      ? "badge-device"
      : stats.category === "B"
        ? "badge-cloud"
        : "badge-unknown"
  }`;
  $("ikm-count").textContent = `${stats.count} ${t("ikmRespondents", lang)}`;
  // Per-element bars (values only — no inputs here).
  const bars = $("ikm-bars");
  bars.innerHTML = "";
  IKM_ELEMENTS.forEach((el, i) => {
    const avg = stats.perElement[i] ?? 0;
    const row = document.createElement("div");
    row.className = "ikm-bar";
    const label = document.createElement("span");
    label.className = "ikm-bar-label";
    label.textContent = lang === "id" ? el.labelId : el.labelEn;
    const track = document.createElement("div");
    track.className = "ikm-track";
    const fill = document.createElement("div");
    fill.className = "ikm-fill";
    fill.style.width = `${Math.round((avg / 4) * 100)}%`;
    // Band color: green ≥ 3.5, amber 2.5–3.5, red below 2.5 (scale 1–4).
    fill.dataset.band = avg >= 3.5 ? "good" : avg >= 2.5 ? "mid" : "low";
    track.appendChild(fill);
    const value = document.createElement("span");
    value.className = "ikm-bar-value";
    value.dataset.avg = String(avg);
    value.textContent = stats.count === 0 ? "–" : ikmFmt(avg);
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    bars.appendChild(row);
  });
  const elLabel = (idx: number): string =>
    lang === "id" ? IKM_ELEMENTS[idx].labelId : IKM_ELEMENTS[idx].labelEn;
  $("ikm-lowest").textContent =
    stats.count === 0
      ? "–"
      : `${elLabel(stats.minIdx)} (${ikmFmt(stats.perElement[stats.minIdx])})`;
  $("ikm-highest").textContent =
    stats.count === 0
      ? "–"
      : `${elLabel(stats.maxIdx)} (${ikmFmt(stats.perElement[stats.maxIdx])})`;
  // Keep the survey-type select in sync with the current language.
  const suratSel = $("ikm-in-surat") as HTMLSelectElement;
  const prevSurat = suratSel.value;
  suratSel.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "—";
  suratSel.appendChild(ph);
  for (const tp of TEMPLATES) {
    const opt = document.createElement("option");
    opt.value = tp.id;
    opt.textContent = lang === "id" ? tp.nameId : tp.nameEn;
    suratSel.appendChild(opt);
  }
  suratSel.value = prevSurat;
  // Share section: survey deep link + QR code (generated locally, offline).
  const link = surveyLink();
  ($("ikm-survey-link") as HTMLInputElement).value = link;
  const qrBox = $("ikm-qr");
  const qr = makeQr(link);
  if (qr) {
    qrBox.innerHTML = qr.svg;
    qrBox.dataset.qrReady = "1";
  } else {
    qrBox.innerHTML = "";
    qrBox.dataset.qrReady = "";
  }
  const wa = $("ikm-qr-wa") as HTMLAnchorElement;
  wa.href = `https://wa.me/?text=${encodeURIComponent(ikmShareSurveyText(link))}`;
  buildIkmQuestions();
  renderQuickStats();
}

function buildIkmQuestions(): void {
  // Preserve in-progress answers across re-renders (e.g. language toggle).
  const wrap = $("ikm-questions");
  const prev: Array<number | null> = IKM_ELEMENTS.map((_, i) => {
    const checked = wrap.querySelector<HTMLInputElement>(
      `input[name="ikm-q${i}"]:checked`,
    );
    return checked ? Number(checked.value) : null;
  });
  wrap.innerHTML = "";
  IKM_ELEMENTS.forEach((el, i) => {
    const fs = document.createElement("fieldset");
    fs.className = "ikm-q";
    const legend = document.createElement("legend");
    legend.textContent = `${i + 1}. ${lang === "id" ? el.labelId : el.labelEn}`;
    fs.appendChild(legend);
    const radios = document.createElement("div");
    radios.className = "ikm-radios";
    for (let v = 1; v <= 4; v += 1) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `ikm-q${i}`;
      input.value = String(v);
      if (prev[i] === v) input.checked = true;
      const span = document.createElement("span");
      span.textContent = t(`ikmScale${v}`, lang);
      label.appendChild(input);
      label.appendChild(span);
      radios.appendChild(label);
    }
    fs.appendChild(radios);
    wrap.appendChild(fs);
  });
}

async function ikmShare(text: string): Promise<void> {
  const status = $("ikm-share-status");
  const outWrap = $("ikm-share-output-wrap");
  const out = $("ikm-share-output") as HTMLTextAreaElement;
  outWrap.hidden = true;
  out.value = "";
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ text });
      setStatus(status, t("ikmShared", lang));
      return;
    }
  } catch {
    // Fall through to clipboard.
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setStatus(status, t("ikmCopied", lang));
      return;
    }
  } catch {
    // Fall through to the manual-copy box.
  }
  out.value = text;
  outWrap.hidden = false;
  setStatus(status, t("ikmCopyManual", lang));
}

function initIkm(): void {
  renderIkm();
  $("ikm-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const scores: number[] = [];
    let complete = true;
    for (let i = 0; i < IKM_ELEMENTS.length; i += 1) {
      const checked = document.querySelector<HTMLInputElement>(
        `input[name="ikm-q${i}"]:checked`,
      );
      if (!checked) {
        complete = false;
        break;
      }
      scores.push(Number(checked.value));
    }
    const jenisSurat = ($("ikm-in-surat") as HTMLSelectElement).value;
    if (!complete || !jenisSurat) {
      setStatus($("ikm-form-status"), t("ikmNeedAll", lang), true);
      return;
    }
    const resp: IkmResponse = {
      id: `ikm-${Date.now()}`,
      nama: ($("ikm-in-nama") as HTMLInputElement).value.trim(),
      jenisSurat,
      scores,
      komentar: ($("ikm-in-komentar") as HTMLTextAreaElement).value.trim(),
      createdAt: Date.now(),
    };
    ikmItems = [...ikmItems, resp];
    saveIkm(ikmItems);
    if (svc) void syncIkmToFirestore(svc, ikmItems).then(() => setFirebaseChip());
    ($("ikm-form") as HTMLFormElement).reset();
    renderIkm();
    setStatus($("ikm-form-status"), t("ikmSaved", lang));
  });
  $("ikm-share-survey").addEventListener("click", () => {
    void ikmShare(ikmShareSurveyText(surveyLink()));
  });
  $("ikm-share-results").addEventListener("click", () => {
    const stats = computeIkm(ikmItems);
    void ikmShare(ikmShareResultsText(stats, surveyLink()));
  });
  $("ikm-export").addEventListener("click", () => {
    const stats = computeIkm(ikmItems);
    const fmt = (v: number): string => v.toFixed(2).replace(".", ",");
    const lines = [
      "Hasil IKM — Pelayanan Surat, Kecamatan Simpangkatis",
      `Tanggal;${new Date().toLocaleDateString("id-ID")}`,
      `Skor IKM;${fmt(stats.overall)}`,
      `Kategori;${stats.category}`,
      `Responden;${stats.count}`,
      "",
      "Unsur;Rata-rata",
      ...IKM_ELEMENTS.map(
        (el, i) => `${lang === "id" ? el.labelId : el.labelEn};${fmt(stats.perElement[i] ?? 0)}`,
      ),
    ];
    downloadFile(
      `ikm-hasil-${new Date().toISOString().slice(0, 10)}.csv`,
      lines.join("\n"),
      "text/csv;charset=utf-8",
    );
    setStatus($("ikm-share-status"), t("ikmExported", lang));
  });
  $("ikm-qr-copy").addEventListener("click", async () => {
    const link = ($("ikm-survey-link") as HTMLInputElement).value;
    const ok = await copyText(link);
    if (ok) {
      setStatus($("ikm-share-status"), t("ikmLinkCopied", lang));
      return;
    }
    const out = $("ikm-share-output") as HTMLTextAreaElement;
    out.value = link;
    $("ikm-share-output-wrap").hidden = false;
    setStatus($("ikm-share-status"), t("ikmCopyManual", lang), true);
  });
  $("ikm-qr-download").addEventListener("click", () => {
    const link = ($("ikm-survey-link") as HTMLInputElement).value;
    const qr = makeQr(link);
    if (!qr) {
      setStatus($("ikm-share-status"), t("ikmQrFailed", lang), true);
      return;
    }
    const a = document.createElement("a");
    a.href = qr.dataUrl(8);
    a.download = "qr-survei-ikm.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus($("ikm-share-status"), t("ikmQrDownloaded", lang));
  });
  $("ikm-to-pengaduan").addEventListener("click", () => {
    document.querySelector<HTMLButtonElement>('[data-tab="pengaduan"]')?.click();
  });
}

// ---------- Pengaduan ----------

let aduItems: Aduan[] = [];
let agendaItems: AgendaEntry[] = [];

function aduStatusPill(status: AduanStatus): { text: string; cls: string } {
  if (status === "baru") return { text: t("aduStatusBaru", lang), cls: "baru" };
  if (status === "diproses")
    return { text: t("aduStatusDiproses", lang), cls: "diproses" };
  return { text: t("aduStatusSelesai", lang), cls: "selesai" };
}

function renderPengaduan(): void {
  aduItems = loadAduan();
  const stats = computeAduanStats(aduItems);
  $("adu-stat-baru").textContent = String(stats.baru);
  $("adu-stat-diproses").textContent = String(stats.diproses);
  $("adu-stat-selesai").textContent = String(stats.selesai);
  const filterSel = $("adu-filter-status") as HTMLSelectElement;
  const prevFilter = filterSel.value as AduanStatus | "";
  filterSel.innerHTML = "";
  for (const [value, key] of [
    ["", "aduFilterStatus"],
    ["baru", "aduStatusBaru"],
    ["diproses", "aduStatusDiproses"],
    ["selesai", "aduStatusSelesai"],
  ] as const) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t(key, lang);
    filterSel.appendChild(opt);
  }
  filterSel.value = prevFilter;
  const jenisFilterSel = $("adu-filter-jenis") as HTMLSelectElement;
  const prevJenisFilter = jenisFilterSel.value;
  jenisFilterSel.innerHTML = "";
  const allJenis = document.createElement("option");
  allJenis.value = "";
  allJenis.textContent = t("aduFilterJenis", lang);
  jenisFilterSel.appendChild(allJenis);
  ADUAN_JENIS.forEach((j, i) => {
    const opt = document.createElement("option");
    opt.value = j;
    opt.textContent = t(`aduJenis${i + 1}`, lang);
    jenisFilterSel.appendChild(opt);
  });
  jenisFilterSel.value = prevJenisFilter;
  const list = filterAduan(aduItems, prevFilter, prevJenisFilter);
  const wrap = $("adu-list");
  wrap.innerHTML = "";
  $("adu-empty").hidden = list.length > 0;
  for (const a of list) {
    const div = document.createElement("div");
    div.className = "draft-item aduan-item";
    div.dataset.id = a.id;
    const h = document.createElement("h3");
    h.textContent = a.nama || t("ikmAnon", lang);
    if (isAduanDemoRecord(a)) {
      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = t("kegDemoBadge", lang);
      h.appendChild(badge);
    }
    div.appendChild(h);
    const meta = document.createElement("p");
    const tpl = TEMPLATES.find((tp) => tp.id === a.jenisSurat);
    const suratName = tpl ? (lang === "id" ? tpl.nameId : tpl.nameEn) : a.jenisSurat;
    meta.textContent = `${a.jenis} • ${suratName} • ${new Date(a.createdAt).toLocaleString()}${a.kontak ? ` • ${a.kontak}` : ""}`;
    div.appendChild(meta);
    const isi = document.createElement("p");
    isi.textContent = a.isi;
    div.appendChild(isi);
    const row = document.createElement("div");
    row.className = "actions";
    const pill = aduStatusPill(a.status);
    const pillEl = document.createElement("span");
    pillEl.className = `status-pill ${pill.cls}`;
    pillEl.textContent = pill.text;
    row.appendChild(pillEl);
    const sel = document.createElement("select");
    sel.className = "aduan-status";
    sel.dataset.id = a.id;
    sel.setAttribute("aria-label", t("aduFilterStatus", lang));
    for (const [value, key] of [
      ["baru", "aduStatusBaru"],
      ["diproses", "aduStatusDiproses"],
      ["selesai", "aduStatusSelesai"],
    ] as const) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = t(key, lang);
      sel.appendChild(opt);
    }
    sel.value = a.status;
    row.appendChild(sel);
    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.className = "btn";
    detailBtn.textContent = t("detail", lang);
    detailBtn.dataset.id = a.id;
    row.appendChild(detailBtn);
    div.appendChild(row);
    wrap.appendChild(div);
  }
  $("adu-count").textContent =
    `${t("kegShowing", lang)} ${list.length} ${t("kegOf", lang)} ${aduItems.length} ${t("kegRecords", lang)}`;
  // Keep the form selects in sync with the current language.
  const jenisSel = $("adu-in-jenis") as HTMLSelectElement;
  const prevJenis = jenisSel.value;
  jenisSel.innerHTML = "";
  const phJ = document.createElement("option");
  phJ.value = "";
  phJ.textContent = "—";
  jenisSel.appendChild(phJ);
  ADUAN_JENIS.forEach((j, i) => {
    const opt = document.createElement("option");
    opt.value = j;
    opt.textContent = t(`aduJenis${i + 1}`, lang);
    jenisSel.appendChild(opt);
  });
  jenisSel.value = prevJenis;
  const suratSel = $("adu-in-surat") as HTMLSelectElement;
  const prevSurat = suratSel.value;
  suratSel.innerHTML = "";
  const phS = document.createElement("option");
  phS.value = "";
  phS.textContent = "—";
  suratSel.appendChild(phS);
  for (const tp of TEMPLATES) {
    const opt = document.createElement("option");
    opt.value = tp.id;
    opt.textContent = lang === "id" ? tp.nameId : tp.nameEn;
    suratSel.appendChild(opt);
  }
  suratSel.value = prevSurat;
  renderQuickStats();
}

function aduShowDetail(a: Aduan): void {
  const dlg = $("adu-detail") as HTMLDialogElement;
  const pill = aduStatusPill(a.status);
  const tpl = TEMPLATES.find((tp) => tp.id === a.jenisSurat);
  const suratName = tpl ? (lang === "id" ? tpl.nameId : tpl.nameEn) : a.jenisSurat;
  $("adu-detail-title").textContent = `${t("aduDetailTitle", lang)} — ${a.nama || t("ikmAnon", lang)}`;
  const rows: Array<[string, string]> = [
    [t("aduJenis", lang), a.jenis],
    [t("aduLetterType", lang), suratName],
    [t("aduFilterStatus", lang), pill.text],
    [t("aduKontak", lang), a.kontak || "—"],
    ["Tanggal", new Date(a.createdAt).toLocaleString()],
  ];
  const body = $("adu-detail-body");
  body.innerHTML = "";
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    body.appendChild(dt);
    body.appendChild(dd);
  }
  $("adu-detail-isi").textContent = a.isi;
  if (!dlg.open) dlg.showModal();
}

function initPengaduan(): void {
  renderPengaduan();
  $("adu-filter-status").addEventListener("change", renderPengaduan);
  $("adu-filter-jenis").addEventListener("change", renderPengaduan);
  $("adu-export").addEventListener("click", () => {
    const rows = [
      ["Tanggal", "Nama", "Jenis", "Layanan surat", "Status", "Kontak", "Isi"],
      ...aduItems.map((a) => {
        const tpl = TEMPLATES.find((tp) => tp.id === a.jenisSurat);
        const statusKey =
          a.status === "baru"
            ? "aduStatusBaru"
            : a.status === "diproses"
              ? "aduStatusDiproses"
              : "aduStatusSelesai";
        return [
          new Date(a.createdAt).toLocaleString("id-ID"),
          a.nama || t("ikmAnon", lang),
          a.jenis,
          tpl ? (lang === "id" ? tpl.nameId : tpl.nameEn) : a.jenisSurat,
          t(statusKey, lang),
          a.kontak,
          a.isi,
        ];
      }),
    ];
    downloadFile(
      `pengaduan-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r) => r.map(csvEscape).join(";")).join("\n"),
      "text/csv;charset=utf-8",
    );
    setStatus($("adu-export-status"), t("aduExported", lang));
  });
  $("adu-list").addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement).closest(
      "button[data-id]",
    ) as HTMLButtonElement | null;
    if (!btn || !btn.dataset.id) return;
    const a = aduItems.find((x) => x.id === btn.dataset.id);
    if (a) aduShowDetail(a);
  });
  $("adu-list").addEventListener("change", (ev) => {
    const sel = (ev.target as HTMLElement).closest(
      "select.aduan-status",
    ) as HTMLSelectElement | null;
    if (!sel || !sel.dataset.id) return;
    const next = sel.value as AduanStatus;
    aduItems = aduItems.map((a) =>
      a.id === sel.dataset.id ? { ...a, status: next } : a,
    );
    saveAduan(aduItems);
    if (svc) void syncAduanToFirestore(svc, aduItems).then(() => setFirebaseChip());
    renderPengaduan();
    setStatus($("adu-form-status"), t("aduStatusChanged", lang));
  });
  $("adu-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const jenis = ($("adu-in-jenis") as HTMLSelectElement).value;
    const jenisSurat = ($("adu-in-surat") as HTMLSelectElement).value;
    const isi = ($("adu-in-isi") as HTMLTextAreaElement).value.trim();
    if (!jenis || !isi) {
      setStatus($("adu-form-status"), t("aduNeedIsi", lang), true);
      return;
    }
    const aduan: Aduan = {
      id: `adu-${Date.now()}`,
      nama: ($("adu-in-nama") as HTMLInputElement).value.trim(),
      jenis,
      jenisSurat,
      isi,
      kontak: ($("adu-in-kontak") as HTMLInputElement).value.trim(),
      status: "baru",
      createdAt: Date.now(),
    };
    aduItems = [...aduItems, aduan];
    saveAduan(aduItems);
    if (svc) void syncAduanToFirestore(svc, aduItems).then(() => setFirebaseChip());
    ($("adu-form") as HTMLFormElement).reset();
    renderPengaduan();
    setStatus($("adu-form-status"), t("aduSaved", lang));
  });
}

// ---------- Buku Agenda Surat (Paket 11) ----------

function renderAgenda(): void {
  agendaItems = loadAgenda();
  const stats = computeAgendaStats(agendaItems);
  $("agenda-stat-masuk").textContent = String(stats.masuk);
  $("agenda-stat-keluar").textContent = String(stats.keluar);
  $("agenda-stat-belum").textContent = String(stats.belum);
  const arahSel = $("agenda-filter-arah") as HTMLSelectElement;
  const prevArah = arahSel.value as AgendaArah | "";
  arahSel.innerHTML = "";
  for (const [value, key] of [
    ["", "agendaFilterArah"],
    ["masuk", "agendaArahMasuk"],
    ["keluar", "agendaArahKeluar"],
  ] as const) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t(key, lang);
    arahSel.appendChild(opt);
  }
  arahSel.value = prevArah;
  const statusSel = $("agenda-filter-status") as HTMLSelectElement;
  const prevStatus = statusSel.value as AgendaStatus | "";
  statusSel.innerHTML = "";
  for (const [value, key] of [
    ["", "agendaFilterStatus"],
    ["baru", "aduStatusBaru"],
    ["diproses", "aduStatusDiproses"],
    ["selesai", "aduStatusSelesai"],
  ] as const) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t(key, lang);
    statusSel.appendChild(opt);
  }
  statusSel.value = prevStatus;
  const list = filterAgenda(agendaItems, prevArah, prevStatus);
  const wrap = $("agenda-list");
  wrap.innerHTML = "";
  $("agenda-empty").hidden = list.length > 0;
  for (const e of list) {
    const div = document.createElement("div");
    div.className = "draft-item aduan-item";
    div.dataset.id = e.id;
    const h = document.createElement("h3");
    h.textContent = `${e.nomorAgenda} — ${e.perihal}`;
    if (isAgendaDemoRecord(e)) {
      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = t("kegDemoBadge", lang);
      h.appendChild(badge);
    }
    div.appendChild(h);
    const meta = document.createElement("p");
    meta.textContent = `${e.arah === "masuk" ? t("agendaArahMasuk", lang) : t("agendaArahKeluar", lang)} • ${e.pihak} • ${new Date(e.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}${e.nomorSurat ? ` • ${e.nomorSurat}` : ""}${e.disposisi ? ` • ${e.disposisi}` : ""}`;
    div.appendChild(meta);
    const row = document.createElement("div");
    row.className = "actions";
    const pill = aduStatusPill(e.status);
    const pillEl = document.createElement("span");
    pillEl.className = `status-pill ${pill.cls}`;
    pillEl.textContent = pill.text;
    row.appendChild(pillEl);
    const sel = document.createElement("select");
    sel.className = "aduan-status";
    sel.dataset.id = e.id;
    sel.setAttribute("aria-label", t("agendaFilterStatus", lang));
    for (const [value, key] of [
      ["baru", "aduStatusBaru"],
      ["diproses", "aduStatusDiproses"],
      ["selesai", "aduStatusSelesai"],
    ] as const) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = t(key, lang);
      sel.appendChild(opt);
    }
    sel.value = e.status;
    row.appendChild(sel);
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn";
    delBtn.textContent = t("delete", lang);
    delBtn.dataset.id = e.id;
    row.appendChild(delBtn);
    div.appendChild(row);
    wrap.appendChild(div);
  }
  $("agenda-count").textContent =
    `${t("kegShowing", lang)} ${list.length} ${t("kegOf", lang)} ${agendaItems.length} ${t("kegRecords", lang)}`;
  // Keep the form disposisi select in sync with the current language.
  const dispSel = $("agenda-in-disposisi") as HTMLSelectElement;
  const prevDisp = dispSel.value;
  dispSel.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = t("agendaDisposisiNone", lang);
  dispSel.appendChild(noneOpt);
  for (const d of AGENDA_DISPOSISI) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    dispSel.appendChild(opt);
  }
  dispSel.value = prevDisp;
  renderAgendaCalendar();
}

// ---------- Paket 19 — Kalender Agenda ----------
// Monthly calendar over the mail register: each day that has register
// entries is marked with a count badge; tapping a day lists that day's
// entries below. Local data only (loadAgenda, by tanggal, local date) —
// a month with no entries simply shows no marks. Never invented.

let agendaCalYear = new Date().getFullYear();
let agendaCalMonth = new Date().getMonth();
let agendaCalSelected: string | null = null; // "YYYY-MM-DD" (local date)

function agendaDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function agendaEntriesByDay(items: AgendaEntry[]): Map<string, AgendaEntry[]> {
  const map = new Map<string, AgendaEntry[]>();
  for (const e of items) {
    const key = agendaDayKey(e.tanggal);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

function agendaCalDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    lang === "id" ? "id-ID" : "en-US",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
}

function renderAgendaCalendar(): void {
  const cal = $("agenda-cal");
  cal.dataset.calYear = String(agendaCalYear);
  cal.dataset.calMonth = String(agendaCalMonth);
  ($("agenda-cal-prev") as HTMLButtonElement).setAttribute(
    "aria-label",
    t("agendaCalPrev", lang),
  );
  ($("agenda-cal-next") as HTMLButtonElement).setAttribute(
    "aria-label",
    t("agendaCalNext", lang),
  );
  $("agenda-cal-label").textContent = new Date(
    agendaCalYear,
    agendaCalMonth,
    1,
  ).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const byDay = agendaEntriesByDay(agendaItems);
  const today = new Date();
  const todayKey = agendaDayKey(today.getTime());
  if (!agendaCalSelected) agendaCalSelected = todayKey;
  const grid = $("agenda-cal-grid");
  grid.innerHTML = "";
  // Weekday header, Monday first (5 Jan 2026 was a Monday).
  const wdRow = document.createElement("div");
  wdRow.className = "agenda-cal-weekdays";
  for (let i = 0; i < 7; i++) {
    const cell = document.createElement("span");
    cell.textContent = new Date(2026, 0, 5 + i).toLocaleDateString(
      lang === "id" ? "id-ID" : "en-US",
      { weekday: "short" },
    );
    wdRow.appendChild(cell);
  }
  grid.appendChild(wdRow);
  const lead = (new Date(agendaCalYear, agendaCalMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(agendaCalYear, agendaCalMonth + 1, 0).getDate();
  for (let i = 0; i < lead; i++) {
    const blank = document.createElement("span");
    blank.className = "agenda-cal-blank";
    blank.setAttribute("aria-hidden", "true");
    grid.appendChild(blank);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${agendaCalYear}-${String(agendaCalMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entries = byDay.get(key) ?? [];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "agenda-cal-day" +
      (entries.length > 0 ? " has-entries" : "") +
      (key === todayKey ? " is-today" : "") +
      (key === agendaCalSelected ? " is-selected" : "");
    btn.dataset.date = key;
    btn.setAttribute(
      "aria-label",
      `${agendaCalDateLabel(key)} — ${entries.length} ${t("agendaCalEntries", lang)}`,
    );
    const num = document.createElement("span");
    num.className = "agenda-cal-num";
    num.textContent = String(day);
    btn.appendChild(num);
    if (entries.length > 0) {
      const badge = document.createElement("span");
      badge.className = "agenda-cal-badge";
      badge.textContent = String(entries.length);
      btn.appendChild(badge);
    }
    btn.addEventListener("click", () => {
      agendaCalSelected = key;
      renderAgendaCalendar();
    });
    grid.appendChild(btn);
  }
  // Detail: entries of the selected day (or the empty message).
  const detail = $("agenda-cal-detail");
  detail.innerHTML = "";
  const selected = agendaCalSelected ?? todayKey;
  const entries = byDay.get(selected) ?? [];
  const head = document.createElement("h4");
  head.className = "agenda-cal-detail-title";
  head.textContent = `${agendaCalDateLabel(selected)} — ${entries.length} ${t("agendaCalEntries", lang)}`;
  detail.appendChild(head);
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = t("agendaCalNoEntries", lang);
    detail.appendChild(p);
    return;
  }
  const sorted = [...entries].sort((a, b) => a.tanggal - b.tanggal);
  for (const e of sorted) {
    const div = document.createElement("div");
    div.className = "draft-item aduan-item";
    const h = document.createElement("h3");
    h.textContent = `${e.nomorAgenda} — ${e.perihal}`;
    div.appendChild(h);
    const meta = document.createElement("p");
    meta.textContent = `${e.arah === "masuk" ? t("agendaArahMasuk", lang) : t("agendaArahKeluar", lang)} • ${e.pihak}${e.nomorSurat ? ` • ${e.nomorSurat}` : ""}${e.disposisi ? ` • ${e.disposisi}` : ""}`;
    div.appendChild(meta);
    const row = document.createElement("div");
    row.className = "actions";
    const pill = aduStatusPill(e.status);
    const pillEl = document.createElement("span");
    pillEl.className = `status-pill ${pill.cls}`;
    pillEl.textContent = pill.text;
    row.appendChild(pillEl);
    div.appendChild(row);
    detail.appendChild(div);
  }
}

function initAgenda(): void {
  renderAgenda();
  const dateInput = $("agenda-in-tanggal") as HTMLInputElement;
  if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  $("agenda-filter-arah").addEventListener("change", renderAgenda);
  $("agenda-filter-status").addEventListener("change", renderAgenda);
  $("agenda-cal-prev").addEventListener("click", () => {
    agendaCalMonth -= 1;
    if (agendaCalMonth < 0) {
      agendaCalMonth = 11;
      agendaCalYear -= 1;
    }
    renderAgendaCalendar();
  });
  $("agenda-cal-next").addEventListener("click", () => {
    agendaCalMonth += 1;
    if (agendaCalMonth > 11) {
      agendaCalMonth = 0;
      agendaCalYear += 1;
    }
    renderAgendaCalendar();
  });
  $("agenda-cal-today").addEventListener("click", () => {
    const now = new Date();
    agendaCalYear = now.getFullYear();
    agendaCalMonth = now.getMonth();
    agendaCalSelected = agendaDayKey(now.getTime());
    renderAgendaCalendar();
  });
  $("agenda-export").addEventListener("click", () => {
    const rows = [
      ["No Agenda", "Arah", "No Surat", "Pengirim/Tujuan", "Perihal", "Tanggal", "Disposisi", "Status"],
      ...agendaItems.map((e) => [
        e.nomorAgenda,
        e.arah,
        e.nomorSurat,
        e.pihak,
        e.perihal,
        new Date(e.tanggal).toLocaleDateString("id-ID"),
        e.disposisi,
        t(
          e.status === "baru"
            ? "aduStatusBaru"
            : e.status === "diproses"
              ? "aduStatusDiproses"
              : "aduStatusSelesai",
          lang,
        ),
      ]),
    ];
    downloadFile(
      `agenda-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r) => r.map(csvEscape).join(";")).join("\n"),
      "text/csv;charset=utf-8",
    );
    setStatus($("agenda-export-status"), t("agendaExported", lang));
  });
  $("agenda-list").addEventListener("change", (ev) => {
    const sel = (ev.target as HTMLElement).closest(
      "select.aduan-status",
    ) as HTMLSelectElement | null;
    if (!sel || !sel.dataset.id) return;
    const next = sel.value as AgendaStatus;
    agendaItems = agendaItems.map((e) =>
      e.id === sel.dataset.id ? { ...e, status: next } : e,
    );
    saveAgenda(agendaItems);
    renderAgenda();
    setStatus($("agenda-form-status"), t("agendaStatusChanged", lang));
  });
  $("agenda-list").addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement).closest(
      "button[data-id]",
    ) as HTMLButtonElement | null;
    if (!btn || !btn.dataset.id) return;
    if (!confirm(t("agendaConfirmDelete", lang))) return;
    agendaItems = agendaItems.filter((e) => e.id !== btn.dataset.id);
    saveAgenda(agendaItems);
    renderAgenda();
    setStatus($("agenda-form-status"), t("agendaDeleted", lang));
  });
  $("agenda-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const pihak = ($("agenda-in-pihak") as HTMLInputElement).value.trim();
    const perihal = ($("agenda-in-perihal") as HTMLInputElement).value.trim();
    if (!pihak || !perihal) {
      setStatus($("agenda-form-status"), t("agendaFormError", lang), true);
      return;
    }
    const dateVal = ($("agenda-in-tanggal") as HTMLInputElement).value;
    const tanggal = dateVal ? new Date(`${dateVal}T00:00:00`).getTime() : Date.now();
    const entry = createAgendaEntry(agendaItems, {
      arah: ($("agenda-in-arah") as HTMLSelectElement).value as AgendaArah,
      nomorSurat: ($("agenda-in-nomor") as HTMLInputElement).value,
      pihak,
      perihal,
      tanggal,
      disposisi: ($("agenda-in-disposisi") as HTMLSelectElement).value,
    });
    agendaItems = [...agendaItems, entry];
    saveAgenda(agendaItems);
    ($("agenda-form") as HTMLFormElement).reset();
    ($("agenda-in-tanggal") as HTMLInputElement).value = new Date()
      .toISOString()
      .slice(0, 10);
    renderAgenda();
    setStatus($("agenda-form-status"), `${t("agendaAdded", lang)} ${entry.nomorAgenda}`);
  });
}

// ---------- boot ----------

async function boot(): Promise<void> {
  initTabs();
  initHome();
  initLetters();
  initSummarizer();
  initQa();
  initDrafts();
  initKepegawaian();
  initIkm();
  initPengaduan();
  initAgenda();
  initPalette();
  initMode();
  renderQuickStats();

  // Deep link: open the tab named by location.hash (e.g. #ikm for the survey).
  const initialTab = tabFromHash();
  if (initialTab) activateTab(initialTab, false);

  $("lang-toggle").addEventListener("click", () => {
    lang = lang === "en" ? "id" : "en";
    applyLang();
  });

  // Dark mode toggle (theme applied pre-paint by the <head> script).
  updateThemeButton();
  $("theme-toggle").addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  // Clear the print target after printing so the next print picks its own.
  window.addEventListener("afterprint", () => {
    delete document.body.dataset.printTarget;
  });

  // Paket 12 — PWA: network chip + service worker + re-sync on reconnect.
  // The worker only registers on http(s) origins (file:// cannot host one;
  // the app still works there without it) and never throws if it fails.
  setNetChip();
  window.addEventListener("online", () => {
    setNetChip();
    syncAllToFirestore();
  });
  window.addEventListener("offline", () => setNetChip());
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("./sw.js").catch((e) => {
      console.warn(
        "DesaAI: service worker registration failed (offline mode unavailable).",
        e,
      );
    });
  }

  // Firebase init (skipped silently in demo mode — no network calls).
  try {
    svc = await initFirebase();
  } catch (e) {
    console.error("DesaAI: Firebase init failed", e);
    svc = {
      status: "error",
      app: null,
      auth: null,
      db: null,
      ai: null,
      uid: null,
      appCheckEnabled: false,
      error: e instanceof Error ? e.message : String(e),
      cloudModel: "gemini-3.8-flash",
      onDeviceMaxChars: 12000,
    };
  }
  // Paket 8 — sync local data to Firestore on load, so answers saved
  // while Firebase/Auth was unavailable upload once the backend is ready.
  // Best-effort only: each sync guards on svc ready and never throws.
  // (Paket 12: the same sync re-runs on the "online" event below, so
  // entries written while offline upload when the network returns.)
  syncAllToFirestore();
  setFirebaseChip();
  $("config-banner").hidden = svc.status === "ready";

  // On-device availability probe (Chrome Prompt API). No network.
  onDevice = await probeOnDevice();
  setDeviceChip(onDevice);

  // Localized strings need the chips set after svc is known.
  applyLang();
  setFirebaseChip();
  setDeviceChip(onDevice);
}

boot().catch((e) => {
  console.error("DesaAI: boot failed", e);
  const banner = document.getElementById("config-banner");
  if (banner) {
    banner.hidden = false;
    banner.textContent = `DesaAI failed to start: ${e instanceof Error ? e.message : String(e)}`;
  }
});
