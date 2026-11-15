// DesaAI — Firebase initialization.
// Gemini Developer API (free tier) via Firebase AI Logic. No paid features.
// If the config is still the placeholder, the app runs in "demo mode":
// the UI works, drafts save locally, and AI calls explain what is missing
// instead of failing with a network error.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  fetchAndActivate,
  getNumber,
  getRemoteConfig,
  getString,
  type RemoteConfig,
} from "firebase/remote-config";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getAI, GoogleAIBackend, type AI } from "firebase/ai";
import { appCheckSiteKey, firebaseConfig } from "./firebase-config.js";

export type FirebaseStatus = "not-configured" | "ready" | "error";

export interface FirebaseServices {
  status: FirebaseStatus;
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  ai: AI | null;
  uid: string | null;
  appCheckEnabled: boolean;
  error: string | null;
  /** Cloud model name, from Remote Config (default: gemini-3.8-flash). */
  cloudModel: string;
  /** Prompts longer than this (chars) go straight to the cloud. */
  onDeviceMaxChars: number;
}

export const DEFAULT_CLOUD_MODEL = "gemini-3.8-flash";
export const DEFAULT_ON_DEVICE_MAX_CHARS = 12000;

/** True when the config still holds the placeholder values. */
export function isConfigured(): boolean {
  return Object.values(firebaseConfig).every(
    (v) => typeof v === "string" && v.length > 0 && !v.startsWith("YOUR_"),
  );
}

const EMPTY: FirebaseServices = {
  status: "not-configured",
  app: null,
  auth: null,
  db: null,
  ai: null,
  uid: null,
  appCheckEnabled: false,
  error: null,
  cloudModel: DEFAULT_CLOUD_MODEL,
  onDeviceMaxChars: DEFAULT_ON_DEVICE_MAX_CHARS,
};

export async function initFirebase(): Promise<FirebaseServices> {
  if (!isConfigured()) return { ...EMPTY };

  try {
    // App Check debug provider for local development.
    // The token comes from a gitignored env var, or auto-generates (the SDK
    // prints it in the console; register it in the Firebase console).
    // NEVER hardcode a debug token here.
    if (import.meta.env.DEV) {
      const token =
        import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
      (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
        token;
    }

    const app = initializeApp(firebaseConfig);

    let appCheckEnabled = false;
    if (appCheckSiteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckEnabled = true;
    }

    // Gemini Developer API backend. Limited-use App Check tokens are required
    // by generative models when App Check is enforced.
    const ai = getAI(app, {
      backend: new GoogleAIBackend(),
      ...(appCheckEnabled ? { useLimitedUseAppCheckTokens: true } : {}),
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Remote Config: model name + routing thresholds without redeploying.
    let cloudModel = DEFAULT_CLOUD_MODEL;
    let onDeviceMaxChars = DEFAULT_ON_DEVICE_MAX_CHARS;
    try {
      const rc: RemoteConfig = getRemoteConfig(app);
      rc.settings.minimumFetchIntervalMillis = import.meta.env.DEV
        ? 0
        : 60 * 60 * 1000;
      rc.defaultConfig = {
        cloud_model: DEFAULT_CLOUD_MODEL,
        on_device_max_chars: String(DEFAULT_ON_DEVICE_MAX_CHARS),
      };
      await fetchAndActivate(rc);
      const m = getString(rc, "cloud_model");
      if (m) cloudModel = m;
      const n = getNumber(rc, "on_device_max_chars");
      if (n > 0) onDeviceMaxChars = Math.floor(n);
    } catch (e) {
      // Remote Config is a nice-to-have; defaults keep the app working.
      console.warn("DesaAI: Remote Config unavailable, using defaults.", e);
    }

    let uid: string | null = null;
    try {
      const cred = await signInAnonymously(auth);
      uid = cred.user.uid;
    } catch (e) {
      console.warn("DesaAI: anonymous sign-in failed; drafts stay local.", e);
    }

    return {
      status: "ready",
      app,
      auth,
      db,
      ai,
      uid,
      appCheckEnabled,
      error: null,
      cloudModel,
      onDeviceMaxChars,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ...EMPTY, status: "error", error: message };
  }
}
