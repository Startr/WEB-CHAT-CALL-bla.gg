const CACHE_NAME = 'blagg-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/gun.js',
  '/webrtc.js',
  'https://startr.style/style.css',
  'https://cdn.jsdelivr.net/npm/gun/gun.min.js',
  'https://cdn.jsdelivr.net/npm/gun/sea.js',
  'https://unpkg.com/hyperscript'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 