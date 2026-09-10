const CACHE_NAME = 'hidden-gems-v2';
const SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/csv.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE_NAME).map(x => caches.delete(x)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.pathname.endsWith('.csv') || url.pathname.includes('spots.csv')) {
    e.respondWith(
      fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(r => {
          if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); }
          return r;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request))
  );
});
