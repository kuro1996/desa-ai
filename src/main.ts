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
import { KB, kbEntryToText, matchKb, type KbEntry } from "./kb";
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
    const syarat = document.createElement("p");
    syarat.textContent = `Syarat: ${e.syaratId.join("; ")}`;
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
      ? ["Apa syarat membuat KTP?", "Bagaimana cara mengurus KK baru?", "Apa itu SKTM?"]
      : ["What do I need to apply for a KTP?", "How do I get a new KK?", "What is an SKTM?"];
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
  if (!svc) return;
  const list = $("drafts-list");
  const empty = $("drafts-empty");
  const drafts = await listDrafts(svc);
  list.innerHTML = "";
  empty.hidden = drafts.length > 0;
  for (const d of drafts) {
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
      await deleteDraft(svc as FirebaseServices, d);
      await refreshDrafts();
    });
    actions.appendChild(openBtn);
    actions.appendChild(delBtn);
    div.appendChild(actions);
    list.appendChild(div);
  }
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

// ---------- boot ----------

async function boot(): Promise<void> {
  initTabs();
  initLetters();
  initSummarizer();
  initQa();

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
