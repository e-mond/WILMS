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
