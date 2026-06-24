// Bump this version string every time you deploy an update.
// Changing it invalidates the old cache and forces the app to fetch fresh files.
const VERSION = 'v1.0.0';
const CACHE_NAME = 'swaraj-billing-' + VERSION;

const ASSETS = [
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activate new version immediately, don't wait for old tabs to close
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of any open tabs right away
});

// Network-first for the app HTML so opening the app always tries to fetch the latest version.
// Falls back to cache only if offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate' || req.url.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  // Cache-first for static assets (icons, manifest)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
