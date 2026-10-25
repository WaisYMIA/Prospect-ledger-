// Prospect Ledger — service worker
//
// This only caches the app shell (this HTML file, its manifest, and icons) so
// the app opens instantly — even offline, even on a fresh cold start — and so
// browsers consider it installable. Your actual data (prospects, settings)
// never touches this cache; that all lives in IndexedDB, handled entirely by
// index.html itself.
//
// Bump CACHE_NAME whenever you deploy a new version of index.html so devices
// pick up the update instead of serving a stale cached copy forever. This is
// also literally how the app detects "there's an update": the browser diffs
// THIS FILE byte-for-byte against what it has cached, and a changed
// CACHE_NAME guarantees this file differs.
//
// New versions install in the background but deliberately do NOT activate
// themselves — they wait until index.html tells them to (via the "Update
// Now" button), so the app never swaps files out from under someone
// mid-task. See the SKIP_WAITING message handler below.

const CACHE_NAME = 'prospect-ledger-shell-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    // Deliberately no self.skipWaiting() here — a newly installed worker
    // waits until the page explicitly asks it to take over.
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// index.html sends this once the user taps "Update Now" on the in-app banner.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Stale-while-revalidate: serve the cached app shell instantly for speed and
// offline support, while quietly fetching the network version in the
// background to keep the cache fresh for next time.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
