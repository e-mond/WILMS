const CACHE_VERSION = 'wilms-v137-shell';
const SHELL_ASSETS = [
  '/login',
  '/collector/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/manifest.webmanifest',
];

const SHELL_ASSET_SET = new Set(SHELL_ASSETS);

const PAYMENT_SYNC_TAG = 'wilms-payment-sync';
const PAYMENT_SYNC_MESSAGE = 'WILMS_PAYMENT_SYNC';

function shouldBypassCache(pathname, request) {
  if (request.mode === 'navigate') {
    return true;
  }

  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/capture/')
  );
}

function networkFetch(request) {
  if (request.mode === 'navigate') {
    return fetch(request);
  }

  return fetch(request, { redirect: 'follow' });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.allSettled(
        SHELL_ASSETS.map(async (asset) => {
          const response = await networkFetch(new Request(asset, { redirect: 'follow' }));
          if (response.ok && response.type !== 'opaqueredirect') {
            await cache.put(asset, response);
          }
        }),
      );
    }),
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

  if (shouldBypassCache(url.pathname, request)) {
    return;
  }

  if (!SHELL_ASSET_SET.has(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return networkFetch(request).catch(() => caches.match('/login'));
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
