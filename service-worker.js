/* Otti JGA Quiz — Service Worker
   Cached die App beim ersten Laden -> danach komplett offline nutzbar. */
const CACHE = "otti-jga-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./quizdata.js",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // einzeln cachen, damit ein evtl. fehlendes Asset die Installation nicht kippt
    await Promise.allSettled(ASSETS.map((a) => c.add(a)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      const copy = res.clone();
      const c = await caches.open(CACHE);
      c.put(e.request, copy).catch(() => {});
      return res;
    } catch (err) {
      // offline + nicht im Cache: bei Navigationen die App-Shell liefern
      if (e.request.mode === "navigate") return caches.match("./index.html");
      throw err;
    }
  })());
});
