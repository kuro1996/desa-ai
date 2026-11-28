// DesaAI — service worker (Paket 12: PWA offline).
// Cache strategy — deliberate, and the reason each rule exists:
//
// - Navigations (index.html, the app shell): NETWORK-FIRST.
//   The shell must never go stale: a fresh deploy has to reach users on
//   their next online visit. The cached shell is ONLY a fallback when the
//   device is fully offline. Never precache index.html.
// - Hashed assets (/assets/index-*.js, *.css): CACHE-FIRST. The filename
//   hash changes on every build, so a cached entry can never be stale.
// - Other same-origin static files (images, manifest, icons): CACHE-FIRST.
//   Content-stable; a new service-worker version wipes the cache on
//   activate, so a changed image still refreshes on the next release.
// - Everything cross-origin (Firebase / Google APIs): NETWORK-ONLY, never
//   cached. API responses must never be served stale or stored offline.
//
// Bump CACHE_NAME on every release that changes the precached files.
// (Paket 30: daftar PRECACHE tidak berubah — hanya pola runtime untuk
// woff2 — jadi nama cache tetap v1; file sw.js yang berubah sudah cukup
// memicu update worker di browser.)
const CACHE_NAME = "desaai-v2";

// Content-stable shell files. index.html is deliberately NOT here.
const PRECACHE = [
  "./manifest.webmanifest",
  "./favicon.png",
  "./logo.png",
  "./kantor.jpg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  // Paket 32 — Anin faces (cropped from Bos's character sheet) + full body.
  "./anin-face-tersenyum.png",
  "./anin-face-senang.png",
  "./anin-face-terkagum.png",
  "./anin-face-sedih.png",
  "./anin-face-marah.png",
  "./anin-face-bingung.png",
  "./anin-face-takut.png",
  "./anin-face-malu.png",
  "./anin-face-bersemangat.png",
  "./anin-face-mengangguk.png",
  "./anin-depan.png",
];

const HASHED_ASSET = /\/assets\/[^/]+\.(?:js|css)$/;
const STATIC_FILE = /\.(?:png|jpe?g|svg|webmanifest|woff2)$/;

self.addEventListener("install", (event) => {
  // Precache one file at a time: a single missing file must not fail the
  // whole install (and leave the app with no worker at all).
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((e) => {
            console.warn("DesaAI SW: precache skipped", url, e);
          }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Cross-origin (Firebase/Google APIs): network only, never cached.
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (HASHED_ASSET.test(url.pathname) || STATIC_FILE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
  // Anything else same-origin (e.g. sw.js itself): default network behavior.
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (e) {
    // Offline: serve the cached shell (any of its URL spellings).
    const cached =
      (await cache.match(request)) ||
      (await cache.match("./index.html")) ||
      (await cache.match("./"));
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}
