const CACHE_VERSION = 'wilms-v131-shell';
const SHELL_ASSETS = [
  '/login',
  '/collector/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/manifest.webmanifest',
];

const PAYMENT_SYNC_TAG = 'wilms-payment-sync';
const PAYMENT_SYNC_MESSAGE = 'WILMS_PAYMENT_SYNC';

function shouldBypassCache(pathname) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/capture/')
  );
}

function networkFetch(request) {
  const init = { redirect: 'follow' };
  if (request.mode === 'navigate') {
    return fetch(new Request(request.url, { ...init, mode: 'navigate' }));
  }
  return fetch(request, init);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        await Promise.allSettled(
          SHELL_ASSETS.map(async (asset) => {
            const response = await networkFetch(new Request(asset, { redirect: 'follow' }));
            if (response.ok && response.type !== 'opaqueredirect') {
              await cache.put(asset, response);
            }
          }),
        );
      })
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

  if (shouldBypassCache(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return networkFetch(request)
        .then((response) => {
          if (!response.ok || response.type === 'opaque' || response.type === 'opaqueredirect') {
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
