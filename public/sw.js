/* BookVault service worker — minimal offline shell + runtime cache.
   Strategy:
   - Precache app shell on install.
   - Network-first for HTML navigations (always try latest UI).
   - Stale-while-revalidate for static assets and book cover images.
   - Bypass everything else (Supabase, AI gateway, analytics).
*/
const VERSION = 'v1';
const SHELL_CACHE = `bv-shell-${VERSION}`;
const RUNTIME_CACHE = `bv-runtime-${VERSION}`;
const SHELL_ASSETS = ['/', '/manifest.webmanifest', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isCoverImage = (url) =>
  url.hostname.includes('books.google.com') ||
  url.hostname.includes('covers.openlibrary.org') ||
  url.hostname.includes('googleusercontent.com');

const isStaticAsset = (url) => /\.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|gif|ico)$/i.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Bypass third-party APIs and same-origin API/edge functions.
  if (url.pathname.startsWith('/functions/') || url.hostname.includes('supabase.co')) return;

  // Network-first for navigations.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  // Stale-while-revalidate for static assets & covers.
  if (url.origin === self.location.origin ? isStaticAsset(url) : isCoverImage(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});