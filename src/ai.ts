// DesaAI — Firebase AI Logic HYBRID inference.
// Short/private prompts prefer the on-device model (Gemini Nano 4 via the
// Chrome Prompt API); long or complex prompts fall back to the cloud model
// (Gemini, Developer API free tier). The SDK reports the actual source used
// in `response.inferenceSource`, which the UI shows as a routing badge.
//
// Docs (fetched 2026-11-15):
// - https://firebase.google.com/docs/ai-logic/hybrid/web/get-started.md.txt
// - https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options.md.txt
// - https://firebase.google.com/docs/ai-logic/models.md.txt
import {
  getGenerativeModel,
  InferenceMode,
  type GenerativeModel,
} from "firebase/ai";
import {
  DEFAULT_CLOUD_MODEL,
  type FirebaseServices,
} from "./firebase";

export type InferenceSource = "ON_DEVICE" | "IN_CLOUD" | "UNKNOWN";
export type OnDeviceState =
  | "available"
  | "downloading"
  | "downloadable"
  | "unavailable"
  | "unsupported";

export type RouteReason = "short" | "long" | "fallback" | "forced-cloud";

export interface RouteDecision {
  /** true = use the cloud-only model; false = use the hybrid model. */
  useCloud: boolean;
  reason: RouteReason;
}

export interface GenerateResult {
  text: string;
  source: InferenceSource;
  route: RouteDecision;
  cloudModel: string;
}

const SYSTEM_PROMPT = [
  "You are DesaAI, a careful clerk assistant for Indonesian village (desa) and",
  "subdistrict (kecamatan) offices. You write formal Indonesian administrative",
  "letters and answer procedure questions accurately and concisely.",
  "Never invent names, numbers, dates, or regulations. If information is",
  "missing, say so plainly. Use formal Bahasa Indonesia for letters and",
  "procedure answers unless the user asks in English.",
].join(" ");

let hybridModel: GenerativeModel | null = null;
let cloudOnlyModel: GenerativeModel | null = null;
let deviceWarmUpStarted = false;

/** Probe the Chrome Prompt API directly to show on-device status in the UI. */
export async function probeOnDevice(): Promise<OnDeviceState> {
  const lm = (globalThis as unknown as Record<string, unknown>).LanguageModel as
    | { availability?: (opts?: unknown) => Promise<string> }
    | undefined;
  if (!lm || typeof lm.availability !== "function") return "unsupported";
  try {
    const state = String(await lm.availability());
    if (state === "available") return "available";
    if (state === "downloading") return "downloading";
    if (state === "downloadable") return "downloadable";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

/**
 * Start the on-device model download. MUST be called on/after a user gesture
 * (button click) and before the first query. Fire-and-forget: with
 * PREFER_ON_DEVICE the SDK falls back to the cloud while the download runs.
 */
export function warmUpDeviceModel(
  svc: FirebaseServices,
  onProgress?: (fraction: number) => void,
): void {
  if (deviceWarmUpStarted || !svc.ai) return;
  deviceWarmUpStarted = true;
  try {
    const model = getHybridModel(svc);
    if (typeof model.initializeDeviceModel === "function") {
      model.initializeDeviceModel((v: number) => onProgress?.(v));
    }
  } catch {
    // On-device unavailable — hybrid calls will fall back to the cloud.
  }
}

export function getHybridModel(svc: FirebaseServices): GenerativeModel {
  if (hybridModel) return hybridModel;
  if (!svc.ai) throw new Error("NOT_CONFIGURED");
  hybridModel = getGenerativeModel(svc.ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: {
      model: svc.cloudModel || DEFAULT_CLOUD_MODEL,
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    },
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages: ["en", "id"] }],
        expectedOutputs: [{ type: "text", languages: ["en", "id"] }],
        initialPrompts: [
          {
            role: "system",
            content: [{ type: "text", value: SYSTEM_PROMPT }],
          },
        ],
      },
    },
  });
  return hybridModel;
}

export function getCloudModel(svc: FirebaseServices): GenerativeModel {
  if (cloudOnlyModel) return cloudOnlyModel;
  if (!svc.ai) throw new Error("NOT_CONFIGURED");
  cloudOnlyModel = getGenerativeModel(svc.ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: svc.cloudModel || DEFAULT_CLOUD_MODEL,
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    },
  });
  return cloudOnlyModel;
}

/**
 * Decide which model to call. Short prompts try on-device first (the SDK
 * falls back to cloud automatically); long prompts go straight to the cloud
 * because on-device inference is capped at 9,216 input tokens.
 */
export function decideRoute(
  promptChars: number,
  svc: FirebaseServices,
  onDevice: OnDeviceState,
  forceCloud: boolean,
): RouteDecision {
  if (forceCloud || promptChars > svc.onDeviceMaxChars) {
    return { useCloud: true, reason: forceCloud ? "forced-cloud" : "long" };
  }
  if (onDevice === "unsupported" || onDevice === "unavailable") {
    // Still use the hybrid model — the SDK falls back to cloud and reports it.
    return { useCloud: false, reason: "fallback" };
  }
  return { useCloud: false, reason: "short" };
}

/** Stream a response; calls onChunk with the full accumulated text. */
export async function generateStream(
  svc: FirebaseServices,
  prompt: string,
  opts: { forceCloud: boolean; onDevice: OnDeviceState },
  onChunk: (text: string) => void,
): Promise<GenerateResult> {
  if (!svc.ai) throw new Error("NOT_CONFIGURED");
  const route = decideRoute(prompt.length, svc, opts.onDevice, opts.forceCloud);
  const model = route.useCloud ? getCloudModel(svc) : getHybridModel(svc);
  const result = await model.generateContentStream(prompt);
  let text = "";
  for await (const chunk of result.stream) {
    const t = chunk.text();
    if (t) {
      text += t;
      onChunk(text);
    }
  }
  const response = await result.response;
  const raw = (response as unknown as Record<string, unknown>).inferenceSource;
  const source: InferenceSource =
    raw === "ON_DEVICE" ? "ON_DEVICE" : raw === "IN_CLOUD" ? "IN_CLOUD" : "UNKNOWN";
  return { text, source, route, cloudModel: svc.cloudModel || DEFAULT_CLOUD_MODEL };
}
