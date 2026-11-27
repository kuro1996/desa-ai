// DesaAI — PWA service-worker test (Node vm harness, no browser needed).
// Drives dist/sw.js in a vm with stubbed CacheStorage/fetch and asserts the
// cache strategy the app depends on:
//   - navigations (index.html): NETWORK-FIRST, cached shell only as an
//     offline fallback — a fresh deploy must never serve a stale shell;
//   - hashed assets (/assets/index-*.js/css): CACHE-FIRST;
//   - cross-origin (Firebase/Google APIs): NETWORK-ONLY, never cached;
//   - index.html is never precached; activate deletes old caches.
//
// WHY NOT A REAL BROWSER: a service worker needs an http(s) origin.
// file:// cannot host one, and this VM's Chrome build blocks http://
// 127.0.0.1 navigations with Local Network Access checks (all
// --disable-features flag variants were tried 2026-11-23 and still
// block), so no HTTP origin is reachable from headless Chrome here.
// The live site (https://kuro1996.github.io/desa-ai/) is the real
// browser proof — see docs/VERIFICATION.md.
//
// Run after `npm run build`:
//   npm run test:pwa
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import vm from "node:vm";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const ORIGIN = "https://kuro1996.github.io";
const SCOPE = `${ORIGIN}/desa-ai/`;

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

// ---------- in-memory CacheStorage stub ----------
class FakeCache {
  constructor() {
    this.store = new Map();
  }
  _key(req) {
    const raw = typeof req === "string" ? req : req.url;
    return new URL(raw, SCOPE).href;
  }
  async match(req) {
    return this.store.get(this._key(req));
  }
  async put(req, res) {
    this.store.set(this._key(req), res);
  }
  async add(url) {
    const res = await fakeFetch(url);
    if (!res || !res.ok) throw new Error(`precache fetch failed: ${url}`);
    await this.put(url, res);
  }
}

class FakeCaches {
  constructor() {
    this.caches = new Map();
  }
  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new FakeCache());
    return this.caches.get(name);
  }
  async keys() {
    return [...this.caches.keys()];
  }
  async delete(name) {
    return this.caches.delete(name);
  }
}

// ---------- stub network ----------
// network: Map URL-href -> body string. offline=true makes fetch throw
// (the way a dead network looks to a worker).
const network = new Map();
const fetchCalls = new Map();
let offline = false;

async function fakeFetch(input) {
  const href = new URL(typeof input === "string" ? input : input.url, SCOPE).href;
  fetchCalls.set(href, (fetchCalls.get(href) ?? 0) + 1);
  if (offline) throw new TypeError("Failed to fetch");
  if (network.has(href)) return new Response(network.get(href), { status: 200 });
  return new Response("not found", { status: 404 });
}

function pngSize(path) {
  const b = readFileSync(path);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

async function main() {
  if (!existsSync(join(DIST, "sw.js"))) {
    console.error("FAIL: dist/sw.js missing — run `npm run build` first.");
    process.exit(1);
  }
  const swSrc = readFileSync(join(DIST, "sw.js"), "utf8");
  // The worker's cache name changes when the precache list changes
  // (Paket 32: desaai-v2) — read it from the built worker, never hardcode.
  const cacheName = swSrc.match(/const CACHE_NAME = "([^"]+)"/)?.[1] ?? "desaai-v1";

  // 1. Static files shipped.
  check(
    "dist ships sw.js + manifest + 3 PWA icons",
    ["sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png"].every((f) =>
      existsSync(join(DIST, f)),
    ),
  );

  // 2. Manifest is valid + icons match their declared sizes.
  const manifest = JSON.parse(readFileSync(join(DIST, "manifest.webmanifest"), "utf8"));
  const iconOk = manifest.icons.every((icon) => {
    const [w, h] = icon.sizes.split("x").map(Number);
    const actual = pngSize(join(DIST, icon.src.replace(/^\.\//, "")));
    return actual.w === w && actual.h === h;
  });
  check(
    "manifest valid (standalone, ./ scope, icons match real PNG sizes)",
    manifest.display === "standalone" &&
      manifest.start_url === "./" &&
      manifest.scope === "./" &&
      iconOk,
    `icons=${manifest.icons.map((i) => i.sizes).join(",")}`,
  );

  // 3. PRECACHE list: shell files only — index.html must NOT be in it.
  const precacheSrc = swSrc.slice(swSrc.indexOf("const PRECACHE = ["), swSrc.indexOf("];", swSrc.indexOf("const PRECACHE = [")));
  const precacheHas = (s) => precacheSrc.includes(s);
  check(
    "PRECACHE holds manifest + images + icons, never index.html / sw.js / assets",
    ["manifest.webmanifest", "favicon.png", "logo.png", "kantor.jpg", "icon-192.png", "icon-512.png"].every(precacheHas) &&
      !precacheHas("index.html") &&
      !precacheHas("sw.js") &&
      !precacheHas("/assets/"),
    precacheSrc.replace(/\s+/g, " ").slice(0, 160),
  );

  // 4. Load the worker in a vm and drive its events.
  const handlers = {};
  let claimed = false;
  const fakeCaches = new FakeCaches();
  const sandbox = {
    console,
    URL,
    Response,
    Request,
    caches: fakeCaches,
    fetch: fakeFetch,
    clients: { claim: async () => { claimed = true; } },
  };
  sandbox.self = sandbox;
  sandbox.self.location = new URL(`${SCOPE}sw.js`);
  sandbox.self.addEventListener = (type, fn) => {
    handlers[type] = fn;
  };
  vm.createContext(sandbox);
  vm.runInContext(swSrc, sandbox);
  check("worker registers install + activate + fetch handlers", ["install", "activate", "fetch"].every((t) => typeof handlers[t] === "function"));

  async function dispatch(type, event) {
    const promises = [];
    event.waitUntil = (p) => promises.push(p);
    event.respondWith = (p) => promises.push(p);
    handlers[type](event);
    return Promise.all(promises);
  }
  const navReq = (url) => ({ method: "GET", url, mode: "navigate" });
  const assetReq = (url) => ({ method: "GET", url, mode: "cors" });

  // Seed the stub network: shell v1, hashed assets, one image, one API URL.
  const JS_URL = `${SCOPE}assets/index-DiKc4jkg.js`;
  const CSS_URL = `${SCOPE}assets/index-UtH5gVSz.css`;
  const IMG_URL = `${SCOPE}kantor.jpg`;
  // Paket 32 — Anin faces + full body (precached by the worker).
  const ANIN_IMGS = [
    "anin-face-tersenyum.png",
    "anin-face-senang.png",
    "anin-face-terkagum.png",
    "anin-face-sedih.png",
    "anin-face-marah.png",
    "anin-face-bingung.png",
    "anin-face-takut.png",
    "anin-face-malu.png",
    "anin-face-bersemangat.png",
    "anin-face-mengangguk.png",
    "anin-depan.png",
  ];
  const API_URL = "https://firestore.googleapis.com/v1/projects/desaai-b6b3b/databases/(default)/documents";
  for (const url of [`${SCOPE}manifest.webmanifest`, `${SCOPE}favicon.png`, `${SCOPE}logo.png`, IMG_URL, `${SCOPE}icon-192.png`, `${SCOPE}icon-512.png`, `${SCOPE}icon-512-maskable.png`, ...ANIN_IMGS.map((f) => `${SCOPE}${f}`)]) {
    network.set(url, `static:${url.split("/").pop()}`);
  }
  network.set(JS_URL, "/* bundle v1 */");
  network.set(CSS_URL, "/* css v1 */");
  network.set(API_URL, '{"documents":[]}');

  // 5. Install precaches exactly the PRECACHE files.
  await dispatch("install", {});
  const cache = await fakeCaches.open(cacheName);
  const precached = [...cache.store.keys()].sort();
  check(
    "install precaches the 7 shell files + 11 Anin images (no index.html)",
    precached.length === 18 && precached.every((u) => !u.endsWith("index.html")),
    `${precached.length} entries`,
  );

  // 6. Navigation online: network-first serves v1 and caches the shell.
  network.set(`${SCOPE}index.html`, "<html>v1 shell</html>");
  network.set(SCOPE, "<html>v1 shell</html>");
  let [res] = await dispatch("fetch", { request: navReq(`${SCOPE}index.html`) });
  check("navigation online serves the network shell (v1)", (await res.text()) === "<html>v1 shell</html>");
  const cachedShell = await cache.match(`${SCOPE}index.html`);
  check("navigation online caches the shell for offline fallback", cachedShell !== undefined);

  // 7. Navigation offline: cached shell is served.
  offline = true;
  [res] = await dispatch("fetch", { request: navReq(`${SCOPE}index.html`) });
  check("navigation offline serves the cached shell (v1)", (await res.text()) === "<html>v1 shell</html>");
  offline = false;

  // 8. Freshness: a new deploy's shell (v2) wins over the cached v1.
  network.set(`${SCOPE}index.html`, "<html>v2 shell</html>");
  [res] = await dispatch("fetch", { request: navReq(`${SCOPE}index.html`) });
  check("navigation online after a new deploy serves the FRESH shell (v2, not stale v1)", (await res.text()) === "<html>v2 shell</html>");
  const freshCached = await cache.match(`${SCOPE}index.html`);
  check("fresh shell replaces the cached copy", (await freshCached.text()) === "<html>v2 shell</html>");

  // 9. Hashed JS: cache-first — fetched once, then served offline with no fetch.
  fetchCalls.clear();
  [res] = await dispatch("fetch", { request: assetReq(JS_URL) });
  check("hashed JS fetched from network on first load", (await res.text()) === "/* bundle v1 */" && fetchCalls.get(JS_URL) === 1);
  offline = true;
  [res] = await dispatch("fetch", { request: assetReq(JS_URL) });
  check("hashed JS served from cache offline (no second fetch)", (await res.text()) === "/* bundle v1 */" && fetchCalls.get(JS_URL) === 1);
  offline = false;

  // 10. Hashed CSS + static image: same cache-first behavior.
  [res] = await dispatch("fetch", { request: assetReq(CSS_URL) });
  const cssFirst = (await res.text()) === "/* css v1 */";
  offline = true;
  [res] = await dispatch("fetch", { request: assetReq(CSS_URL) });
  const cssOffline = (await res.text()) === "/* css v1 */";
  [res] = await dispatch("fetch", { request: assetReq(IMG_URL) });
  const imgOffline = (await res.text()) === "static:kantor.jpg";
  offline = false;
  check("hashed CSS + static image served from cache offline", cssFirst && cssOffline && imgOffline);

  // 11. Cross-origin API: the worker does not intercept it at all
  // (pass-through to the network, never cached). No respondWith = the
  // browser performs the fetch itself, outside the worker.
  fetchCalls.clear();
  const apiHandled = await dispatch("fetch", { request: assetReq(API_URL) });
  const apiCached = await cache.match(API_URL);
  check(
    "cross-origin API is not intercepted (pass-through) and never cached",
    apiHandled.length === 0 && fetchCalls.get(API_URL) === undefined && apiCached === undefined &&
      swSrc.includes("url.origin !== self.location.origin"),
    `respondWith calls=${apiHandled.length}`,
  );

  // 12. Activate deletes old caches and claims clients.
  const oldCache = await fakeCaches.open("desaai-v0");
  await oldCache.put(`${SCOPE}index.html`, new Response("old"));
  await dispatch("activate", {});
  const keys = await fakeCaches.keys();
  check(
    `activate deletes old caches, keeps ${cacheName}, claims clients`,
    !keys.includes("desaai-v0") && keys.includes(cacheName) && claimed,
    `caches=${keys.join(",")}`,
  );

  // 13. Offline navigation with an empty cache fails closed (no wrong page).
  const emptyCaches = new FakeCaches();
  sandbox.caches = emptyCaches;
  offline = true;
  let threw = false;
  try {
    await dispatch("fetch", { request: navReq(`${SCOPE}index.html`) });
  } catch {
    threw = true;
  }
  offline = false;
  check("offline navigation with no cached shell rejects instead of serving a wrong page", threw);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) FAILED.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("FAIL: pwa-test harness error:", e);
  process.exit(1);
});
