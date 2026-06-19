const CACHE_NAME = 'wilms-shell-v1';
const PAYMENT_SYNC_TAG = 'wilms-payment-sync';
const PAYMENT_SYNC_MESSAGE = 'WILMS_PAYMENT_SYNC';
const SHELL_URLS = ['/login', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached ?? caches.match('/login')),
    ),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag !== PAYMENT_SYNC_TAG) {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: PAYMENT_SYNC_MESSAGE });
      });
    }),
  );
});
