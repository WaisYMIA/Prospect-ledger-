// Prospect Ledger — service worker
// App version is defined here AND in index.html (APP_VERSION) AND version.json.
// Do not edit by hand: run `node tools/bump-version.js <new-version>` instead.
//
// Only the app shell is cached (HTML, manifest, icons). Your data lives in
// IndexedDB and is never touched by this worker. A new worker installs in the
// background but waits (no skipWaiting) until the page sends 'SKIP_WAITING'
// when you tap "Update now", so nothing changes under you mid-task.

const VERSION = '2.3.0';
const CACHE_NAME = 'prospect-ledger-shell-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './theme.js',
  './reportkit.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/logo-256.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache:'reload' bypasses the browser HTTP cache so we never store stale files
      Promise.all(ASSETS.map((url) =>
        fetch(new Request(url, { cache: 'reload' })).then((res) => {
          if (!res.ok) throw new Error('Failed to cache ' + url);
          return cache.put(url, res);
        })
      ))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('prospect-ledger-shell-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: VERSION });
});

// Stale-while-revalidate for same-origin GETs. version.json is always fetched
// live (it is how the app learns a newer version exists). Cross-origin
// requests (Google Sheets sync, AI assistant) are left alone entirely.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;
  if (url.pathname.includes('/api/') || url.pathname.includes('/team/')) return;   // server edition: never cache API or manager pages

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || networkFetch;
    })
  );
});
