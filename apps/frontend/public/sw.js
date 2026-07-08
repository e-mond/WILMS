const CACHE_VERSION = 'wilms-v130-shell';
const SHELL_ASSETS = [
  '/',
  '/login',
  '/collector/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
];

const PAYMENT_SYNC_TAG = 'wilms-payment-sync';
const PAYMENT_SYNC_MESSAGE = 'WILMS_PAYMENT_SYNC';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response.ok || response.type === 'opaque') {
            return response;
          }

          const copy = response.clone();
          if (
            request.destination === 'document' ||
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'image'
          ) {
            void caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }

          return response;
        })
        .catch(() => caches.match('/login'));
    }),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag !== PAYMENT_SYNC_TAG) {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: PAYMENT_SYNC_MESSAGE });
      }
    }),
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {};
  const title = payload.title ?? 'WILMS';
  const options = {
    body: payload.body ?? '',
    data: { url: payload.url ?? '/', category: payload.category ?? 'general' },
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
