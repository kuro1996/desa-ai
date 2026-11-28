// DesaAI — Node cloud test WITH browser referer (diagnosis 28 Nov 2026).
// The plain node-cloud-test gets 403 API_KEY_HTTP_REFERRER_BLOCKED because
// Node sends no Referer. This variant injects the site's Referer/Origin so
// the call looks exactly like a browser call from kuro1996.github.io.
// Verdicts:
//   CLOUD_OK         -> key + model + API all fine; live failure must be App Check (reCAPTCHA token), which Node cannot replicate.
//   API_KEY_INVALID  -> the key in src/firebase-config.js is stale/deleted; fix = update config + rebuild + redeploy.
//   other 403/404    -> reported verbatim (no key printed, ever).
// Run: node scripts/node-cloud-test-referer.mjs  (ONE real Gemini call, free tier)
import { initializeApp } from "firebase/app";
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import { firebaseConfig } from "../src/firebase-config.js";

const SITE = "https://kuro1996.github.io/desa-ai/";
const origFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("googleapis.com")) {
    const headers = new Headers(init.headers || {});
    headers.set("Referer", SITE);
    headers.set("Origin", "https://kuro1996.github.io");
    init = { ...init, headers };
  }
  return origFetch(input, init);
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: "gemini-3.8-flash" });
  console.log("model: gemini-3.8-flash — sending prompt with site Referer...");
  const timeoutMs = 150000;
  const timeout = setTimeout(() => {
    console.error("NODE_CLOUD_FAIL: timed out after 150s");
    process.exit(3);
  }, timeoutMs);
  try {
    const result = await model.generateContent("Jawab singkat dalam Bahasa Indonesia: apa syarat membuat KTP?");
    clearTimeout(timeout);
    const text = result.response.text();
    console.log(`response length: ${text.length} chars`);
    console.log(`preview: ${text.slice(0, 300)}`);
    if (text.trim().length > 50) {
      console.log("\nVERDICT: CLOUD_OK — key + model + API work with browser referer.");
    } else {
      console.log("\nVERDICT: CLOUD_FAIL — empty/short response.");
      process.exit(2);
    }
  } catch (e) {
    clearTimeout(timeout);
    console.error("NODE_CLOUD_FAIL:", e instanceof Error ? e.message : String(e));
    process.exit(2);
  }
}

main();
