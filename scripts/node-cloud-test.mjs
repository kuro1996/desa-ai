// DesaAI — Node cloud-generation test (Sprint 2 quota window, free tier only).
// Bypasses this VM's headless-Chrome network (ERR_TUNNEL_CONNECTION_FAILED
// to Google endpoints) by calling the SAME cloud path from Node, where the
// endpoints are reachable: same Firebase project, same GoogleAIBackend,
// same model (gemini-3.8-flash), same ONLY_IN_CLOUD mode the app uses for
// long prompts. No App Check (enforcement is off), no keys printed.
// Run:  node scripts/node-cloud-test.mjs
// Makes ONE real Gemini call through Bos's Firebase project (free tier).
import { initializeApp } from "firebase/app";
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import { firebaseConfig } from "../src/firebase-config.js";

const PROMPT = [
  "Tulis draf Surat Undangan resmi berbahasa Indonesia yang singkat.",
  "Acara: Musyawarah Desa. Hari: Jumat, 20 November 2026. Waktu: 09.00 WIB.",
  "Tempat: Balai Desa. Tujuan: Ketua RT 01 s.d. RT 05.",
  "Gunakan format surat dinas desa yang formal. Maksimal 150 kata.",
].join(" ");

async function main() {
  const app = initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: "gemini-3.8-flash" });
  console.log("model: gemini-3.8-flash — sending prompt...");
  const timeoutMs = Number(process.env.CLOUD_TEST_TIMEOUT_MS || 150000);
  const timeout = setTimeout(() => {
    console.error(`NODE_CLOUD_FAIL: timed out after ${timeoutMs / 1000}s`);
    process.exit(3);
  }, timeoutMs);
  try {
    const result = await model.generateContent(PROMPT);
    clearTimeout(timeout);
    const text = result.response.text();
    console.log(`response length: ${text.length} chars`);
    console.log(`preview: ${text.slice(0, 400)}`);
    if (text.trim().length > 100) {
      console.log("\nVERDICT: NODE_CLOUD_OK — real Gemini cloud generation works.");
    } else {
      console.log("\nVERDICT: NODE_CLOUD_FAIL — empty/short response.");
      process.exit(2);
    }
  } catch (e) {
    clearTimeout(timeout);
    console.error("NODE_CLOUD_FAIL:", e instanceof Error ? e.message : String(e));
    process.exit(2);
  }
}

main();
