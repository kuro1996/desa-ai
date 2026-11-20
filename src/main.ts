// DesaAI — app wiring: tabs, language toggle, letter drafting,
// document summarizer, procedure Q&A (KB-grounded), drafts library.
import {
  generateStream,
  probeOnDevice,
  warmUpDeviceModel,
  type OnDeviceState,
} from "./ai";
import { deleteDraft, listDrafts, saveDraft, type Draft } from "./drafts";
import { initFirebase, type FirebaseServices } from "./firebase";
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
  AGAMA_LIST,
  buildKepegawaianSummary,
  computeNotifications,
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
  renderTemplateSelect();
  renderLetterFields();
  renderKbList();
  renderQaSuggestions();
  renderKepegawaian();
  renderIkm();
  renderPengaduan();
  void refreshDrafts();
}

// ---------- tabs ----------

function initTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const tab = btn.dataset.tab;
      document.querySelectorAll<HTMLElement>(".panel").forEach((p) => {
        p.hidden = p.id !== `panel-${tab}`;
      });
      if (tab === "drafts") void refreshDrafts();
      if (tab === "kepegawaian") renderKepegawaian();
      if (tab === "ikm") renderIkm();
      if (tab === "pengaduan") renderPengaduan();
    });
  });
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
    chip.textContent = t("firebaseReady", lang);
    chip.className = "chip chip-ok";
  } else {
    chip.textContent = `${t("firebaseError", lang)}: ${svc.error ?? ""}`;
    chip.className = "chip chip-warn";
  }
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

function downloadTxt(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

async function refreshDrafts(): Promise<void> {
  // Works even while Firebase init is still pending (svc === null):
  // local drafts are always listable; Firestore sync joins when ready.
  const list = $("drafts-list");
  const empty = $("drafts-empty");
  const drafts = await listDrafts(svc);
  list.innerHTML = "";
  empty.hidden = drafts.length > 0;
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
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn";
    delBtn.textContent = t("delete", lang);
    delBtn.addEventListener("click", async () => {
      await deleteDraft(svc, d);
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
    if (btn.dataset.action === "sk") {
      kegOpenSk(p);
      return;
    }
    if (btn.dataset.action === "delete") {
      if (!window.confirm(`${t("delete", lang)} ${p.nama}?`)) return;
      kegItems = kegItems.filter((x) => x.id !== p.id);
      savePerangkat(kegItems);
      if (svc) void syncPerangkatToFirestore(svc, kegItems);
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
    if (svc) void syncPerangkatToFirestore(svc, kegItems);
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
  buildIkmQuestions();
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
    if (svc) void syncIkmToFirestore(svc, ikmItems);
    ($("ikm-form") as HTMLFormElement).reset();
    renderIkm();
    setStatus($("ikm-form-status"), t("ikmSaved", lang));
  });
  $("ikm-share-survey").addEventListener("click", () => {
    void ikmShare(ikmShareSurveyText(window.location.href.split("#")[0]));
  });
  $("ikm-share-results").addEventListener("click", () => {
    const stats = computeIkm(ikmItems);
    void ikmShare(ikmShareResultsText(stats, window.location.href.split("#")[0]));
  });
  $("ikm-to-pengaduan").addEventListener("click", () => {
    document.querySelector<HTMLButtonElement>('[data-tab="pengaduan"]')?.click();
  });
}

// ---------- Pengaduan ----------

let aduItems: Aduan[] = [];

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
  const list = filterAduan(aduItems, prevFilter);
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
}

function initPengaduan(): void {
  renderPengaduan();
  $("adu-filter-status").addEventListener("change", renderPengaduan);
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
    if (svc) void syncAduanToFirestore(svc, aduItems);
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
    if (svc) void syncAduanToFirestore(svc, aduItems);
    ($("adu-form") as HTMLFormElement).reset();
    renderPengaduan();
    setStatus($("adu-form-status"), t("aduSaved", lang));
  });
}

// ---------- boot ----------

async function boot(): Promise<void> {
  initTabs();
  initLetters();
  initSummarizer();
  initQa();
  initKepegawaian();
  initIkm();
  initPengaduan();

  $("lang-toggle").addEventListener("click", () => {
    lang = lang === "en" ? "id" : "en";
    applyLang();
  });

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
